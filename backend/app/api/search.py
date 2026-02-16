import httpx
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter(prefix="/api/search", tags=["search"])

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

# 아동/유아 관련 카테고리 키워드
CHILDREN_CATEGORIES = {"juvenile", "children", "picture book", "그림책", "유아", "아동", "동화"}


def _is_children_book(info: dict) -> bool:
    categories = " ".join(info.get("categories", [])).lower()
    return any(kw in categories for kw in CHILDREN_CATEGORIES)


@router.get("/books")
async def search_books(
    q: str = Query(..., min_length=1),
    language: str = Query("ko"),
):
    params = {"q": q, "maxResults": 20, "langRestrict": language}
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
            "is_children": _is_children_book(info),
        })

    # 아동서 우선 정렬
    results.sort(key=lambda x: (not x["is_children"],))
    return results[:15]
