"""Authentication helpers for Azure Static Web Apps.

SWA injects the authenticated user's identity into every request via the
`x-ms-client-principal` header (base64-encoded JSON). This module decodes
that header and exposes FastAPI dependencies for accessing the current
identity and matching it to a User record in the database.
"""
import base64
import json
from dataclasses import dataclass
from typing import List, Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User


@dataclass
class ClientPrincipal:
    """The identity SWA injects into authenticated requests."""

    identity_provider: str
    user_id: str
    user_details: str  # Usually the email for AAD
    user_roles: List[str]
    claims: dict[str, str]  # Flattened {typ: val}

    @property
    def is_authenticated(self) -> bool:
        return "authenticated" in self.user_roles

    @property
    def upn(self) -> Optional[str]:
        """The User Principal Name from the AAD token claims."""
        return (
            self.claims.get("preferred_username")
            or self.claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")
            or self.claims.get("upn")
            or self.user_details
        )

    @property
    def email(self) -> Optional[str]:
        return (
            self.claims.get("email")
            or self.claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")
        )

    @property
    def display_name(self) -> Optional[str]:
        return (
            self.claims.get("name")
            or self.claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")
        )


def decode_principal(header_value: str) -> ClientPrincipal:
    """Decode the base64-encoded x-ms-client-principal header."""
    decoded = base64.b64decode(header_value).decode("utf-8")
    data = json.loads(decoded)
    claims = {c["typ"]: c["val"] for c in data.get("claims", [])}
    return ClientPrincipal(
        identity_provider=data.get("identityProvider", ""),
        user_id=data.get("userId", ""),
        user_details=data.get("userDetails", ""),
        user_roles=data.get("userRoles", []),
        claims=claims,
    )


def get_current_principal(
    x_ms_client_principal: Optional[str] = Header(None),
) -> ClientPrincipal:
    """FastAPI dependency: returns the authenticated SWA principal or 401."""
    if not x_ms_client_principal:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        principal = decode_principal(x_ms_client_principal)
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid client principal: {exc}",
        ) from exc
    if not principal.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return principal


def get_current_user(
    principal: ClientPrincipal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: returns the DB User matched to the signed-in identity.

    Matches by UPN (preferred), then falls back to email.
    """
    upn = principal.upn
    user = None
    if upn:
        user = db.query(User).filter(User.upn == upn).first()
    if not user and principal.email:
        user = db.query(User).filter(User.email == principal.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user record found for {upn or principal.email}",
        )
    return user
