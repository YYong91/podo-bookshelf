# 포도책방 MVP 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 아이와 함께 읽은 책의 리딩 로그를 포도 성장 시스템으로 시각화하는 개인용 웹 앱 MVP

**Architecture:** FastAPI 백엔드(SQLite + aiosqlite) + React 프론트엔드(Vite + Tailwind CSS v4). 책 검색은 Google Books API 프록시. 포도 시각화는 SVG 컴포넌트. Docker Compose로 맥미니에 배포.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), aiosqlite, Alembic, tsidpy, httpx, React 19, Vite 7, Tailwind CSS v4, Axios, React Router v7, Docker

**디자인 문서:** `docs/plans/2026-02-15-podo-bookshop-design.md`

---

## Task 1: 백엔드 프로젝트 셋업

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/tsid.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/.env.example`
- Create: `.gitignore`

### Step 1: pyproject.toml 작성

```toml
[project]
name = "podo-bookshop"
version = "0.1.0"
description = "포도책방 - 아이와 함께 읽은 책 리딩 로그"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "aiosqlite>=0.20.0",
    "alembic>=1.14.0",
    "pydantic-settings>=2.7.0",
    "tsidpy>=1.1.5",
    "httpx>=0.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
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

### Step 2: core/config.py 작성

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # 앱 설정
    APP_NAME: str = "포도책방"
    DEBUG: bool = False

    # DB
    DATABASE_URL: str = "sqlite+aiosqlite:///./podo.db"

    # Google Books API
    GOOGLE_BOOKS_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "*"


settings = Settings()
```

### Step 3: core/database.py 작성

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

### Step 4: core/tsid.py 작성

```python
from tsidpy import TSID


def generate_tsid() -> int:
    return TSID.create().number
```

### Step 5: main.py 작성

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: 테이블 자동 생성
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Step 6: .env.example + .gitignore 작성

`.env.example`:
```
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./podo.db
GOOGLE_BOOKS_API_KEY=
CORS_ORIGINS=*
```

`.gitignore`:
```
__pycache__/
*.py[cod]
*.db
.env
.venv/
.ruff_cache/
node_modules/
dist/
.DS_Store
*.egg-info/
.pytest_cache/
htmlcov/
```

### Step 7: __init__.py 파일 생성

빈 `__init__.py` 파일: `backend/app/__init__.py`, `backend/app/core/__init__.py`, `backend/app/api/__init__.py`, `backend/app/models/__init__.py`, `backend/app/schemas/__init__.py`

### Step 8: 의존성 설치 및 서버 실행 확인

```bash
cd /Users/yyong/Developer/podo-bookshop
uv init --no-readme --no-pin-python backend
cd backend
uv add fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite alembic pydantic-settings tsidpy httpx
uv add --dev pytest pytest-asyncio pytest-cov ruff
```

Run: `cd backend && uv run uvicorn app.main:app --reload --port 8001`
Expected: 서버 시작, `http://localhost:8001/health` → `{"status":"ok"}`

### Step 9: 커밋

```bash
git add -A
git commit -m "feat: 백엔드 프로젝트 초기 셋업 (FastAPI + SQLite + TSID)"
```

---

## Task 2: 데이터베이스 모델 + Alembic

**Files:**
- Create: `backend/app/models/book.py`
- Create: `backend/app/models/review.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/` (Alembic init)
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_models.py`

### Step 1: 모델 테스트 작성 (failing)

`backend/tests/conftest.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
```

`backend/tests/test_models.py`:
```python
from datetime import date

from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review


async def test_create_book(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)
    assert book.title == "구름빵"
    assert book.is_deleted is False


