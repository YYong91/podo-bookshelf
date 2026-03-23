import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.book import Book
from app.schemas.book import BookResponse
from app.services.book_service import review_count_subquery
from app.services.search_service import (
    GOOGLE_BOOKS_URL,
    build_google_books_params,
    detect_language,
    parse_google_book,
    sort_children_first,
)

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/books")
async def search_books(
    q: str = Query(..., min_length=1),
    language: str | None = Query(None),
    user: CurrentUser = Depends(get_current_user),
):
    lang = language or detect_language(q)
    params = build_google_books_params(q, lang, max_results=20, api_key=settings.GOOGLE_BOOKS_API_KEY)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_BOOKS_URL, params=params)
        resp.raise_for_status()

    data = resp.json()
    items = data.get("items", [])
    results = [parse_google_book(item.get("volumeInfo", {}), lang) for item in items]
    return sort_children_first(results)


@router.get("/books/isbn/{isbn}")
async def search_book_by_isbn(
    isbn: str,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """ISBN으로 책 조회: 로컬 DB 우선 → Google Books 폴백."""
    # 숫자만 추출 (하이픈 등 제거)
    clean_isbn = re.sub(r"[^0-9X]", "", isbn.upper())
    if len(clean_isbn) not in (10, 13):
        raise HTTPException(status_code=400, detail="유효하지 않은 ISBN이에요")

    # 1) 로컬 DB 조회 (해당 사용자 소유 데이터만)
    user_id = user.id
    rc = review_count_subquery(user_id)
    stmt = select(Book, rc.label("review_count")).where(
        Book.isbn == clean_isbn,
        Book.user_id == user_id,
        Book.is_deleted.is_(False),
    )
    row = (await db.execute(stmt)).first()
    if row:
        book_resp = BookResponse(**row.Book.__dict__, review_count=row.review_count or 0)
        return {"source": "local", "book": book_resp.model_dump(mode="json")}

    # 2) Google Books API 폴백
    params: dict[str, str | int] = {"q": f"isbn:{clean_isbn}", "maxResults": 1}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_BOOKS_URL, params=params)
        resp.raise_for_status()

    data = resp.json()
    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="이 바코드의 책 정보를 찾지 못했어요")

    info = items[0].get("volumeInfo", {})
    book_data = parse_google_book(info)
    return {"source": "google", "book": book_data}
