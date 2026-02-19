# Podo Auth SSO 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** podo 시리즈 앱을 위한 중앙 인증 서버(podo-auth)를 구축하고, podo-bookshop에 SSO를 연동한다.

**Architecture:** 별도 podo-auth 서비스(FastAPI + React)가 사용자 관리와 JWT 발급을 담당. 각 podo 앱은 공유 JWT signing key로 토큰을 검증. 리다이렉트 기반 SSO 흐름.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite, React 19, TypeScript, Vite, Tailwind CSS v4, bcrypt, PyJWT, Docker Compose

---

## Phase 1: podo-auth 백엔드

### Task 1: podo-auth 프로젝트 초기화

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/pyproject.toml`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/config.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/database.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/tsid.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/models/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/schemas/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/api/__init__.py`

**Step 1: Create project structure**

```
podo-auth/
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── tsid.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   └── api/
│   │       └── __init__.py
```

**Step 2: Write pyproject.toml**

```toml
[project]
name = "podo-auth"
version = "0.1.0"
description = "포도 인증 - podo 시리즈 통합 인증 서버"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "aiosqlite>=0.20.0",
    "alembic>=1.14.0",
    "pydantic-settings>=2.7.0",
    "tsidpy>=1.1.5",
    "bcrypt>=4.2.0",
    "pyjwt>=2.9.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
    "ruff>=0.9.0",
]

[tool.ruff]
target-version = "py312"
line-length = 160

[tool.ruff.lint]
select = ["E", "W", "F", "I", "UP", "B", "SIM"]
ignore = ["E501", "B008"]

[tool.ruff.lint.isort]
known-first-party = ["app"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**Step 3: Write config.py** (matching podo-bookshop pattern)

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "포도인증"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite+aiosqlite:///./podo-auth.db"
    CORS_ORIGINS: str = "*"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    ALLOWED_REDIRECT_ORIGINS: str = "http://localhost:3100,http://localhost:5173"


settings = Settings()
```

**Step 4: Write database.py and tsid.py** (identical pattern to podo-bookshop)

database.py:
```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

tsid.py:
```python
from tsidpy import TSID


def generate_tsid() -> int:
    return TSID.create().number
```

**Step 5: Initialize uv and lock dependencies**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv sync`

**Step 6: Initialize git repo and commit**

```bash
cd /Users/yyong/Developer/podo-auth
git init
git add .
git commit -m "feat: initialize podo-auth project structure"
```

---

### Task 2: User 모델 + Alembic 설정

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/app/models/user.py`
- Modify: `/Users/yyong/Developer/podo-auth/backend/app/models/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/alembic.ini`
- Create: `/Users/yyong/Developer/podo-auth/backend/alembic/env.py`

**Step 1: Write User model**

```python
from sqlalchemy import BigInteger, Boolean, Column, DateTime, String, func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, server_default="1")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

**Step 2: Write models/__init__.py**

```python
from app.models.user import User

__all__ = ["User"]
```

**Step 3: Initialize Alembic**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run alembic init alembic`

**Step 4: Update alembic/env.py** (match podo-bookshop pattern)

Update the target_metadata section:
```python
from app.core.database import Base
from app.models import User  # noqa: F401

target_metadata = Base.metadata
```

And update alembic.ini `sqlalchemy.url`:
```
sqlalchemy.url = sqlite:///./podo-auth.db
```

**Step 5: Generate and run migration**

```bash
cd /Users/yyong/Developer/podo-auth/backend
uv run alembic revision --autogenerate -m "create users table"
uv run alembic upgrade head
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add User model and Alembic migration"
```

---

### Task 3: RefreshToken 모델

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/app/models/refresh_token.py`
- Modify: `/Users/yyong/Developer/podo-auth/backend/app/models/__init__.py`

**Step 1: Write RefreshToken model**

```python
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, func

from app.core.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
```

**Step 2: Update models/__init__.py**

```python
from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = ["RefreshToken", "User"]
```

**Step 3: Generate and run migration**

```bash
cd /Users/yyong/Developer/podo-auth/backend
uv run alembic revision --autogenerate -m "create refresh_tokens table"
uv run alembic upgrade head
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add RefreshToken model"
```

---

### Task 4: 인증 유틸리티 (password hashing + JWT)

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/security.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/tests/__init__.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/tests/test_security.py`

**Step 1: Write failing tests**

```python
from app.core.security import hash_password, verify_password, create_access_token, decode_token


