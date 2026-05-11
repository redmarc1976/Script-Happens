"""Synthetic work-location data for demos when Microsoft Places isn't available.

Returns the same response shape as `graph_calendar.work_location_by_day` so
the endpoint can swap implementations without callers noticing.

Two layers:
  1. A small hand-tuned override map for known demo UPNs (predictable for the demo script).
  2. A deterministic fallback that picks a weekly pattern from a hash of the UPN,
     so any UPN gets a stable, plausible schedule across reruns.
"""
from __future__ import annotations

import hashlib
from datetime import date
from typing import Any

# Weekly patterns indexed 0..6 where 0=Monday, ..., 4=Friday, 5=Sat, 6=Sun.
# Weekends are deliberately "unknown" — matches what the real classifier
# would return for days with no events.
_PATTERNS: list[list[str]] = [
    # 0: classic hybrid — Tue/Thu in office
    ["remote", "office", "remote", "office", "remote", "unknown", "unknown"],
    # 1: mostly in-office
    ["office", "office", "remote", "office", "office", "unknown", "unknown"],
    # 2: mostly remote
    ["remote", "remote", "office", "remote", "remote", "unknown", "unknown"],
    # 3: Mon/Wed/Fri office
    ["office", "remote", "office", "remote", "office", "unknown", "unknown"],
    # 4: fully remote
    ["remote", "remote", "remote", "remote", "remote", "unknown", "unknown"],
]

# Hand-tuned overrides for demo characters — guarantee a known answer
# regardless of which pattern the hash would pick.
_DEMO_OVERRIDES: dict[str, int] = {
    "sophie.taylor@mwlanchpad.onmicrosoft.com": 0,
    "agtest@mwlanchpad.onmicrosoft.com": 1,
    "team2.admin@mwlanchpad.onmicrosoft.com": 3,
}


def _pattern_for(user_id: str) -> list[str]:
    key = user_id.lower()
    if key in _DEMO_OVERRIDES:
        return _PATTERNS[_DEMO_OVERRIDES[key]]
    # Stable hash → pattern index. md5 is fine for non-cryptographic bucketing.
    h = int(hashlib.md5(key.encode("utf-8")).hexdigest(), 16)
    return _PATTERNS[h % len(_PATTERNS)]


def mock_work_location_by_day(
    user_id: str, start_date: date, end_date: date
) -> list[dict[str, Any]]:
    """Drop-in replacement for graph_calendar.work_location_by_day."""
    pattern = _pattern_for(user_id)
    days: list[dict[str, Any]] = []
    current = start_date
    while current <= end_date:
        verdict = pattern[current.weekday()]
        days.append(
            {
                "date": current.isoformat(),
                "location": verdict,
                "source": f"mock: pattern[{current.weekday()}]" if verdict != "unknown" else None,
            }
        )
        current = date.fromordinal(current.toordinal() + 1)
    return days
