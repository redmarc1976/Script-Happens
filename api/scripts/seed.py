"""Seed the database with desks, users, preferences, bookings, and holidays.

Run with:
    cd api && source .venv/bin/activate
    python -m scripts.seed

Required env vars: SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD
"""
import json
import os
import random
import sys
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Make models importable when running as a script from the api/ dir
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Base, Desk, User, Booking, Holiday, Preference, WorkingPattern  # noqa: E402
from models import desk_preference_association, user_preference_association  # noqa: E402


REPO_ROOT = Path(__file__).parent.parent.parent
USERS_JSON = REPO_ROOT / "src" / "src" / "data" / "users.json"

PREFERENCES = [
    ("quiet-area", "Located in a quieter zone, away from high-traffic areas"),
    ("standing-desk", "Height-adjustable desk for standing/sitting"),
    ("dual-monitor", "Equipped with dual monitors"),
    ("window-seat", "Adjacent to a window with natural light"),
    ("ergonomic-chair", "High-quality ergonomic chair"),
    ("near-printer", "Within easy reach of a printer"),
    ("near-kitchen", "Close to a kitchen/breakout area"),
    ("collaboration", "In a collaborative open zone"),
]

OFFICE_LOCATION = "London"

# Real UPNs from the launchpad tenant. Assigned to the first N users in
# users.json (in order) so any tenant member who logs in maps to a seeded
# record. Remaining users keep their auto-generated UPNs.
REAL_UPNS = [
    "agtest@mwlanchpad.onmicrosoft.com",
    "Alice@mwlanchpad.onmicrosoft.com",
    "Dafydd@mwlanchpad.onmicrosoft.com",
    "Frank.L.Wright@mwlanchpad.onmicrosoft.com",
    "John.Smith@mwlanchpad.onmicrosoft.com",
    "locallord@mwlanchpad.onmicrosoft.com",
    "Sophie.taylor@mwlanchpad.onmicrosoft.com",
    "team1.admin@MWLanchpad.onmicrosoft.com",
    "team2.admin@MWLanchpad.onmicrosoft.com",
    "team3.admin@MWLanchpad.onmicrosoft.com",
    "team4.admin@MWLanchpad.onmicrosoft.com",
    "team5.admin@MWLanchpad.onmicrosoft.com",
    "team6.admin@MWLanchpad.onmicrosoft.com",
    "team7.admin@MWLanchpad.onmicrosoft.com",
]


def desk_cluster_c4(prefix, floor, neighbourhood, cx, cy):
    """2x2 cluster of 4 desks."""
    return [
        {"id": f"{prefix}-tl", "name": f"{prefix}-TL", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 1.5, "y": cy - 1.5},
        {"id": f"{prefix}-tr", "name": f"{prefix}-TR", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 1.5, "y": cy - 1.5},
        {"id": f"{prefix}-bl", "name": f"{prefix}-BL", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 1.5, "y": cy + 1.5},
        {"id": f"{prefix}-br", "name": f"{prefix}-BR", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 1.5, "y": cy + 1.5},
    ]


def desk_cluster_c6(prefix, floor, neighbourhood, cx, cy):
    """2 wide x 3 deep cluster (portrait)."""
    return [
        {"id": f"{prefix}-t1", "name": f"{prefix}-T1", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 1.5, "y": cy - 3},
        {"id": f"{prefix}-t2", "name": f"{prefix}-T2", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 1.5, "y": cy - 3},
        {"id": f"{prefix}-m1", "name": f"{prefix}-M1", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 1.5, "y": cy},
        {"id": f"{prefix}-m2", "name": f"{prefix}-M2", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 1.5, "y": cy},
        {"id": f"{prefix}-b1", "name": f"{prefix}-B1", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 1.5, "y": cy + 3},
        {"id": f"{prefix}-b2", "name": f"{prefix}-B2", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 1.5, "y": cy + 3},
    ]


