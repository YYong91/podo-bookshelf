from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: int
    email: str
    name: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="podo-auth",
        )
    except jwt.PyJWTError as err:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다") from err

    try:
        return CurrentUser(
            id=int(payload["sub"]),
            email=payload["email"],
            name=payload["name"],
        )
    except (KeyError, ValueError, TypeError) as err:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다") from err


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser | None:
    """토큰 없으면 None, 비정상 토큰이면 401."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="podo-auth",
        )
    except jwt.PyJWTError as err:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다") from err
    try:
        return CurrentUser(id=int(payload["sub"]), email=payload["email"], name=payload["name"])
    except (KeyError, ValueError, TypeError) as err:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다") from err