async def test_create_review(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()

    review = Review(
        id=generate_tsid(),
        book_id=book.id,
        read_date=date(2026, 2, 15),
        memo="구름으로 만든 빵이 신기했어요",
        child_reaction="빵 먹고 싶다고 했음",
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    assert review.book_id == book.id
    assert review.is_deleted is False


async def test_soft_delete_book(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()

    book.is_deleted = True
    await db_session.commit()
    await db_session.refresh(book)
    assert book.is_deleted is True
    assert book.deleted_at is None  # deleted_at은 API 레이어에서 설정
```

### Step 2: 테스트 실패 확인

Run: `cd backend && uv run pytest tests/test_models.py -v`
Expected: FAIL (모듈 없음)

### Step 3: 모델 구현

`backend/app/models/book.py`:
```python
from sqlalchemy import BigInteger, Boolean, Column, DateTime, String, func

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(BigInteger, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    cover_url = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, server_default="0")
```

`backend/app/models/review.py`:
```python
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, String, func

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=False)
    read_date = Column(Date, nullable=False)
    memo = Column(String, nullable=True, default="")
    child_reaction = Column(String, nullable=True, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, server_default="0")
```

`backend/app/models/__init__.py`:
```python
from app.models.book import Book
from app.models.review import Review

__all__ = ["Book", "Review"]
```

### Step 4: 테스트 통과 확인

Run: `cd backend && uv run pytest tests/test_models.py -v`
Expected: 3 passed

### Step 5: Alembic 초기화

```bash
cd backend
uv run alembic init alembic
```

`alembic.ini`에서 `sqlalchemy.url` 수정:
```ini
sqlalchemy.url = sqlite:///./podo.db
```

`alembic/env.py` 수정: `target_metadata = Base.metadata` 설정 + models import

```bash
uv run alembic revision --autogenerate -m "초기 스키마: books, reviews"
uv run alembic upgrade head
```

### Step 6: 커밋

```bash
git add -A
git commit -m "feat: Book, Review 모델 + Alembic 초기 마이그레이션"
```

---

## Task 3: Pydantic 스키마

**Files:**
- Create: `backend/app/schemas/book.py`
- Create: `backend/app/schemas/review.py`
- Create: `backend/app/schemas/stats.py`

### Step 1: 스키마 작성

`backend/app/schemas/book.py`:
```python
from datetime import datetime

from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=200)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class BookResponse(BookBase):
    id: int
    created_at: datetime
    review_count: int = 0

    model_config = {"from_attributes": True}
```

`backend/app/schemas/review.py`:
```python
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.book import BookResponse


class ReviewBase(BaseModel):
    read_date: date
    memo: str = ""
    child_reaction: str = ""


class ReviewCreate(ReviewBase):
    book_id: int


class ReviewCreateWithBook(ReviewBase):
    """책 정보와 함께 리뷰 생성 (책이 없으면 자동 생성)"""
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class ReviewUpdate(BaseModel):
    read_date: date | None = None
    memo: str | None = None
    child_reaction: str | None = None


class ReviewResponse(ReviewBase):
    id: int
    book_id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReviewDetailResponse(ReviewResponse):
    book: BookResponse
```

`backend/app/schemas/stats.py`:
```python
from pydantic import BaseModel


class GardenStats(BaseModel):
    total_reviews: int
    grapes: int       # 현재 송이에서 채워지는 포도알 (total % 10)
    bunches: int      # 현재 나무에 달린 완성 송이 ((total // 10) % 10)
    trees: int        # 완성된 나무 (total // 100)
```

### Step 2: 커밋

```bash
git add -A
git commit -m "feat: Pydantic 스키마 (Book, Review, Stats)"
```

---

## Task 4: Books API

**Files:**
- Create: `backend/app/api/books.py`
- Modify: `backend/app/main.py` (라우터 등록)
- Create: `backend/tests/test_api_books.py`

### Step 1: API 테스트 작성 (failing)

`backend/tests/test_api_books.py`:
```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def test_create_book(client):
    resp = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "구름빵"
    assert data["author"] == "백희나"
    assert "id" in data


async def test_list_books(client):
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    await client.post("/api/books", json={"title": "팥빙수의 전설", "author": "이지은"})
    resp = await client.get("/api/books")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_get_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.get(f"/api/books/{book_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "구름빵"


async def test_update_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.put(f"/api/books/{book_id}", json={"title": "구름빵 (개정판)"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "구름빵 (개정판)"


async def test_delete_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.delete(f"/api/books/{book_id}")
    assert resp.status_code == 204
    # soft delete 확인: 목록에서 안 보임
    list_resp = await client.get("/api/books")
    assert len(list_resp.json()) == 0
```

### Step 2: 테스트 실패 확인

Run: `cd backend && uv run pytest tests/test_api_books.py -v`
Expected: FAIL

### Step 3: Books API 구현

`backend/app/api/books.py`:
```python
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookCreate, BookResponse, BookUpdate

router = APIRouter(prefix="/api/books", tags=["books"])


@router.post("", response_model=BookResponse, status_code=201)
async def create_book(data: BookCreate, db: AsyncSession = Depends(get_db)):
    book = Book(id=generate_tsid(), **data.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return BookResponse(**book.__dict__, review_count=0)


@router.get("", response_model=list[BookResponse])
async def list_books(db: AsyncSession = Depends(get_db)):
    # 리뷰 카운트 서브쿼리
    review_count = (
        select(func.count(Review.id))
        .where(Review.book_id == Book.id, Review.is_deleted == False)
        .correlate(Book)
        .scalar_subquery()
    )
    stmt = select(Book, review_count.label("review_count")).where(Book.is_deleted == False).order_by(Book.id.desc())
    result = await db.execute(stmt)
    return [BookResponse(**row.Book.__dict__, review_count=row.review_count or 0) for row in result.all()]


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted == False)
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: int, data: BookUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(book, key, value)
    await db.commit()
    await db.refresh(book)
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted == False)
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    book.is_deleted = True
    book.deleted_at = datetime.now()
    await db.commit()
```

### Step 4: main.py에 라우터 등록

```python
# main.py에 추가
from app.api.books import router as books_router
app.include_router(books_router)
```

### Step 5: 테스트용 conftest 수정 — 인메모리 DB 오버라이드

`backend/tests/conftest.py`에 app dependency override 추가:
```python
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def client():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
```

### Step 6: 테스트 통과 확인

Run: `cd backend && uv run pytest tests/test_api_books.py -v`
Expected: 5 passed

### Step 7: 커밋

```bash
git add -A
git commit -m "feat: Books CRUD API + 테스트"
```

---

## Task 5: Reviews API

**Files:**
- Create: `backend/app/api/reviews.py`
- Modify: `backend/app/main.py` (라우터 등록)
- Create: `backend/tests/test_api_reviews.py`

### Step 1: API 테스트 작성 (failing)

`backend/tests/test_api_reviews.py`:
```python
async def test_create_review(client):
    # 책 먼저 생성
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    resp = await client.post("/api/reviews", json={
        "book_id": book_id,
        "read_date": "2026-02-15",
        "memo": "따뜻한 이야기",
        "child_reaction": "빵 먹고 싶다고 함",
    })
    assert resp.status_code == 201
    assert resp.json()["book_id"] == book_id


async def test_create_review_with_book(client):
    """책 정보와 함께 리뷰 생성 (책이 없으면 자동 생성)"""
    resp = await client.post("/api/reviews/with-book", json={
        "title": "곰 사냥을 떠나자",
        "author": "마이클 로젠",
        "read_date": "2026-02-14",
        "memo": "반복되는 문장이 재밌어요",
        "child_reaction": "같이 소리내며 읽음",
    })
    assert resp.status_code == 201
    assert resp.json()["book"]["title"] == "곰 사냥을 떠나자"


async def test_list_reviews(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-14", "memo": "또 읽었어요"})
    resp = await client.get("/api/reviews")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_update_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    review = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    review_id = review.json()["id"]
    resp = await client.put(f"/api/reviews/{review_id}", json={"memo": "정말 좋아요!"})
    assert resp.status_code == 200
    assert resp.json()["memo"] == "정말 좋아요!"


async def test_delete_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    review = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    review_id = review.json()["id"]
    resp = await client.delete(f"/api/reviews/{review_id}")
    assert resp.status_code == 204
    list_resp = await client.get("/api/reviews")
    assert len(list_resp.json()) == 0
```

### Step 2: 테스트 실패 확인

Run: `cd backend && uv run pytest tests/test_api_reviews.py -v`
Expected: FAIL

### Step 3: Reviews API 구현

`backend/app/api/reviews.py`:
```python
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookResponse
from app.schemas.review import ReviewCreate, ReviewCreateWithBook, ReviewDetailResponse, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=201)
async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    # book 존재 확인
    book = (await db.execute(select(Book).where(Book.id == data.book_id, Book.is_deleted == False))).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review = Review(id=generate_tsid(), **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.post("/with-book", response_model=ReviewDetailResponse, status_code=201)
async def create_review_with_book(data: ReviewCreateWithBook, db: AsyncSession = Depends(get_db)):
    """책 정보와 함께 리뷰 생성. ISBN이 일치하는 기존 책이 있으면 재사용."""
    book = None
    if data.isbn:
        stmt = select(Book).where(Book.isbn == data.isbn, Book.is_deleted == False)
        book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        book = Book(
            id=generate_tsid(),
            title=data.title,
            author=data.author,
            cover_url=data.cover_url,
            isbn=data.isbn,
            publisher=data.publisher,
        )
        db.add(book)
        await db.flush()

    review = Review(
        id=generate_tsid(),
        book_id=book.id,
        read_date=data.read_date,
        memo=data.memo,
        child_reaction=data.child_reaction,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await db.refresh(book)
    return ReviewDetailResponse(
        **review.__dict__,
        book=BookResponse(**book.__dict__, review_count=0),
    )


@router.get("", response_model=list[ReviewDetailResponse])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Review, Book)
        .join(Book, Review.book_id == Book.id)
        .where(Review.is_deleted == False)
        .order_by(Review.id.desc())
    )
    result = await db.execute(stmt)
    return [
        ReviewDetailResponse(
            **row.Review.__dict__,
            book=BookResponse(**row.Book.__dict__, review_count=0),
        )
        for row in result.all()
    ]


@router.get("/{review_id}", response_model=ReviewDetailResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review, Book).join(Book, Review.book_id == Book.id).where(Review.id == review_id, Review.is_deleted == False)
    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    return ReviewDetailResponse(
        **result.Review.__dict__,
        book=BookResponse(**result.Book.__dict__, review_count=0),
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(review_id: int, data: ReviewUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted == False)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    review.updated_at = datetime.now()
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=204)
async def delete_review(review_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted == False)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    review.is_deleted = True
    review.deleted_at = datetime.now()
    await db.commit()
```

### Step 4: main.py에 라우터 등록

```python
from app.api.reviews import router as reviews_router
app.include_router(reviews_router)
```

### Step 5: 테스트 통과 확인

Run: `cd backend && uv run pytest tests/test_api_reviews.py -v`
Expected: 5 passed

### Step 6: 커밋

```bash
git add -A
git commit -m "feat: Reviews CRUD API + with-book 엔드포인트 + 테스트"
```

---

## Task 6: Google Books 검색 API

**Files:**
- Create: `backend/app/api/search.py`
- Modify: `backend/app/main.py` (라우터 등록)
- Create: `backend/tests/test_api_search.py`

### Step 1: 테스트 작성 (mock 사용)

`backend/tests/test_api_search.py`:
```python
from unittest.mock import AsyncMock, patch

import httpx


async def test_search_books(client):
    mock_response = httpx.Response(
        200,
        json={
            "items": [
                {
                    "volumeInfo": {
                        "title": "구름빵",
                        "authors": ["백희나"],
                        "publisher": "한솔수북",
                        "imageLinks": {"thumbnail": "https://example.com/cover.jpg"},
                        "industryIdentifiers": [{"type": "ISBN_13", "identifier": "9788953523562"}],
                    }
                }
            ]
        },
    )
    with patch("app.api.search.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        resp = await client.get("/api/search/books?q=구름빵")
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) >= 1
        assert results[0]["title"] == "구름빵"
```

### Step 2: Search API 구현

`backend/app/api/search.py`:
```python
import httpx
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter(prefix="/api/search", tags=["search"])

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


@router.get("/books")
async def search_books(q: str = Query(..., min_length=1)):
    params = {"q": q, "maxResults": 10, "langRestrict": "ko"}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_BOOKS_URL, params=params)
        resp.raise_for_status()

    data = resp.json()
    items = data.get("items", [])
    results = []
    for item in items:
        info = item.get("volumeInfo", {})
        isbn = None
        for identifier in info.get("industryIdentifiers", []):
            if identifier["type"] in ("ISBN_13", "ISBN_10"):
                isbn = identifier["identifier"]
                break
        results.append({
            "title": info.get("title", ""),
            "author": ", ".join(info.get("authors", [])),
            "publisher": info.get("publisher", ""),
            "cover_url": info.get("imageLinks", {}).get("thumbnail", ""),
            "isbn": isbn,
        })
    return results
```

### Step 3: main.py에 라우터 등록

```python
from app.api.search import router as search_router
app.include_router(search_router)
```

### Step 4: 테스트 통과 확인

Run: `cd backend && uv run pytest tests/test_api_search.py -v`
Expected: 1 passed

### Step 5: 커밋

```bash
git add -A
git commit -m "feat: Google Books 검색 API 프록시 + 테스트"
```

---

## Task 7: Stats API (포도정원 통계)

**Files:**
- Create: `backend/app/api/stats.py`
- Modify: `backend/app/main.py` (라우터 등록)
- Create: `backend/tests/test_api_stats.py`

### Step 1: 테스트 작성

`backend/tests/test_api_stats.py`:
```python
async def test_stats_empty(client):
    resp = await client.get("/api/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"total_reviews": 0, "grapes": 0, "bunches": 0, "trees": 0}


async def test_stats_with_reviews(client):
    # 37개 리뷰 생성
    for i in range(37):
        book = await client.post("/api/books", json={"title": f"책{i}", "author": "작가"})
        await client.post("/api/reviews", json={
            "book_id": book.json()["id"],
            "read_date": "2026-02-15",
            "memo": f"감상{i}",
        })
    resp = await client.get("/api/stats")
    data = resp.json()
    assert data["total_reviews"] == 37
    assert data["grapes"] == 7        # 37 % 10
    assert data["bunches"] == 3       # (37 // 10) % 10
    assert data["trees"] == 0         # 37 // 100
```

### Step 2: Stats API 구현

`backend/app/api/stats.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.review import Review
from app.schemas.stats import GardenStats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=GardenStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    stmt = select(func.count(Review.id)).where(Review.is_deleted == False)
    total = (await db.execute(stmt)).scalar() or 0
    return GardenStats(
        total_reviews=total,
        grapes=total % 10,
        bunches=(total // 10) % 10,
        trees=total // 100,
    )
```

### Step 3: main.py에 라우터 등록 + 전체 테스트

```python
from app.api.stats import router as stats_router
app.include_router(stats_router)
```

Run: `cd backend && uv run pytest -v`
Expected: 전체 테스트 통과

### Step 4: 커밋

```bash
git add -A
git commit -m "feat: 포도정원 Stats API + 전체 백엔드 테스트 통과"
```

---

## Task 8: 프론트엔드 프로젝트 셋업

**Files:**
- Create: `frontend/` (Vite + React + TypeScript)
- Create: `frontend/src/index.css` (Tailwind + 포도 테마)
- Create: `frontend/src/App.tsx` (라우팅)
- Create: `frontend/src/components/layout/Layout.tsx`
- Create: `frontend/src/components/layout/BottomNav.tsx`
- Create: `frontend/vite.config.ts`

### Step 1: Vite 프로젝트 생성

```bash
cd /Users/yyong/Developer/podo-bookshop
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom axios lucide-react react-hot-toast
npm install -D @tailwindcss/vite tailwindcss
```

### Step 2: vite.config.ts

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
```

### Step 3: index.css (포도 테마)

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

@keyframes grape-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce-in {
  0% { transform: translateY(20px); opacity: 0; }
  60% { transform: translateY(-5px); }
  100% { transform: translateY(0); opacity: 1; }
}

.animate-grape-pop {
  animation: grape-pop 0.4s ease-out forwards;
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out forwards;
}
```

### Step 4: Layout + BottomNav

`frontend/src/components/layout/Layout.tsx`:
```tsx
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      <Toaster position="top-center" />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
```

`frontend/src/components/layout/BottomNav.tsx`:
```tsx
import { Home, PenSquare, Library } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "정원" },
  { to: "/write", icon: PenSquare, label: "쓰기" },
  { to: "/reviews", icon: Library, label: "목록" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200 bg-white md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:border-r md:border-t-0">
      {/* 데스크톱 헤더 */}
      <div className="hidden p-6 md:block">
        <h1 className="text-2xl font-bold text-grape-700">🍇 포도책방</h1>
      </div>
      <div className="flex justify-around py-2 md:flex-col md:gap-1 md:px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm ${
                isActive ? "text-grape-700 bg-grape-50" : "text-warm-500 hover:text-grape-600"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### Step 5: App.tsx (라우팅)

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

const HomePage = lazy(() => import("./pages/HomePage"));
const WriteReviewPage = lazy(() => import("./pages/WriteReviewPage"));
const ReviewListPage = lazy(() => import("./pages/ReviewListPage"));
const ReviewDetailPage = lazy(() => import("./pages/ReviewDetailPage"));

function PageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-grape-400">🍇 불러오는 중...</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/write" element={<WriteReviewPage />} />
            <Route path="/reviews" element={<ReviewListPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Step 6: 플레이스홀더 페이지들 생성

각 페이지에 최소한의 플레이스홀더:

`frontend/src/pages/HomePage.tsx`: `export default function HomePage() { return <div>포도정원</div>; }`
`frontend/src/pages/WriteReviewPage.tsx`: `export default function WriteReviewPage() { return <div>리뷰 쓰기</div>; }`
`frontend/src/pages/ReviewListPage.tsx`: `export default function ReviewListPage() { return <div>리뷰 목록</div>; }`
`frontend/src/pages/ReviewDetailPage.tsx`: `export default function ReviewDetailPage() { return <div>리뷰 상세</div>; }`

### Step 7: 개발 서버 실행 확인

Run: `cd frontend && npm run dev`
Expected: `http://localhost:5173` 접속 가능, 하단 탭 네비게이션 표시

### Step 8: 커밋

```bash
git add -A
git commit -m "feat: 프론트엔드 프로젝트 셋업 (React + Vite + Tailwind + 포도 테마)"
```

---

## Task 9: API 클라이언트 + TypeScript 타입

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/books.ts`
- Create: `frontend/src/api/reviews.ts`
- Create: `frontend/src/api/search.ts`
- Create: `frontend/src/api/stats.ts`

### Step 1: TypeScript 타입 정의

`frontend/src/types/index.ts`:
```typescript
export interface Book {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  isbn: string | null;
  publisher: string | null;
  created_at: string;
  review_count: number;
}

export interface Review {
  id: number;
  book_id: number;
  read_date: string;
  memo: string;
  child_reaction: string;
  created_at: string;
  updated_at: string | null;
  book: Book;
}

export interface GardenStats {
  total_reviews: number;
  grapes: number;
  bunches: number;
  trees: number;
}

export interface BookSearchResult {
  title: string;
  author: string;
  publisher: string;
  cover_url: string;
  isbn: string | null;
}

export interface ReviewCreateWithBook {
  title: string;
  author: string;
  cover_url?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  read_date: string;
  memo: string;
  child_reaction: string;
}
```

### Step 2: Axios 클라이언트 + API 모듈

`frontend/src/api/client.ts`:
```typescript
import axios from "axios";

const api = axios.create({ baseURL: "/api" });
export default api;
```

`frontend/src/api/books.ts`:
```typescript
import type { Book } from "../types";
import api from "./client";

export const getBooks = () => api.get<Book[]>("/books").then((r) => r.data);
export const getBook = (id: number) => api.get<Book>(`/books/${id}`).then((r) => r.data);
```

`frontend/src/api/reviews.ts`:
```typescript
import type { Review, ReviewCreateWithBook } from "../types";
import api from "./client";

export const getReviews = () => api.get<Review[]>("/reviews").then((r) => r.data);
export const getReview = (id: number) => api.get<Review>(`/reviews/${id}`).then((r) => r.data);
export const createReviewWithBook = (data: ReviewCreateWithBook) =>
  api.post<Review>("/reviews/with-book", data).then((r) => r.data);
export const updateReview = (id: number, data: Partial<Review>) =>
  api.put<Review>(`/reviews/${id}`, data).then((r) => r.data);
export const deleteReview = (id: number) => api.delete(`/reviews/${id}`);
```

`frontend/src/api/search.ts`:
```typescript
import type { BookSearchResult } from "../types";
import api from "./client";

export const searchBooks = (q: string) =>
  api.get<BookSearchResult[]>("/search/books", { params: { q } }).then((r) => r.data);
```

`frontend/src/api/stats.ts`:
```typescript
import type { GardenStats } from "../types";
import api from "./client";

export const getStats = () => api.get<GardenStats>("/stats").then((r) => r.data);
```

### Step 3: 커밋

```bash
git add -A
git commit -m "feat: 프론트엔드 API 클라이언트 + TypeScript 타입 정의"
```

---

## Task 10: 포도정원 SVG 컴포넌트

**Files:**
- Create: `frontend/src/components/garden/Grape.tsx`
- Create: `frontend/src/components/garden/Bunch.tsx`
- Create: `frontend/src/components/garden/Tree.tsx`
- Create: `frontend/src/components/garden/Garden.tsx`

### Step 1: 개별 포도알 컴포넌트

`frontend/src/components/garden/Grape.tsx`:
```tsx
interface GrapeProps {
  filled: boolean;
  index: number;
  onClick?: () => void;
}

export default function Grape({ filled, index, onClick }: GrapeProps) {
  return (
    <circle
      cx={0}
      cy={0}
      r={12}
      fill={filled ? "#7C3AED" : "#E9D5FF"}
      stroke={filled ? "#6B21A8" : "#C4B5FD"}
      strokeWidth={1.5}
      className={`cursor-pointer transition-all hover:scale-110 ${filled ? "animate-grape-pop" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    />
  );
}
```

### Step 2: 포도송이 컴포넌트

`frontend/src/components/garden/Bunch.tsx`:
```tsx
import Grape from "./Grape";

interface BunchProps {
  filledCount: number; // 0-10
  complete?: boolean;
}

// 포도송이 배치: 1-2-3-2-1-1 패턴
const GRAPE_POSITIONS = [
  { x: 0, y: 0 },
  { x: -14, y: 24 }, { x: 14, y: 24 },
  { x: -28, y: 48 }, { x: 0, y: 48 }, { x: 28, y: 48 },
  { x: -14, y: 72 }, { x: 14, y: 72 },
  { x: 0, y: 96 },
  { x: 0, y: 120 },
];

export default function Bunch({ filledCount, complete }: BunchProps) {
  return (
    <svg viewBox="-40 -20 80 160" className="h-full w-full">
      {/* 줄기 */}
      <line x1={0} y1={-20} x2={0} y2={0} stroke="#15803D" strokeWidth={3} />
      {/* 잎 */}
      <ellipse cx={12} cy={-12} rx={10} ry={6} fill="#22C55E" transform="rotate(-30 12 -12)" />
      {/* 포도알 */}
      {GRAPE_POSITIONS.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          <Grape filled={i < filledCount} index={i} />
        </g>
      ))}
      {complete && (
        <text x={0} y={150} textAnchor="middle" fontSize={10} fill="#7C3AED" fontWeight={600}>
          완성!
        </text>
      )}
    </svg>
  );
}
```

### Step 3: 포도나무 컴포넌트

`frontend/src/components/garden/Tree.tsx`:
```tsx
interface TreeProps {
  bunchCount: number; // 0-10, 완성된 송이 수
}

export default function Tree({ bunchCount }: TreeProps) {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full">
      {/* 나무줄기 */}
      <rect x={55} y={80} width={10} height={120} rx={3} fill="#92400E" />
      {/* 나무 관 (둥근 초록 영역) */}
      <ellipse cx={60} cy={70} rx={55} ry={60} fill="#22C55E" opacity={0.3} />
      {/* 포도송이 표시 (작은 원으로) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i * 36 - 90) * (Math.PI / 180);
        const rx = 35;
        const ry = 40;
        const cx = 60 + rx * Math.cos(angle);
        const cy = 70 + ry * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={10}
            fill={i < bunchCount ? "#7C3AED" : "#E9D5FF"}
            stroke={i < bunchCount ? "#6B21A8" : "#C4B5FD"}
            strokeWidth={1}
          />
        );
      })}
      {/* 이파리 */}
      <ellipse cx={30} cy={40} rx={15} ry={8} fill="#16A34A" transform="rotate(-20 30 40)" />
      <ellipse cx={90} cy={45} rx={15} ry={8} fill="#16A34A" transform="rotate(20 90 45)" />
    </svg>
  );
}
```

### Step 4: 포도정원 전체 뷰

`frontend/src/components/garden/Garden.tsx`:
```tsx
import type { GardenStats } from "../../types";
import Bunch from "./Bunch";
import Tree from "./Tree";

interface GardenProps {
  stats: GardenStats;
}

export default function Garden({ stats }: GardenProps) {
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold text-grape-700">🌿 포도정원 🌿</h2>
        <p className="mt-1 text-sm text-warm-500">
          총 <span className="font-bold text-grape-600">{stats.total_reviews}권</span> 읽었어요!
        </p>
      </div>

      {/* 완성된 나무들 */}
      {stats.trees > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-center text-xs font-medium text-leaf-600">
            🌳 포도나무 {stats.trees}그루
          </p>
          <div className="flex justify-center gap-4">
            {Array.from({ length: stats.trees }).map((_, i) => (
              <div key={i} className="h-32 w-20">
                <Tree bunchCount={10} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 현재 자라는 나무 (송이가 있거나 포도알이 있을 때) */}
      {(stats.bunches > 0 || stats.grapes > 0) && (
        <div className="flex flex-col items-center gap-4">
          {stats.bunches > 0 && (
            <div>
              <p className="mb-2 text-center text-xs font-medium text-grape-500">
                🍇 완성된 송이 {stats.bunches}개
              </p>
              <div className="flex justify-center gap-3">
                {Array.from({ length: stats.bunches }).map((_, i) => (
                  <div key={i} className="h-24 w-12">
                    <Bunch filledCount={10} complete />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 현재 진행 중인 송이 */}
          <div>
            <p className="mb-2 text-center text-xs font-medium text-warm-500">
              지금 자라는 송이 {stats.grapes}/10
            </p>
            <div className="mx-auto h-40 w-24">
              <Bunch filledCount={stats.grapes} />
            </div>
          </div>
        </div>
      )}

      {/* 아직 아무것도 없을 때 */}
      {stats.total_reviews === 0 && (
        <div className="py-8 text-center">
          <div className="mx-auto h-40 w-24 opacity-40">
            <Bunch filledCount={0} />
          </div>
          <p className="mt-4 text-sm text-warm-500">
            첫 번째 책을 읽고 포도알을 심어보세요! 🍇
          </p>
        </div>
      )}
    </div>
  );
}
```

### Step 5: 커밋

```bash
git add -A
git commit -m "feat: 포도정원 SVG 컴포넌트 (포도알, 송이, 나무, 정원)"
```

---

## Task 11: 홈 페이지

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

### Step 1: 홈 페이지 구현

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenSquare } from "lucide-react";
import { getStats } from "../api/stats";
import { getReviews } from "../api/reviews";
import Garden from "../components/garden/Garden";
import type { GardenStats, Review } from "../types";

export default function HomePage() {
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getReviews().then((reviews) => setRecentReviews(reviews.slice(0, 5)));
  }, []);

  if (!stats) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      {/* 포도정원 */}
      <Garden stats={stats} />

      {/* 최근 읽은 책 */}
      {recentReviews.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-warm-700">최근 읽은 책</h3>
          <div className="space-y-2">
            {recentReviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="flex gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {review.book.cover_url ? (
                  <img
                    src={review.book.cover_url}
                    alt={review.book.title}
                    className="h-16 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100 text-lg">
                    📕
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-warm-900">{review.book.title}</p>
                  <p className="text-xs text-warm-500">
                    {review.read_date} · {review.book.author}
                  </p>
                  {review.memo && (
                    <p className="mt-1 truncate text-xs text-warm-500">{review.memo}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAB - 리뷰 쓰기 */}
      <Link
        to="/write"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grape-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-grape-700 md:bottom-8 md:right-8"
      >
        <PenSquare size={24} />
      </Link>
    </div>
  );
}
```

### Step 2: 커밋

```bash
git add -A
git commit -m "feat: 홈 페이지 (포도정원 + 최근 읽은 책)"
```

---

## Task 12: 리뷰 쓰기 페이지

**Files:**
- Modify: `frontend/src/pages/WriteReviewPage.tsx`

### Step 1: 리뷰 쓰기 페이지 구현

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { searchBooks } from "../api/search";
import { createReviewWithBook } from "../api/reviews";
import type { BookSearchResult } from "../types";

export default function WriteReviewPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // 선택된 책 정보
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [bookSelected, setBookSelected] = useState(false);

  // 리뷰 정보
  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const selectBook = (book: BookSearchResult) => {
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.cover_url);
    setIsbn(book.isbn || "");
    setPublisher(book.publisher);
    setBookSelected(true);
    setSearchResults([]);
  };

  const resetBook = () => {
    setTitle("");
    setAuthor("");
    setCoverUrl("");
    setIsbn("");
    setPublisher("");
    setBookSelected(false);
    setManualMode(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) {
      toast.error("책 제목과 저자를 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await createReviewWithBook({
        title, author, cover_url: coverUrl || null,
        isbn: isbn || null, publisher: publisher || null,
        read_date: readDate, memo, child_reaction: childReaction,
      });
      toast.success("🍇 포도알이 하나 생겼어요!");
      navigate("/");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-grape-700">📖 리뷰 쓰기</h1>

      {/* 책 선택 영역 */}
      {!bookSelected ? (
        <div className="space-y-4">
          {!manualMode ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="책 제목으로 검색..."
                  className="flex-1 rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="rounded-lg bg-grape-600 px-4 text-white hover:bg-grape-700 disabled:opacity-50"
                >
                  <Search size={18} />
                </button>
              </div>
              <button
                onClick={() => setManualMode(true)}
                className="text-sm text-grape-500 underline"
              >
                직접 입력하기
              </button>
              {/* 검색 결과 */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((book, i) => (
                    <button
                      key={i}
                      onClick={() => selectBook(book)}
                      className="flex w-full gap-3 rounded-lg border border-warm-200 p-3 text-left hover:border-grape-300 hover:bg-grape-50"
                    >
                      {book.cover_url ? (
                        <img src={book.cover_url} alt="" className="h-16 w-12 rounded object-cover" />
                      ) : (
                        <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100">📕</div>
                      )}
                      <div>
                        <p className="font-semibold text-warm-900">{book.title}</p>
                        <p className="text-xs text-warm-500">{book.author}</p>
                        {book.publisher && <p className="text-xs text-warm-500">{book.publisher}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="책 제목 *" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="저자 *" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={publisher} onChange={(e) => setPublisher(e.target.value)}
                placeholder="출판사 (선택)" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setManualMode(false)} className="text-sm text-warm-500 underline">검색으로 돌아가기</button>
                <button
                  onClick={() => { if (title && author) setBookSelected(true); }}
                  className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700"
                >
                  이 책으로 선택
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 선택된 책 표시 */
        <div className="flex items-start gap-3 rounded-xl bg-grape-50 p-4">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-20 w-14 rounded object-cover" />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded bg-grape-100 text-2xl">📕</div>
          )}
          <div className="flex-1">
            <p className="font-bold text-warm-900">{title}</p>
            <p className="text-sm text-warm-500">{author}</p>
            {publisher && <p className="text-xs text-warm-500">{publisher}</p>}
          </div>
          <button onClick={resetBook} className="text-warm-400 hover:text-warm-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* 리뷰 폼 */}
      {bookSelected && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">📅 읽은 날짜</label>
            <input
              type="date" value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">💬 감상/메모</label>
            <textarea
              value={memo} onChange={(e) => setMemo(e.target.value)}
              rows={4} placeholder="이 책을 읽고 느낀 점을 자유롭게 적어보세요..."
              className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">👶 아이 반응</label>
            <textarea
              value={childReaction} onChange={(e) => setChildReaction(e.target.value)}
              rows={3} placeholder="아이가 어떤 반응을 보였나요?"
              className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-grape-600 py-4 text-base font-bold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "🍇 포도알 심기!"}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 2: 커밋

```bash
git add -A
git commit -m "feat: 리뷰 쓰기 페이지 (검색 + 수동 입력 + 리뷰 폼)"
```

---

## Task 13: 리뷰 목록 페이지

**Files:**
- Modify: `frontend/src/pages/ReviewListPage.tsx`

### Step 1: 구현

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReviews } from "../api/reviews";
import type { Review } from "../types";

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-grape-700">📚 리뷰 목록</h1>
      {reviews.length === 0 ? (
        <div className="py-12 text-center text-warm-500">
          <p className="text-4xl">📖</p>
          <p className="mt-2">아직 리뷰가 없어요</p>
          <Link to="/write" className="mt-2 inline-block text-sm text-grape-500 underline">
            첫 리뷰 쓰러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <Link
              key={review.id}
              to={`/reviews/${review.id}`}
              className="flex gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {review.book.cover_url ? (
                <img src={review.book.cover_url} alt="" className="h-20 w-14 rounded object-cover" />
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded bg-grape-100 text-xl">📕</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-warm-900">{review.book.title}</p>
                <p className="text-xs text-warm-500">{review.book.author} · {review.read_date}</p>
                {review.memo && (
                  <p className="mt-1 line-clamp-2 text-sm text-warm-700">{review.memo}</p>
                )}
                {review.child_reaction && (
                  <p className="mt-1 text-xs text-grape-500">👶 {review.child_reaction}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 2: 커밋

```bash
git add -A
git commit -m "feat: 리뷰 목록 페이지"
```

---

## Task 14: 리뷰 상세 페이지

**Files:**
- Modify: `frontend/src/pages/ReviewDetailPage.tsx`

### Step 1: 구현

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getReview, updateReview, deleteReview } from "../api/reviews";
import type { Review } from "../types";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [readDate, setReadDate] = useState("");

  useEffect(() => {
    if (id) {
      getReview(Number(id)).then((r) => {
        setReview(r);
        setMemo(r.memo);
        setChildReaction(r.child_reaction);
        setReadDate(r.read_date);
      });
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const updated = await updateReview(Number(id), { memo, child_reaction: childReaction, read_date: readDate });
      setReview({ ...review!, ...updated });
      setEditing(false);
      toast.success("수정되었어요");
    } catch {
      toast.error("수정에 실패했어요");
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("정말 삭제할까요?")) return;
    try {
      await deleteReview(Number(id));
      toast.success("삭제되었어요");
      navigate("/reviews");
    } catch {
      toast.error("삭제에 실패했어요");
    }
  };

  if (!review) return <div className="text-center text-warm-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-warm-500 hover:text-warm-700">
        <ArrowLeft size={16} /> 돌아가기
      </button>

      {/* 책 정보 */}
      <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
        {review.book.cover_url ? (
          <img src={review.book.cover_url} alt="" className="h-32 w-24 rounded-lg object-cover shadow" />
        ) : (
          <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-grape-100 text-3xl shadow">📕</div>
        )}
        <div>
          <h1 className="text-lg font-bold text-warm-900">{review.book.title}</h1>
          <p className="text-sm text-warm-500">{review.book.author}</p>
          {review.book.publisher && <p className="text-xs text-warm-500">{review.book.publisher}</p>}
        </div>
      </div>

      {/* 리뷰 내용 */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-warm-700">리딩 로그</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="rounded-lg p-2 text-warm-400 hover:bg-warm-100 hover:text-grape-600">
              <Pencil size={16} />
            </button>
            <button onClick={handleDelete} className="rounded-lg p-2 text-warm-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-warm-500">📅 읽은 날짜</label>
              <input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">💬 감상</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-warm-500">👶 아이 반응</label>
              <textarea value={childReaction} onChange={(e) => setChildReaction(e.target.value)} rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-warm-200 px-3 py-2 text-sm focus:border-grape-400 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700">저장</button>
              <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm text-warm-500 hover:bg-warm-100">취소</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-warm-500">📅 읽은 날짜</p>
              <p className="mt-1 text-sm text-warm-900">{review.read_date}</p>
            </div>
            {review.memo && (
              <div>
                <p className="text-xs font-medium text-warm-500">💬 감상</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-warm-900">{review.memo}</p>
              </div>
            )}
            {review.child_reaction && (
              <div>
                <p className="text-xs font-medium text-warm-500">👶 아이 반응</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-warm-900">{review.child_reaction}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 2: 커밋

```bash
git add -A
git commit -m "feat: 리뷰 상세 페이지 (수정, 삭제 포함)"
```

---

## Task 15: Docker Compose + 배포 설정

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

### Step 1: Backend Dockerfile

`backend/Dockerfile`:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

# SQLite DB 파일 저장용 디렉토리
RUN mkdir -p /data

ENV DATABASE_URL=sqlite+aiosqlite:////data/podo.db

EXPOSE 8001

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Step 2: Frontend Dockerfile + nginx.conf

`frontend/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`frontend/Dockerfile`:
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

### Step 3: docker-compose.yml

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
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  podo-data:
```

### Step 4: 빌드 및 실행 테스트

```bash
cd /Users/yyong/Developer/podo-bookshop
docker-compose up -d --build
```

Expected: `http://맥미니IP:3000` 접속 → 포도책방 작동 확인

### Step 5: 커밋

```bash
git add -A
git commit -m "feat: Docker Compose 배포 설정 (backend + frontend + nginx)"
```

---

## 작업 순서 요약

| # | Task | 예상 커밋 |
|---|------|----------|
| 1 | 백엔드 프로젝트 셋업 | `feat: 백엔드 프로젝트 초기 셋업` |
| 2 | DB 모델 + Alembic | `feat: Book, Review 모델 + Alembic` |
| 3 | Pydantic 스키마 | `feat: Pydantic 스키마` |
| 4 | Books API + 테스트 | `feat: Books CRUD API + 테스트` |
| 5 | Reviews API + 테스트 | `feat: Reviews CRUD API + 테스트` |
| 6 | Search API + 테스트 | `feat: Google Books 검색 API` |
| 7 | Stats API + 테스트 | `feat: 포도정원 Stats API` |
| 8 | 프론트엔드 셋업 | `feat: 프론트엔드 프로젝트 셋업` |
| 9 | API 클라이언트 + 타입 | `feat: API 클라이언트 + TypeScript 타입` |
| 10 | 포도정원 SVG | `feat: 포도정원 SVG 컴포넌트` |
| 11 | 홈 페이지 | `feat: 홈 페이지` |
| 12 | 리뷰 쓰기 페이지 | `feat: 리뷰 쓰기 페이지` |
| 13 | 리뷰 목록 페이지 | `feat: 리뷰 목록 페이지` |
| 14 | 리뷰 상세 페이지 | `feat: 리뷰 상세 페이지` |
| 15 | Docker Compose | `feat: Docker Compose 배포 설정` |