def desk_cluster_c6l(prefix, floor, neighbourhood, cx, cy):
    """3 wide x 2 deep cluster (landscape)."""
    return [
        {"id": f"{prefix}-tl", "name": f"{prefix}-TL", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 3.5, "y": cy - 1.5},
        {"id": f"{prefix}-tm", "name": f"{prefix}-TM", "floor": floor, "neighbourhood": neighbourhood, "x": cx,       "y": cy - 1.5},
        {"id": f"{prefix}-tr", "name": f"{prefix}-TR", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 3.5, "y": cy - 1.5},
        {"id": f"{prefix}-bl", "name": f"{prefix}-BL", "floor": floor, "neighbourhood": neighbourhood, "x": cx - 3.5, "y": cy + 1.5},
        {"id": f"{prefix}-bm", "name": f"{prefix}-BM", "floor": floor, "neighbourhood": neighbourhood, "x": cx,       "y": cy + 1.5},
        {"id": f"{prefix}-br", "name": f"{prefix}-BR", "floor": floor, "neighbourhood": neighbourhood, "x": cx + 3.5, "y": cy + 1.5},
    ]


def build_desks():
    desks = []
    # GROUND: WINDOWS
    desks += desk_cluster_c6l("g-w-b1", "ground", "Windows", 11, 12)
    desks += desk_cluster_c6l("g-w-b2", "ground", "Windows", 24, 12)
    desks += desk_cluster_c6l("g-w-b3", "ground", "Windows", 11, 24.5)
    desks += desk_cluster_c6l("g-w-b4", "ground", "Windows", 24, 24.5)
    # GROUND: SECURITY
    desks += desk_cluster_c6l("g-sec-b1", "ground", "Security", 77, 12)
    desks += desk_cluster_c6l("g-sec-b2", "ground", "Security", 90, 12)
    desks += desk_cluster_c6l("g-sec-b3", "ground", "Security", 77, 24.5)
    desks += desk_cluster_c6l("g-sec-b4", "ground", "Security", 90, 24.5)
    # GROUND: VIRTUALISATION
    for r, cy in enumerate([39, 53, 67], start=1):
        for c, cx in enumerate([7, 18], start=1):
            desks += desk_cluster_c6(f"g-vir-r{r}c{c}", "ground", "Virtualisation", cx, cy)
    # GROUND: SUPPORT
    for r, cy in enumerate([36, 51, 66], start=1):
        for c, cx in enumerate([71, 81, 91], start=1):
            desks += desk_cluster_c6(f"g-sup-r{r}c{c}", "ground", "Support", cx, cy)
    # FIRST: top-left open
    for r, cy in enumerate([10, 20], start=1):
        for c, cx in enumerate([6, 14, 21], start=1):
            desks += desk_cluster_c4(f"f-nw-r{r}c{c}", "first", "Open Plan", cx, cy)
    # FIRST: top-right open
    for r, cy in enumerate([10, 20], start=1):
        for c, cx in enumerate([67, 76, 85], start=1):
            desks += desk_cluster_c4(f"f-ne-r{r}c{c}", "first", "Open Plan", cx, cy)
    # FIRST: left open
    for r, cy in enumerate([39, 53, 67], start=1):
        for c, cx in enumerate([7, 18], start=1):
            desks += desk_cluster_c6(f"f-w-r{r}c{c}", "first", "Open Plan", cx, cy)
    # FIRST: right open
    for r, cy in enumerate([36, 51, 66], start=1):
        for c, cx in enumerate([74, 84, 93], start=1):
            desks += desk_cluster_c6(f"f-e-r{r}c{c}", "first", "Open Plan", cx, cy)
    return desks


def wipe_all(session):
    """Clear all data so the seed is idempotent."""
    print("Wiping existing data...")
    session.execute(user_preference_association.delete())
    session.execute(desk_preference_association.delete())
    session.query(Booking).delete()
    session.query(Holiday).delete()
    session.query(WorkingPattern).delete()
    session.query(User).delete()
    session.query(Desk).delete()
    session.query(Preference).delete()
    session.commit()


def seed_preferences(session):
    print("Seeding preferences...")
    pref_objects = {}
    for name, description in PREFERENCES:
        pref = Preference(id=str(uuid.uuid4()), name=name, description=description)
        session.add(pref)
        pref_objects[name] = pref
    session.commit()
    print(f"  Created {len(pref_objects)} preferences")
    return pref_objects


def seed_desks(session, pref_objects):
    print("Seeding desks...")
    desks_data = build_desks()
    desk_objects = {}
    for desk_data in desks_data:
        desk = Desk(
            id=desk_data["id"],
            name=desk_data["name"],
            location=OFFICE_LOCATION,
            floor=desk_data["floor"],
            neighbourhood=desk_data["neighbourhood"],
            x=desk_data["x"],
            y=desk_data["y"],
        )
        # Assign 0-3 random preferences per desk
        num_prefs = random.choices([0, 1, 2, 3], weights=[1, 3, 4, 2])[0]
        if num_prefs > 0:
            desk.preferences = random.sample(list(pref_objects.values()), num_prefs)
        session.add(desk)
        desk_objects[desk.id] = desk
    session.commit()
    print(f"  Created {len(desk_objects)} desks")
    return desk_objects


