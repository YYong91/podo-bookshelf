"""보안 취약점 수정 테스트 (이슈 #8)."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.auth import CurrentUser, get_current_user, get_optional_user
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
TEST_USER = CurrentUser(id=1, email="test@example.com", name="테스트")


@pytest.fixture
async def client():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    async def override_get_current_user():
        return TEST_USER

    async def override_get_optional_user():
        return TEST_USER

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def unauthenticated_client():
    """인증 없는 클라이언트 — dependency override 없음."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    # get_current_user, get_optional_user는 override하지 않음 → 토큰 없으면 401
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# --- C1: LIKE injection ---


async def test_like_special_chars_in_book_search(client):
    """검색어에 % 문자가 있어도 와일드카드로 동작하지 않아야 한다."""
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    # '%' 검색은 모든 책에 매칭되면 안 됨
    resp = await client.get("/api/books", params={"q": "%"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


async def test_like_special_chars_in_review_search(client):
    """리뷰 검색에서도 LIKE 특수문자가 이스케이프되어야 한다."""
    resp = await client.post(
        "/api/reviews/with-book",
        json={"title": "구름빵", "author": "백희나", "read_date": "2026-02-14", "memo": "좋아요"},
    )
    assert resp.status_code == 201
    # '%' 검색은 매칭되면 안 됨
    resp = await client.get("/api/reviews", params={"q": "%"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


# --- C2/C3: 미인증 search 엔드포인트 ---


async def test_search_books_requires_auth(unauthenticated_client):
    """GET /api/search/books는 인증이 필요하다."""
    resp = await unauthenticated_client.get("/api/search/books", params={"q": "구름빵"})
    assert resp.status_code == 401


async def test_search_isbn_requires_auth(unauthenticated_client):
    """GET /api/search/books/isbn/{isbn}은 인증이 필요하다."""
    resp = await unauthenticated_client.get("/api/search/books/isbn/9788901260716")
    assert resp.status_code == 401


# --- C4: JWT payload KeyError ---


async def test_jwt_missing_claims():
    """JWT payload에 필수 필드 누락 시 401 반환."""

    import jwt as pyjwt

    from app.core.config import settings

    # sub만 있고 email, name 없는 토큰
    token = pyjwt.encode({"sub": "1", "iss": "podo-auth"}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides = {get_db: override_get_db}
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        resp = await ac.get("/api/books")
    assert resp.status_code == 401
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