def test_hash_and_verify_password():
    hashed = hash_password("mypassword123")
    assert hashed != "mypassword123"
    assert verify_password("mypassword123", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_access_token():
    token = create_access_token(user_id="123456", email="test@example.com", name="테스트")
    payload = decode_token(token)
    assert payload["sub"] == "123456"
    assert payload["email"] == "test@example.com"
    assert payload["name"] == "테스트"
    assert payload["iss"] == "podo-auth"


def test_decode_invalid_token():
    payload = decode_token("invalid.token.here")
    assert payload is None
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_security.py -v`
Expected: FAIL (ImportError)

**Step 3: Implement security.py**

```python
from datetime import datetime, timedelta, timezone
from hashlib import sha256

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str, email: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iss": "podo-auth",
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token() -> str:
    import secrets
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], issuer="podo-auth")
    except jwt.PyJWTError:
        return None
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_security.py -v`
Expected: 3 passed

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add password hashing and JWT utilities with tests"
```

---

### Task 5: Auth 스키마 정의

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/app/schemas/auth.py`

**Step 1: Write schemas**

```python
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, BeforeValidator

StrId = Annotated[str, BeforeValidator(lambda v: str(v))]


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: StrId
    email: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    current_password: str | None = None
    new_password: str | None = None
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add auth request/response schemas"
```

---

### Task 6: 회원가입 API 엔드포인트

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/app/api/auth.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/tests/test_auth_api.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/tests/conftest.py`

**Step 1: Write test fixtures (conftest.py)**

```python
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db():
    async with TestSessionLocal() as session:
        yield session


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

**Step 2: Write failing test for register**

```python
import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "테스트"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트1",
    })
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password456",
        "name": "테스트2",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_short_password(client):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "short",
        "name": "테스트",
    })
    assert response.status_code == 422
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py -v`
Expected: FAIL

**Step 4: Implement auth router (register only)**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password
from app.core.tsid import generate_tsid
from app.models.user import User
from app.schemas.auth import RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다")

    user = User(
        id=generate_tsid(),
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
```

**Step 5: Create main.py** (must exist for tests)

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Step 6: Run tests to verify they pass**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py -v`
Expected: 3 passed

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add register endpoint with tests"
```

---

### Task 7: 로그인 API 엔드포인트

**Files:**
- Modify: `/Users/yyong/Developer/podo-auth/backend/app/api/auth.py`
- Modify: `/Users/yyong/Developer/podo-auth/backend/tests/test_auth_api.py`

**Step 1: Write failing tests**

```python
@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # Check refresh token cookie
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    response = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client):
    response = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password123",
    })
    assert response.status_code == 401
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py::test_login_success -v`
Expected: FAIL

**Step 3: Implement login endpoint**

Add to auth.py:
```python
from datetime import datetime, timedelta, timezone
from fastapi.responses import JSONResponse

from app.core.security import verify_password, create_access_token, create_refresh_token, hash_refresh_token
from app.models.refresh_token import RefreshToken as RefreshTokenModel
from app.schemas.auth import LoginRequest, TokenResponse


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="비활성화된 계정입니다")

    access_token = create_access_token(
        user_id=str(user.id), email=user.email, name=user.name
    )

    refresh_token = create_refresh_token()
    refresh_model = RefreshTokenModel(
        id=generate_tsid(),
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_model)
    await db.commit()

    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # True in production with HTTPS
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )
    return response
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py -v`
Expected: 6 passed

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add login endpoint with refresh token cookie"
```

---

### Task 8: Token Refresh + Me 엔드포인트

**Files:**
- Modify: `/Users/yyong/Developer/podo-auth/backend/app/api/auth.py`
- Create: `/Users/yyong/Developer/podo-auth/backend/app/core/deps.py`
- Modify: `/Users/yyong/Developer/podo-auth/backend/tests/test_auth_api.py`

**Step 1: Write get_current_user dependency**

deps.py:
```python
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")

    return user