def seed_users(session, pref_objects):
    print("Seeding users...")
    with open(USERS_JSON) as f:
        users_data = json.load(f)

    user_objects = {}
    for idx, u in enumerate(users_data):
        # First N users get a real tenant UPN so they map to live AAD identities.
        # Remaining users get an auto-generated UPN derived from their email.
        if idx < len(REAL_UPNS):
            upn = REAL_UPNS[idx]
        else:
            upn = u["email"].replace("@thebank.com", "@launchpad.onmicrosoft.com")
        user = User(
            id=u["id"],
            employee_id=u["employeeId"],
            full_name=u["fullName"],
            email=u["email"],
            upn=upn,
            location=u["location"],
            team=u["team"],
            role=u["role"],
            line_manager_name=u.get("lineManager", {}).get("name"),
            line_manager_email=u.get("lineManager", {}).get("email"),
            anchor_days=u.get("anchorDays"),
            default_working_pattern=u.get("defaultWorkingPattern"),
            preferred_neighbourhood=u.get("preferredNeighbourhood"),
            desk_preferences=u.get("deskPreferences"),
            booking_window_days=u.get("bookingWindowDays", 14),
        )
        # Link user preferences to the Preference catalog (dedupe to avoid PK violation)
        user_prefs = u.get("deskPreferences", []) or []
        unique_prefs = list(dict.fromkeys(user_prefs))
        user.preferences = [pref_objects[p] for p in unique_prefs if p in pref_objects]
        session.add(user)
        user_objects[user.id] = user

    session.commit()
    print(f"  Created {len(user_objects)} users")
    return user_objects


def seed_working_patterns(session, user_objects):
    """Each weekday is either 'anchor day' (mandatory office) or 'hybrid' (flexible).

    Derived from each user's `anchorDays` list in users.json.
    """
    print("Seeding working patterns...")
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    with open(USERS_JSON) as f:
        users_data = json.load(f)
    count = 0
    for u in users_data:
        anchor_days = {d.lower() for d in (u.get("anchorDays") or [])}
        pattern = WorkingPattern(
            user_id=u["id"],
            **{day: ("anchor day" if day in anchor_days else "hybrid") for day in weekdays},
        )
        session.add(pattern)
        count += 1
    session.commit()
    print(f"  Created {count} working patterns")


