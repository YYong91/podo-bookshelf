import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookResponse

router = APIRouter(prefix="/api/search", tags=["search"])

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

# 아동/유아 관련 카테고리 키워드
CHILDREN_CATEGORIES = {"juvenile", "children", "picture book", "그림책", "유아", "아동", "동화"}

_KOREAN_RE = re.compile(r"[\uac00-\ud7af\u3130-\u318f]")


def _is_children_book(info: dict) -> bool:
    categories = " ".join(info.get("categories", [])).lower()
    return any(kw in categories for kw in CHILDREN_CATEGORIES)


def _detect_language(text: str) -> str:
    return "ko" if _KOREAN_RE.search(text) else "en"


@router.get("/books")
async def search_books(
    q: str = Query(..., min_length=1),
    language: str | None = Query(None),
):
    lang = language or _detect_language(q)
    params = {"q": q, "maxResults": 20, "langRestrict": lang}
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
            "language": info.get("language", lang),
            "is_children": _is_children_book(info),
        })

    # 아동서 우선 정렬
    results.sort(key=lambda x: (not x["is_children"],))
    return results[:15]


def _parse_google_book(info: dict, lang: str = "ko") -> dict:
    """Google Books volumeInfo → BookSearchResult 형태로 변환."""
    isbn = None
    for identifier in info.get("industryIdentifiers", []):
        if identifier["type"] in ("ISBN_13", "ISBN_10"):
            isbn = identifier["identifier"]
            break
    return {
        "title": info.get("title", ""),
        "author": ", ".join(info.get("authors", [])),
        "publisher": info.get("publisher", ""),
        "cover_url": info.get("imageLinks", {}).get("thumbnail", ""),
        "isbn": isbn,
        "language": info.get("language", lang),
        "is_children": _is_children_book(info),
    }


@router.get("/books/isbn/{isbn}")
async def search_book_by_isbn(isbn: str, db: AsyncSession = Depends(get_db)):
    """ISBN으로 책 조회: 로컬 DB 우선 → Google Books 폴백."""
    # 숫자만 추출 (하이픈 등 제거)
    clean_isbn = re.sub(r"[^0-9X]", "", isbn.upper())
    if len(clean_isbn) not in (10, 13):
        raise HTTPException(status_code=400, detail="유효하지 않은 ISBN이에요")

    # 1) 로컬 DB 조회
    review_count = (
        select(func.count(Review.id))
        .where(Review.book_id == Book.id, Review.is_deleted.is_(False))
        .correlate(Book)
        .scalar_subquery()
    )
    stmt = (
        select(Book, review_count.label("review_count"))
        .where(Book.isbn == clean_isbn, Book.is_deleted.is_(False))
    )
    row = (await db.execute(stmt)).first()
    if row:
        book_resp = BookResponse(**row.Book.__dict__, review_count=row.review_count or 0)
        return {"source": "local", "book": book_resp.model_dump(mode="json")}

    # 2) Google Books API 폴백
    params = {"q": f"isbn:{clean_isbn}", "maxResults": 1}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_BOOKS_URL, params=params)
        resp.raise_for_status()

    data = resp.json()
    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="이 바코드의 책 정보를 찾지 못했어요")

    info = items[0].get("volumeInfo", {})
    book_data = _parse_google_book(info)
    return {"source": "google", "book": book_data}
