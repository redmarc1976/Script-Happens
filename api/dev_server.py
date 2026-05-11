"""Dev-only entrypoint: runs the FastAPI app without the Azure Functions host.

Loads env vars from .env / .env.example then re-exports `fast_api` so uvicorn
can pick it up:

    uvicorn dev_server:fast_api --host 127.0.0.1 --port 8000
"""
import os
from pathlib import Path

from dotenv import load_dotenv

_here = Path(__file__).parent
# Prefer .env, fall back to .env.example for hackathon convenience.
for candidate in (_here / ".env", _here / ".env.example"):
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break

# Sanity check so failures surface immediately, not on the first request.
for var in ("AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"):
    if not os.getenv(var):
        raise RuntimeError(f"Missing env var: {var}")

from function_app import fast_api  # noqa: E402  (import after env load is intentional)

__all__ = ["fast_api"]