def seed_bookings(session, user_objects, desk_objects):
    """Synthetic bookings: ~30% of users get bookings for the next 2 weeks on their office days."""
    print("Seeding bookings...")
    desk_list = list(desk_objects.values())
    booking_count = 0
    today = date.today()
    eligible_users = random.sample(list(user_objects.values()), k=len(user_objects) // 3)

    for user in eligible_users:
        pattern = user.default_working_pattern or {}
        for day_offset in range(14):
            d = today + timedelta(days=day_offset)
            weekday_name = d.strftime("%A").lower()
            if pattern.get(weekday_name) == "office":
                booking = Booking(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    desk_id=random.choice(desk_list).id,
                    booking_date=d.isoformat(),
                    created_at=datetime.utcnow(),
                )
                session.add(booking)
                booking_count += 1

    session.commit()
    print(f"  Created {booking_count} bookings")


def seed_holidays(session, user_objects):
    """Synthetic holidays.

    ~20% of users get 1-2 future holiday windows somewhere in the next 7-90
    days. On top of that ~15% of users get a near-term (1-14 day) holiday so
    the agent has obvious cases to skip during a live demo.
    """
    print("Seeding holidays...")
    today = date.today()
    holiday_types = ["vacation", "sick", "personal"]
    type_weights = [6, 2, 1]
    holiday_count = 0

    def add_holiday(user, start_offset, length):
        start = today + timedelta(days=start_offset)
        end = start + timedelta(days=length - 1)
        session.add(Holiday(
            id=str(uuid.uuid4()),
            user_id=user.id,
            start_date=start.isoformat(),
            end_date=end.isoformat(),
            holiday_type=random.choices(holiday_types, weights=type_weights)[0],
            approved=1,
            created_at=datetime.utcnow(),
        ))

    # Far-out window: 7-90 days
    far_users = random.sample(list(user_objects.values()), k=len(user_objects) // 5)
    for user in far_users:
        for _ in range(random.randint(1, 2)):
            length = random.choices([1, 2, 3, 5, 10], weights=[2, 2, 3, 2, 1])[0]
            add_holiday(user, random.randint(7, 90), length)
            holiday_count += 1

    # Near-term window: 1-14 days, so the demo has visible holidays to skip
    near_users = random.sample(
        list(user_objects.values()),
        k=max(1, len(user_objects) * 15 // 100),
    )
    for user in near_users:
        length = random.choices([1, 2, 3, 5], weights=[3, 3, 2, 1])[0]
        add_holiday(user, random.randint(1, 14), length)
        holiday_count += 1

    session.commit()
    print(f"  Created {holiday_count} holidays")


def seed_fake_calendars(user_objects):
    """Write api/data/fake_calendars.json — per-user, per-day work location.

    Reads users.json for each user's `defaultWorkingPattern` and
    `anchorDays`, then projects them forward ~90 days with light variance:
      - anchor days are always "office"
      - 85% of remaining weekdays follow the working pattern
      - 10% are swapped (office<->remote, e.g. last-minute change)
      - 5% are "unknown" (empty calendar)
      - weekends are always "unknown"

    Each user is keyed by both UPN and email so a caller can look up by
    whichever identifier they have.
    """
    print("Seeding fake calendars...")
    out_path = Path(__file__).parent.parent / "data" / "fake_calendars.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(USERS_JSON) as f:
        users_data = json.load(f)
    users_by_id = {u["id"]: u for u in users_data}

    today = date.today()
    horizon_days = 90
    users_out: dict[str, list[dict]] = {}

    for uid, user in user_objects.items():
        raw = users_by_id.get(uid, {})
        pattern = (raw.get("defaultWorkingPattern") or {})
        anchor_days = {d.lower() for d in (raw.get("anchorDays") or [])}
        days = []
        for offset in range(horizon_days):
            d = today + timedelta(days=offset)
            weekday = d.strftime("%A").lower()
            if d.weekday() >= 5:  # Saturday/Sunday
                days.append({"date": d.isoformat(), "location": "unknown", "source": None})
                continue
            if weekday in anchor_days:
                days.append({"date": d.isoformat(), "location": "office", "source": "anchor day"})
                continue
            default = pattern.get(weekday)  # "office" | "remote" | None
            if not default:
                days.append({"date": d.isoformat(), "location": "unknown", "source": None})
                continue
            roll = random.random()
            if roll < 0.85:
                days.append({
                    "date": d.isoformat(),
                    "location": default,
                    "source": "working pattern",
                })
            elif roll < 0.95:
                swapped = "remote" if default == "office" else "office"
                days.append({
                    "date": d.isoformat(),
                    "location": swapped,
                    "source": "swapped from pattern",
                })
            else:
                days.append({"date": d.isoformat(), "location": "unknown", "source": None})

        # Key by every identifier the API might pass in
        keys = {user.upn, user.email}
        keys = {k for k in keys if k}
        for k in keys:
            users_out[k] = days
            users_out[k.lower()] = days

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "horizon_days": horizon_days,
        "users": users_out,
    }
    with out_path.open("w") as f:
        json.dump(payload, f, indent=2)
    print(f"  Wrote {out_path} ({len(user_objects)} users, {horizon_days} days)")


def main():
    random.seed(42)
    sql_user = os.getenv("SQL_USERNAME")
    sql_pass = os.getenv("SQL_PASSWORD")
    sql_server = os.getenv("SQL_SERVER")
    sql_db = os.getenv("SQL_DATABASE")
    if not all([sql_user, sql_pass, sql_server, sql_db]):
        print("Missing SQL_* env vars", file=sys.stderr)
        sys.exit(1)

    from urllib.parse import quote_plus
    url = (
        f"mssql+pyodbc://{sql_user}:{quote_plus(sql_pass)}"
        f"@{sql_server}/{sql_db}"
        f"?driver=ODBC+Driver+18+for+SQL+Server"
    )
    engine = create_engine(url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        wipe_all(session)
        pref_objects = seed_preferences(session)
        desk_objects = seed_desks(session, pref_objects)
        user_objects = seed_users(session, pref_objects)
        seed_working_patterns(session, user_objects)
        seed_bookings(session, user_objects, desk_objects)
        seed_holidays(session, user_objects)
        seed_fake_calendars(user_objects)
        print("\nSeed complete!")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
