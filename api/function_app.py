from datetime import date
from typing import List, Optional

import azure.functions as func
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from graph_calendar import (
    GraphAPIError,
    GraphAuthError,
    MailboxNotProvisionedError,
    UserNotFoundError,
    work_location_by_day,
)


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
