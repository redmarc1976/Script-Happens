"""Auto-book desk selection and persistence.

Selection rule (highest first):
  1. Stability — same desk as the user's most recent booking, if available.
  2. Shared preferences — count of overlapping Preference rows between user and desk.
  3. Neighbourhood match — desk.neighbourhood == user.preferred_neighbourhood.
  4. Alphabetical desk name (deterministic tie-break).
"""
from __future__ import annotations

import uuid
from datetime import date, timedelta
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from models import Booking, Desk, Holiday, User


def _ds(d: date) -> str:
    return d.isoformat()


def user_booked_days(db: Session, user_id: str, start: date, end: date) -> set[str]:
    rows = (
        db.query(Booking.booking_date)
        .filter(Booking.user_id == user_id)
        .filter(Booking.booking_date >= _ds(start))
        .filter(Booking.booking_date <= _ds(end))
        .all()
    )
    return {r[0] for r in rows}


def user_holiday_days(db: Session, user_id: str, start: date, end: date) -> set[str]:
    overlapping = (
        db.query(Holiday)
        .filter(Holiday.user_id == user_id)
        .filter(Holiday.approved == 1)
        .filter(Holiday.end_date >= _ds(start))
        .filter(Holiday.start_date <= _ds(end))
        .all()
    )
    days: set[str] = set()
    for h in overlapping:
        h_start = date.fromisoformat(h.start_date)
        h_end = date.fromisoformat(h.end_date)
        cursor = max(h_start, start)
        last = min(h_end, end)
        while cursor <= last:
            days.add(_ds(cursor))
            cursor += timedelta(days=1)
    return days


def available_desks_for_day(db: Session, day: date) -> list[Desk]:
    booked_ids = {
        r[0]
        for r in db.query(Booking.desk_id)
        .filter(Booking.booking_date == _ds(day))
        .all()
    }
    return [d for d in db.query(Desk).all() if d.id not in booked_ids]


def _score(desk: Desk, user: User, last_desk_id: Optional[str]) -> tuple:
    stability = 1 if last_desk_id and desk.id == last_desk_id else 0
    user_prefs = {p.id for p in user.preferences}
    desk_prefs = {p.id for p in desk.preferences}
    overlap = len(user_prefs & desk_prefs)
    nb_match = (
        1
        if user.preferred_neighbourhood
        and desk.neighbourhood == user.preferred_neighbourhood
        else 0
    )
    # Negative name so alphabetical-earlier wins after sort-reverse on the tuple.
    return (stability, overlap, nb_match, -ord(desk.name[0]) if desk.name else 0)


def last_desk_id_for_user(db: Session, user_id: str) -> Optional[str]:
    last = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.booking_date.desc(), Booking.created_at.desc())
        .first()
    )
    return last.desk_id if last else None


def select_desks(db: Session, user: User, days: Iterable[date]) -> dict[str, Optional[str]]:
    """Return {YYYY-MM-DD: desk_id or None} for each day."""
    current_last = last_desk_id_for_user(db, user.id)
    selection: dict[str, Optional[str]] = {}
    for day in sorted(days):
        candidates = available_desks_for_day(db, day)
        if not candidates:
            selection[_ds(day)] = None
            continue
        candidates.sort(key=lambda d: _score(d, user, current_last), reverse=True)
        chosen = candidates[0]
        selection[_ds(day)] = chosen.id
        current_last = chosen.id  # carry stability across the booked range
    return selection


def group_select_desks(
    db: Session,
    members_by_day: dict[date, list[User]],
) -> dict[str, dict[str, Optional[str]]]:
    """Return {YYYY-MM-DD: {user_id: desk_id or None}}.

    Picks the most-voted preferred_neighbourhood across all members as the
    cluster target, assigns desks within that neighbourhood first, then spills
    to any remaining available desk when it fills up.
    """
    from collections import Counter

    all_members: dict[str, User] = {
        m.id: m for day_members in members_by_day.values() for m in day_members
    }
    nb_votes: Counter = Counter(
        m.preferred_neighbourhood for m in all_members.values() if m.preferred_neighbourhood
    )
    cluster_nb: Optional[str] = nb_votes.most_common(1)[0][0] if nb_votes else None

    last_desk: dict[str, Optional[str]] = {
        mid: last_desk_id_for_user(db, mid) for mid in all_members
    }
    result: dict[str, dict[str, Optional[str]]] = {}

    for day in sorted(members_by_day):
        members = members_by_day[day]
        available = available_desks_for_day(db, day)
        nb_pool = [d for d in available if d.neighbourhood == cluster_nb] if cluster_nb else []
        overflow_pool = [d for d in available if d.neighbourhood != cluster_nb]

        taken: set[str] = set()
        day_assignments: dict[str, Optional[str]] = {}

        for member in members:
            candidates = [d for d in nb_pool if d.id not in taken]
            if not candidates:
                candidates = [d for d in overflow_pool if d.id not in taken]
            if not candidates:
                day_assignments[member.id] = None
                continue
            candidates.sort(
                key=lambda d: _score(d, member, last_desk[member.id]), reverse=True
            )
            chosen = candidates[0]
            day_assignments[member.id] = chosen.id
            taken.add(chosen.id)
            last_desk[member.id] = chosen.id

        result[_ds(day)] = day_assignments

    return result


def persist_bookings(
    db: Session, user_id: str, selections: dict[str, Optional[str]]
) -> None:
    for date_str, desk_id in selections.items():
        if not desk_id:
            continue
        db.add(
            Booking(
                id=str(uuid.uuid4()),
                user_id=user_id,
                desk_id=desk_id,
                booking_date=date_str,
            )
        )
    db.commit()
