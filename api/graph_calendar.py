"""Microsoft Graph integration for reading per-day Outlook work location.

Uses the client-credentials (app-only) OAuth flow. The Azure AD app must have
the `Calendars.Read` *application* permission with admin consent granted.
"""
from __future__ import annotations

import os
import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Iterable

import httpx
import msal

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
GRAPH_SCOPE = "https://graph.microsoft.com/.default"

# locationType values returned by Graph that we treat as a hard signal.
OFFICE_LOCATION_TYPES = {"businessAddress", "conferenceRoom"}
REMOTE_LOCATION_TYPES = {"homeAddress"}

# Fallback keyword matching on the location's displayName when locationType
# is "default" (which Outlook uses for free-text locations).
REMOTE_KEYWORDS = ("home", "remote", "wfh", "work from home")
OFFICE_KEYWORDS = ("office", "hq", "headquarters", "building")

# Subject / category matching. Word-boundary matched to avoid false positives
# (e.g. "Officewide all-hands" shouldn't trigger "office").
REMOTE_SUBJECT_PATTERNS = (
    r"\bwfh\b",
    r"\bwork(?:ing)?[\s-]?from[\s-]?home\b",
    r"\bremote\b",
)
OFFICE_SUBJECT_PATTERNS = (
    r"\bin[\s-]?office\b",
    r"\bin[\s-]?the[\s-]?office\b",
    r"\boffice[\s-]?day\b",
    r"\bonsite\b",
    r"\bon[\s-]?site\b",
    r"\boffice\b",
)


class GraphAuthError(RuntimeError):
    pass


class GraphAPIError(RuntimeError):
    pass


class UserNotFoundError(RuntimeError):
    pass


class MailboxNotProvisionedError(RuntimeError):
    pass


def _get_token() -> str:
    tenant_id = os.getenv("AZURE_TENANT_ID")
    client_id = os.getenv("AZURE_CLIENT_ID")
    client_secret = os.getenv("AZURE_CLIENT_SECRET")
    if not (tenant_id and client_id and client_secret):
        raise GraphAuthError(
            "Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET env vars"
        )

    app = msal.ConfidentialClientApplication(
        client_id=client_id,
        client_credential=client_secret,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
    )
    result = app.acquire_token_for_client(scopes=[GRAPH_SCOPE])
    if "access_token" not in result:
        raise GraphAuthError(
            f"Token acquisition failed: {result.get('error')} - {result.get('error_description')}"
        )
    return result["access_token"]


async def check_user_mailbox(user_id: str) -> dict[str, Any]:
    """Look up the user and verify they have a mailbox.

    Raises UserNotFoundError if the directory object doesn't exist,
    MailboxNotProvisionedError if it exists but has no `mail` attribute
    (i.e. no Exchange Online mailbox). Returns the raw user object on success.
    """
    token = _get_token()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    url = (
        f"{GRAPH_BASE}/users/{user_id}"
        "?$select=id,userPrincipalName,displayName,mail,accountEnabled"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
    if resp.status_code == 404:
        raise UserNotFoundError(f"No directory user for '{user_id}'")
    if resp.status_code == 403:
        raise GraphAPIError(
            "Graph 403 on /users — the app likely needs User.Read.All "
            "(application permission) with admin consent. Body: " + resp.text
        )
    if resp.status_code >= 400:
        raise GraphAPIError(f"Graph {resp.status_code} on /users: {resp.text}")
    data = resp.json()
    if not data.get("mail"):
        raise MailboxNotProvisionedError(
            f"User '{user_id}' exists but has no Exchange Online mailbox "
            "(no 'mail' attribute). Assign an Exchange-enabled license, then retry."
        )
    return data


async def fetch_calendar_view(
    user_id: str, start: datetime, end: datetime
) -> list[dict[str, Any]]:
    """Fetch all events in [start, end) for a user, following pagination."""
    token = _get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Prefer": 'outlook.timezone="UTC"',
        "Accept": "application/json",
    }
    params = {
        "startDateTime": start.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        "endDateTime": end.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        "$select": "subject,start,end,isAllDay,showAs,categories,locations,type",
        "$top": "100",
    }
    url = f"{GRAPH_BASE}/users/{user_id}/calendarView"

    events: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        next_url: str | None = url
        next_params: dict[str, str] | None = params
        while next_url:
            resp = await client.get(next_url, headers=headers, params=next_params)
            if resp.status_code >= 400:
                raise GraphAPIError(
                    f"Graph {resp.status_code} on {next_url}: {resp.text}"
                )
            payload = resp.json()
            events.extend(payload.get("value", []))
            next_url = payload.get("@odata.nextLink")
            next_params = None  # nextLink is fully-qualified
    return events