```

**Step 2: Write failing tests**

```python
@pytest.mark.asyncio
async def test_get_me(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = login_resp.json()["access_token"]

    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert response.json()["name"] == "테스트"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    refresh_cookie = login_resp.cookies.get("refresh_token")

    response = await client.post("/api/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_update_me(client):
    await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "테스트",
    })
    login_resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = login_resp.json()["access_token"]

    response = await client.put("/api/auth/me", json={"name": "새이름"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["name"] == "새이름"
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py -v -k "me or refresh"`
Expected: FAIL

**Step 4: Implement endpoints**

Add to auth.py:
```python
from fastapi import Cookie

from app.core.deps import get_current_user
from app.schemas.auth import UserUpdateRequest


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="리프레시 토큰이 없습니다")

    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshTokenModel).where(
            RefreshTokenModel.token_hash == token_hash,
            RefreshTokenModel.expires_at > datetime.now(timezone.utc),
        )
    )
    stored_token = result.scalar_one_or_none()
    if not stored_token:
        raise HTTPException(status_code=401, detail="유효하지 않은 리프레시 토큰입니다")

    user_result = await db.execute(select(User).where(User.id == stored_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")

    # Delete old refresh token
    await db.delete(stored_token)

    # Issue new tokens
    access_token = create_access_token(user_id=str(user.id), email=user.email, name=user.name)
    new_refresh = create_refresh_token()
    new_refresh_model = RefreshTokenModel(
        id=generate_tsid(),
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_model)
    await db.commit()

    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.name is not None:
        current_user.name = data.name

    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다")
        current_user.password_hash = hash_password(data.new_password)

    await db.commit()
    await db.refresh(current_user)
    return current_user
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/yyong/Developer/podo-auth/backend && uv run pytest tests/test_auth_api.py -v`
Expected: All passed

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add refresh, me, update-me endpoints with tests"
```

---

## Phase 2: podo-auth 프론트엔드

### Task 9: 프론트엔드 프로젝트 초기화

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/frontend/` (React + Vite + Tailwind)

**Step 1: Scaffold React project**

```bash
cd /Users/yyong/Developer/podo-auth
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom axios react-hot-toast lucide-react
npm install -D @tailwindcss/vite tailwindcss
```

**Step 2: Configure vite.config.ts**

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: Write index.css** (podo 디자인 시스템 - bookshop과 동일)

```css
@import "tailwindcss";

@theme {
  --color-grape-50: #faf5ff;
  --color-grape-100: #f3e8ff;
  --color-grape-200: #e9d5ff;
  --color-grape-300: #d8b4fe;
  --color-grape-400: #c084fc;
  --color-grape-500: #a855f7;
  --color-grape-600: #9333ea;
  --color-grape-700: #7c3aed;
  --color-grape-800: #6b21a8;
  --color-grape-900: #581c87;

  --color-leaf-50: #f0fdf4;
  --color-leaf-100: #dcfce7;
  --color-leaf-200: #bbf7d0;
  --color-leaf-400: #4ade80;
  --color-leaf-500: #22c55e;
  --color-leaf-600: #16a34a;
  --color-leaf-700: #15803d;

  --color-cream: #fefce8;
  --color-warm-50: #fafaf9;
  --color-warm-100: #f5f5f4;
  --color-warm-200: #e7e5e4;
  --color-warm-500: #78716c;
  --color-warm-700: #44403c;
  --color-warm-900: #1c1917;

  --font-family-sans: "Pretendard Variable", Pretendard, -apple-system,
    BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI",
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
}

body {
  background-color: var(--color-cream);
  color: var(--color-warm-900);
}
```

**Step 4: Write API client**

`frontend/src/api/client.ts`:
```typescript
import axios from "axios";

const api = axios.create({ baseURL: "/api" });
export default api;
```

**Step 5: Commit**

```bash
cd /Users/yyong/Developer/podo-auth
git add frontend/
git commit -m "feat: initialize podo-auth frontend with podo design system"
```

---

### Task 10: 로그인 페이지

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/frontend/src/pages/LoginPage.tsx`
- Create: `/Users/yyong/Developer/podo-auth/frontend/src/App.tsx`

**Step 1: Implement LoginPage**

```tsx
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Grape } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/client";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (redirectUri) {
        const separator = redirectUri.includes("?") ? "&" : "?";
        window.location.href = `${redirectUri}${separator}token=${data.access_token}`;
      } else {
        window.location.href = "/profile";
      }
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-grape-100">
            <Grape className="h-8 w-8 text-grape-600" />
          </div>
          <h1 className="text-2xl font-bold text-warm-900">포도 로그인</h1>
          <p className="mt-1 text-sm text-warm-500">podo 서비스에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              placeholder="8자 이상"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-grape-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-warm-500">
          계정이 없으신가요?{" "}
          <Link
            to={`/register${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`}
            className="font-medium text-grape-600 hover:text-grape-700"
          >
            가입하기
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Set up routing in App.tsx**

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-grape-400">불러오는 중...</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add login page with podo design"
```

---

### Task 11: 회원가입 페이지

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/frontend/src/pages/RegisterPage.tsx`

**Step 1: Implement RegisterPage**

```tsx
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Grape } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/client";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, name });
      // Auto-login after registration
      const { data } = await api.post("/auth/login", { email, password });
      if (redirectUri) {
        const separator = redirectUri.includes("?") ? "&" : "?";
        window.location.href = `${redirectUri}${separator}token=${data.access_token}`;
      } else {
        window.location.href = "/profile";
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(detail || "가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-grape-100">
            <Grape className="h-8 w-8 text-grape-600" />
          </div>
          <h1 className="text-2xl font-bold text-warm-900">포도 가입</h1>
          <p className="mt-1 text-sm text-warm-500">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              placeholder="이름"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              placeholder="8자 이상"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-grape-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-warm-500">
          이미 계정이 있으신가요?{" "}
          <Link
            to={`/login${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`}
            className="font-medium text-grape-600 hover:text-grape-700"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add register page"
```

---

### Task 12: 프로필 페이지

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/frontend/src/pages/ProfilePage.tsx`

**Step 1: Implement ProfilePage** (간단한 프로필 수정 + 로그아웃)

```tsx
import { useEffect, useState } from "react";
import { Grape, LogOut } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/client";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("podo_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setUser(data);
        setName(data.name);
      })
      .catch(() => {
        localStorage.removeItem("podo_token");
        window.location.href = "/login";
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("podo_token");
      const { data } = await api.put("/auth/me", { name }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      toast.success("저장되었습니다");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("podo_token");
    window.location.href = "/login";
  };

  if (!user) return <div className="flex h-screen items-center justify-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-grape-100">
            <Grape className="h-8 w-8 text-grape-600" />
          </div>
          <h1 className="text-2xl font-bold text-warm-900">내 프로필</h1>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">이메일</label>
            <p className="rounded-lg bg-warm-50 px-4 py-3 text-sm text-warm-500">{user.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading || name === user.name}
            className="w-full rounded-lg bg-grape-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white py-3 text-sm text-warm-500 transition-colors hover:bg-warm-50"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add profile page"
```

---

### Task 13: podo-auth Docker 설정

**Files:**
- Create: `/Users/yyong/Developer/podo-auth/backend/Dockerfile`
- Create: `/Users/yyong/Developer/podo-auth/frontend/Dockerfile`
- Create: `/Users/yyong/Developer/podo-auth/frontend/nginx.conf`
- Create: `/Users/yyong/Developer/podo-auth/docker-compose.yml`

**Step 1: Write backend Dockerfile** (match podo-bookshop pattern)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

RUN mkdir -p /data

ENV DATABASE_URL=sqlite+aiosqlite:////data/podo-auth.db

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 2: Write frontend Dockerfile**

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Step 3: Write nginx.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://auth-backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Step 4: Write docker-compose.yml**

```yaml
services:
  auth-backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - auth-data:/data
    environment:
      - DATABASE_URL=sqlite+aiosqlite:////data/podo-auth.db
      - JWT_SECRET=${JWT_SECRET:-podo-jwt-secret-change-in-production}
      - CORS_ORIGINS=*
      - ALLOWED_REDIRECT_ORIGINS=http://localhost:3100,http://localhost:5173
    restart: unless-stopped

  auth-frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - auth-backend
    restart: unless-stopped

volumes:
  auth-data:
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Docker deployment configuration"
```

---

## Phase 3: podo-bookshop 백엔드 인증 연동

### Task 14: JWT 검증 미들웨어 추가

**Files:**
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/pyproject.toml` (add pyjwt dependency)
- Create: `/Users/yyong/Developer/podo-bookshop/backend/app/core/auth.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/core/config.py` (add JWT settings)

**Step 1: Add pyjwt to dependencies**

In pyproject.toml, add to dependencies:
```
"pyjwt>=2.9.0",
```

Run: `cd /Users/yyong/Developer/podo-bookshop/backend && uv sync`

**Step 2: Add JWT settings to config.py**

```python
class Settings(BaseSettings):
    # ... existing fields ...
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    AUTH_SERVER_URL: str = "http://localhost:3000"
```

**Step 3: Write auth.py**

```python
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
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")

    return CurrentUser(
        id=int(payload["sub"]),
        email=payload["email"],
        name=payload["name"],
    )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser | None:
    """For backward compatibility during migration: returns None if no token."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="podo-auth",
        )
        return CurrentUser(id=int(payload["sub"]), email=payload["email"], name=payload["name"])
    except jwt.PyJWTError:
        return None
```

**Step 4: Commit**

```bash
cd /Users/yyong/Developer/podo-bookshop
git add .
git commit -m "feat: add JWT verification middleware for podo-auth integration"
```

---

### Task 15: DB 마이그레이션 - user_id 컬럼 추가

**Files:**
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/models/book.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/models/review.py`

**Step 1: Add user_id to Book model**

```python
user_id = Column(BigInteger, nullable=True, index=True)  # nullable for migration
```

**Step 2: Add user_id to Review model**

```python
user_id = Column(BigInteger, nullable=True, index=True)  # nullable for migration
```

**Step 3: Generate and run Alembic migration**

```bash
cd /Users/yyong/Developer/podo-bookshop/backend
uv run alembic revision --autogenerate -m "add user_id to books and reviews"
uv run alembic upgrade head
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add user_id column to books and reviews tables"
```

---

### Task 16: Settings/Goals를 DB 테이블로 마이그레이션

**Files:**
- Create: `/Users/yyong/Developer/podo-bookshop/backend/app/models/user_settings.py`
- Create: `/Users/yyong/Developer/podo-bookshop/backend/app/models/user_goals.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/models/__init__.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/api/settings.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/api/goals.py`

**Step 1: Write UserSettings model**

```python
from sqlalchemy import BigInteger, Column, DateTime, String, func

from app.core.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=True, unique=True, index=True)
    child_birthdate = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

**Step 2: Write UserGoals model**

```python
from sqlalchemy import BigInteger, Column, DateTime, Integer, func

from app.core.database import Base


class UserGoals(Base):
    __tablename__ = "user_goals"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=True, unique=True, index=True)
    monthly = Column(Integer, default=0, server_default="0")
    yearly = Column(Integer, default=0, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

**Step 3: Update models/__init__.py**

```python
from app.models.book import Book
from app.models.review import Review
from app.models.user_goals import UserGoals
from app.models.user_settings import UserSettings

__all__ = ["Book", "Review", "UserGoals", "UserSettings"]
```

**Step 4: Generate and run migration**

```bash
cd /Users/yyong/Developer/podo-bookshop/backend
uv run alembic revision --autogenerate -m "add user_settings and user_goals tables"
uv run alembic upgrade head
```

**Step 5: Rewrite settings.py** (JSON file → DB)

```python
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.user_settings import UserSettings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_user),
):
    user_id = user.id if user else None
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings_row = result.scalar_one_or_none()
    if not settings_row:
        return {"child_birthdate": None}
    return {"child_birthdate": settings_row.child_birthdate}


@router.put("")
async def update_settings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_user),
):
    user_id = user.id if user else None
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings_row = result.scalar_one_or_none()

    if not settings_row:
        settings_row = UserSettings(id=generate_tsid(), user_id=user_id)
        db.add(settings_row)

    settings_row.child_birthdate = data.get("child_birthdate")
    await db.commit()
    return {"child_birthdate": settings_row.child_birthdate}
```

**Step 6: Rewrite goals.py** (JSON file → DB, similar pattern)

Rewrite to use UserGoals model instead of JSON file, with same `get_optional_user` pattern.

**Step 7: Create migration script to copy existing JSON data**

```bash
# One-time data migration script
cd /Users/yyong/Developer/podo-bookshop/backend
# Read existing JSON, insert into DB tables
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: migrate settings and goals from JSON files to database"
```

---

### Task 17: API 엔드포인트에 인증 연동

**Files:**
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/api/books.py`
- Modify: `/Users/yyong/Developer/podo-bookshop/backend/app/api/reviews.py`

**Step 1: Update books.py** - Add `get_optional_user` dependency to all endpoints

For each endpoint, add:
```python
from app.core.auth import CurrentUser, get_optional_user

# In each route function signature:
user: CurrentUser | None = Depends(get_optional_user)

# In queries, add:
if user:
    base = base.where(Book.user_id == user.id)
```

For create operations:
```python
book = Book(id=generate_tsid(), user_id=user.id if user else None, ...)
```

**Step 2: Update reviews.py** - Same pattern

**Step 3: Run existing tests (if any) to verify backward compatibility**

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add user isolation to books and reviews API endpoints"
```

---

## Phase 4: podo-bookshop 프론트엔드 인증 연동

### Task 18: AuthContext 추가

**Files:**
- Create: `/Users/yyong/Developer/podo-bookshop/frontend/src/context/AuthContext.tsx`

**Step 1: Implement AuthContext**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("podo_token"));

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("podo_token", token);
    } else {
      localStorage.removeItem("podo_token");
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
    window.location.href = `${authUrl}/login`;
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add AuthContext for JWT management"
```

---

### Task 19: Auth Callback 라우트 + ProtectedRoute

**Files:**
- Create: `/Users/yyong/Developer/podo-bookshop/frontend/src/pages/AuthCallbackPage.tsx`
- Create: `/Users/yyong/Developer/podo-bookshop/frontend/src/components/ProtectedRoute.tsx`
- Modify: `/Users/yyong/Developer/podo-bookshop/frontend/src/App.tsx`

**Step 1: Write AuthCallbackPage**

```tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("podo_token", token);
      navigate("/", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-grape-400">
      로그인 처리 중...
    </div>
  );
}
```

**Step 2: Write ProtectedRoute**

```tsx
import { type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
const CALLBACK_URL = import.meta.env.VITE_AUTH_CALLBACK_URL || "http://localhost:5173/auth/callback";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    const redirectUri = encodeURIComponent(CALLBACK_URL);
    window.location.href = `${AUTH_URL}/login?redirect_uri=${redirectUri}`;
    return null;
  }

  return <>{children}</>;
}
```

**Step 3: Update App.tsx** - Wrap routes with AuthProvider and ProtectedRoute

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
// ... existing lazy imports ...

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* ... existing routes ... */}
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add auth callback, protected routes, and auth provider"
```

---

### Task 20: API 클라이언트에 Authorization 헤더 추가

**Files:**
- Modify: `/Users/yyong/Developer/podo-bookshop/frontend/src/api/client.ts`

**Step 1: Add interceptor**

```typescript
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("podo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("podo_token");
      const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
      const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
      window.location.href = `${authUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add JWT auth headers and 401 redirect to API client"
```

---

## Phase 5: 통합 배포

### Task 21: podo-bookshop Docker 환경 업데이트

**Files:**
- Modify: `/Users/yyong/Developer/podo-bookshop/docker-compose.yml`
- Modify: `/Users/yyong/Developer/podo-bookshop/frontend/Dockerfile` (add VITE env vars)

**Step 1: Update docker-compose.yml** - Add JWT_SECRET and AUTH_URL env vars

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    volumes:
      - podo-data:/data
    environment:
      - DATABASE_URL=sqlite+aiosqlite:////data/podo.db
      - CORS_ORIGINS=*
      - JWT_SECRET=${JWT_SECRET:-podo-jwt-secret-change-in-production}
      - AUTH_SERVER_URL=http://localhost:3000
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        - VITE_AUTH_URL=http://localhost:3000
        - VITE_AUTH_CALLBACK_URL=http://localhost:3100/auth/callback
    ports:
      - "3100:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  podo-data:
```

**Step 2: Update frontend Dockerfile** - Accept build args

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_AUTH_URL=http://localhost:3000
ARG VITE_AUTH_CALLBACK_URL=http://localhost:3100/auth/callback
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_AUTH_CALLBACK_URL=$VITE_AUTH_CALLBACK_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: update Docker config for podo-auth SSO integration"
```

---

### Task 22: 통합 테스트 및 배포

**Step 1: Start podo-auth**

```bash
cd /Users/yyong/Developer/podo-auth
docker compose up -d --build
```

**Step 2: Start podo-bookshop**

```bash
cd /Users/yyong/Developer/podo-bookshop
JWT_SECRET=podo-jwt-secret-change-in-production docker compose up -d --build
```

**Step 3: Verify end-to-end flow**

1. Open `http://localhost:3100` → should redirect to `http://localhost:3000/login`
2. Register a new account
3. After register → redirects back to `http://localhost:3100/auth/callback?token=...`
4. `http://localhost:3100` should now show the bookshop
5. Verify books/reviews are isolated per user

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: integration adjustments from end-to-end testing"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-8 | podo-auth 백엔드 (User model, security, auth API) |
| 2 | 9-13 | podo-auth 프론트엔드 (Login, Register, Profile, Docker) |
| 3 | 14-17 | podo-bookshop 백엔드 연동 (JWT middleware, user_id migration) |
| 4 | 18-20 | podo-bookshop 프론트엔드 연동 (AuthContext, callback, interceptor) |
| 5 | 21-22 | Docker 배포 및 통합 테스트 |
