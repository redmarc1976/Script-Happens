from datetime import date
from typing import List, Optional

import azure.functions as func
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import ClientPrincipal, get_current_principal, get_current_user
from booking import (
    persist_bookings,
    select_desks,
    user_booked_days,
    user_holiday_days,
)
from database import get_db
from graph_calendar import (
    GraphAPIError,
    GraphAuthError,
    MailboxNotProvisionedError,
    UserNotFoundError,
    work_location_by_day,
)
from models import Booking, Desk, User


app = func.FunctionApp()
fast_api = FastAPI()

class HealthCheck(BaseModel):
    status: str = "OK"


class DayLocation(BaseModel):
    date: str
    location: str  # "office" | "remote" | "unknown"
    source: Optional[str] = None


class WorkLocationResponse(BaseModel):
    user: str
    days: List[DayLocation]


@fast_api.get("/api/health", response_model=HealthCheck)
def health_check():
    return HealthCheck()


class MeResponse(BaseModel):
    id: str
    full_name: str
    email: str
    upn: Optional[str]
    team: str
    role: str
    location: str
    preferred_neighbourhood: Optional[str]
    identity_provider: str
    is_manager: bool
    reports: List[str]

    class Config:
        from_attributes = True


class DeskResponse(BaseModel):
    id: str
    name: str
    floor: str
    neighbourhood: str
    x: float
    y: float


class AutoBookRequest(BaseModel):
    target_upn: str
    start: date
    end: date


class BookingResult(BaseModel):
    date: str
    desk_id: Optional[str] = None
    desk_name: Optional[str] = None
    skipped_reason: Optional[str] = None


class AutoBookResponse(BaseModel):
    target_user: str
    booked: List[BookingResult]
    skipped: List[BookingResult]


def _resolve_target(db: Session, identifier: str) -> User:
    target = (
        db.query(User)
        .filter((User.upn == identifier) | (User.email == identifier))
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
    return target


def _authorize_for_target(caller: User, target: User) -> None:
    if target.id == caller.id:
        return
    if target.line_manager_email and target.line_manager_email == caller.email:
        return
    raise HTTPException(status_code=403, detail="Not authorized for this user")


@fast_api.get("/api/users/me", response_model=MeResponse)
def get_me(
    principal: ClientPrincipal = Depends(get_current_principal),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the logged-in user's DB record, matched by UPN from SWA auth."""
    reports = (
        db.query(User).filter(User.line_manager_email == user.email).all()
    )
    return MeResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        upn=user.upn,
        team=user.team,
        role=user.role,
        location=user.location,
        preferred_neighbourhood=user.preferred_neighbourhood,
        identity_provider=principal.identity_provider,
        is_manager=len(reports) > 0,
        reports=[r.upn or r.email for r in reports],
    )


@fast_api.get(
    "/api/desks",
    response_model=List[DeskResponse],
    dependencies=[Depends(get_current_user)],
)
def list_desks(db: Session = Depends(get_db)):
    rows = db.query(Desk).order_by(Desk.id.asc()).all()
    return [
        DeskResponse(
            id=d.id,
            name=d.name,
            floor=d.floor,
            neighbourhood=d.neighbourhood,
            x=d.x,
            y=d.y,
        )
        for d in rows
    ]


@fast_api.post("/api/auto-book", response_model=AutoBookResponse)
async def auto_book(
    body: AutoBookRequest,
    caller: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.end < body.start:
        raise HTTPException(status_code=400, detail="end must be >= start")
    target = _resolve_target(db, body.target_upn)
    _authorize_for_target(caller, target)

    try:
        graph_days = await work_location_by_day(
            target.upn or target.email, body.start, body.end
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MailboxNotProvisionedError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except GraphAuthError as exc:
        raise HTTPException(status_code=500, detail=f"Auth error: {exc}") from exc
    except GraphAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    office_dates = [
        date.fromisoformat(d["date"]) for d in graph_days if d["location"] == "office"
    ]
    already_booked = user_booked_days(db, target.id, body.start, body.end)
    holiday_set = user_holiday_days(db, target.id, body.start, body.end)

    skipped: List[BookingResult] = []
    bookable: List[date] = []
    for d in office_dates:
        ds = d.isoformat()
        if ds in already_booked:
            skipped.append(BookingResult(date=ds, skipped_reason="already booked"))
        elif ds in holiday_set:
            skipped.append(BookingResult(date=ds, skipped_reason="on holiday"))
        else:
            bookable.append(d)

    selections = select_desks(db, target, bookable)

    booked: List[BookingResult] = []
    to_persist: dict[str, Optional[str]] = {}
    for d in bookable:
        ds = d.isoformat()
        desk_id = selections.get(ds)
        if desk_id is None:
            skipped.append(BookingResult(date=ds, skipped_reason="no available desk"))
            continue
        desk = db.query(Desk).filter(Desk.id == desk_id).first()
        booked.append(
            BookingResult(date=ds, desk_id=desk_id, desk_name=desk.name if desk else None)
        )
        to_persist[ds] = desk_id

    persist_bookings(db, target.id, to_persist)
    return AutoBookResponse(
        target_user=target.upn or target.email, booked=booked, skipped=skipped
    )


@fast_api.get("/api/bookings", response_model=List[BookingResult])
def list_bookings(
    user: str = Query(..., description="UPN or email"),
    start: date = Query(...),
    end: date = Query(...),
    caller: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if end < start:
        raise HTTPException(status_code=400, detail="end must be >= start")
    target = _resolve_target(db, user)
    _authorize_for_target(caller, target)

    rows = (
        db.query(Booking)
        .filter(Booking.user_id == target.id)
        .filter(Booking.booking_date >= start.isoformat())
        .filter(Booking.booking_date <= end.isoformat())
        .order_by(Booking.booking_date.asc())
        .all()
    )
    return [
        BookingResult(
            date=b.booking_date,
            desk_id=b.desk_id,
            desk_name=b.desk.name if b.desk else None,
        )
        for b in rows
    ]


@fast_api.get("/api/work-location", response_model=WorkLocationResponse)
async def work_location(
    user: str = Query(..., description="User principal name or object id"),
    start: date = Query(..., description="Inclusive start date, YYYY-MM-DD"),
    end: date = Query(..., description="Inclusive end date, YYYY-MM-DD"),
):
    if end < start:
        raise HTTPException(status_code=400, detail="end must be >= start")
    try:
        days = await work_location_by_day(user, start, end)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MailboxNotProvisionedError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except GraphAuthError as exc:
        raise HTTPException(status_code=500, detail=f"Auth error: {exc}") from exc
    except GraphAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return WorkLocationResponse(user=user, days=days)


@app.route(route="{*route}", auth_level=func.AuthLevel.ANONYMOUS)
async def http_trigger(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    return await func.AsgiMiddleware(fast_api).handle_async(req, context)