def _match_patterns(text: str, patterns: tuple[str, ...]) -> bool:
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def classify_work_location(event: dict[str, Any]) -> tuple[str, str | None]:
    """Return (verdict, source) where verdict is 'office' | 'remote' | 'unknown'.

    source is a short human-readable string describing what we matched on,
    useful for debugging the demo.

    Precedence: locationType (strong) > displayName keywords > subject > categories.
    """
    locations = event.get("locations") or []
    for loc in locations:
        loc_type = loc.get("locationType")
        if loc_type in REMOTE_LOCATION_TYPES:
            return "remote", f"{loc_type}: {loc.get('displayName') or ''}".strip(": ")
        if loc_type in OFFICE_LOCATION_TYPES:
            return "office", f"{loc_type}: {loc.get('displayName') or ''}".strip(": ")

    for loc in locations:
        name = (loc.get("displayName") or "").lower()
        if not name:
            continue
        if any(k in name for k in REMOTE_KEYWORDS):
            return "remote", f"displayName: {loc.get('displayName')}"
        if any(k in name for k in OFFICE_KEYWORDS):
            return "office", f"displayName: {loc.get('displayName')}"

    subject = event.get("subject") or ""
    if subject:
        if _match_patterns(subject, REMOTE_SUBJECT_PATTERNS):
            return "remote", f"subject: {subject}"
        if _match_patterns(subject, OFFICE_SUBJECT_PATTERNS):
            return "office", f"subject: {subject}"

    for cat in event.get("categories") or []:
        if not cat:
            continue
        if _match_patterns(cat, REMOTE_SUBJECT_PATTERNS):
            return "remote", f"category: {cat}"
        if _match_patterns(cat, OFFICE_SUBJECT_PATTERNS):
            return "office", f"category: {cat}"

    return "unknown", None


_FRAC_RE = re.compile(r"\.(\d{6})\d+")


def _event_date(event: dict[str, Any]) -> date | None:
    start = (event.get("start") or {}).get("dateTime")
    if not start:
        return None
    # Graph returns 7-digit fractional seconds (".0000000"); Python <3.11
    # fromisoformat only accepts up to 6, so truncate. Also normalise trailing Z.
    normalised = _FRAC_RE.sub(r".\1", start).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalised)
    except ValueError:
        return None
    return dt.date()


def collapse_by_day(
    events: Iterable[dict[str, Any]],
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    """Collapse events into one verdict per date in [start_date, end_date]."""
    per_day: dict[date, tuple[str, str | None]] = defaultdict(lambda: ("unknown", None))
    # Precedence: office > remote > unknown — if someone marks both, they came in.
    rank = {"office": 2, "remote": 1, "unknown": 0}

    for event in events:
        d = _event_date(event)
        if d is None or d < start_date or d > end_date:
            continue
        verdict, source = classify_work_location(event)
        if rank[verdict] > rank[per_day[d][0]]:
            per_day[d] = (verdict, source)

    days = []
    current = start_date
    while current <= end_date:
        verdict, source = per_day[current]
        days.append({"date": current.isoformat(), "location": verdict, "source": source})
        current = date.fromordinal(current.toordinal() + 1)
    return days


async def get_user_photo(user_id: str) -> bytes | None:
    """Fetch the user's Entra profile photo. Returns None if unavailable."""
    try:
        token = _get_token()
    except GraphAuthError:
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{GRAPH_BASE}/users/{user_id}/photo/$value",
            headers={"Authorization": f"Bearer {token}"},
        )
    return resp.content if resp.status_code == 200 else None


async def work_location_by_day(
    user_id: str, start_date: date, end_date: date
) -> list[dict[str, Any]]:
    """High-level: return per-day work location verdicts for a user.

    Performs a User.Read.All pre-check so callers get a clean
    UserNotFoundError / MailboxNotProvisionedError instead of a generic
    Graph 404 from /calendarView.
    """
    await check_user_mailbox(user_id)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(
        date.fromordinal(end_date.toordinal() + 1),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )
    events = await fetch_calendar_view(user_id, start_dt, end_dt)
    return collapse_by_day(events, start_date, end_date)
