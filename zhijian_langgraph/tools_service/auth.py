from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Header, HTTPException

from tools_service.settings import Settings


@dataclass(frozen=True)
class AuthUser:
    user_id: int
    role: Optional[str]


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    prefix = "bearer "
    if authorization.lower().startswith(prefix):
        token = authorization[len(prefix):].strip()
        if token:
            return token
    raise HTTPException(status_code=401, detail="Invalid Authorization header")


def authenticate_user(settings: Settings, authorization: Optional[str]) -> AuthUser:
    token = _extract_bearer_token(authorization)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    subject = payload.get("sub")
    if subject is None:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")

    role = payload.get("role")
    if role is not None:
        role = str(role)

    return AuthUser(user_id=user_id, role=role)


def get_current_user(settings: Settings, authorization: Optional[str] = Header(default=None)) -> AuthUser:
    return authenticate_user(settings, authorization)
