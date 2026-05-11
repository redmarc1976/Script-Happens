from datetime import date
from typing import List, Optional

import azure.functions as func
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel

from auth import ClientPrincipal, get_current_principal, get_current_user
from graph_calendar import (
    GraphAPIError,
    GraphAuthError,
    MailboxNotProvisionedError,
    UserNotFoundError,
    work_location_by_day,
)
from models import User


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
    line_manager_name: Optional[str]
    line_manager_email: Optional[str]
    anchor_days: Optional[List[str]] = None
    default_working_pattern: Optional[dict] = None
    identity_provider: str

    class Config:
        from_attributes = True


@fast_api.get("/api/users/me", response_model=MeResponse)
def get_me(
    principal: ClientPrincipal = Depends(get_current_principal),
    user: User = Depends(get_current_user),
):
    """Returns the logged-in user's DB record, matched by UPN from SWA auth."""
    return MeResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        upn=user.upn,
        team=user.team,
        role=user.role,
        location=user.location,
        preferred_neighbourhood=user.preferred_neighbourhood,
        line_manager_name=user.line_manager_name,
        line_manager_email=user.line_manager_email,
        anchor_days=user.anchor_days,
        default_working_pattern=user.default_working_pattern,
        identity_provider=principal.identity_provider,
    )


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
