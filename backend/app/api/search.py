import httpx
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter(prefix="/api/search", tags=["search"])

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


@router.get("/books")
async def search_books(
    q: str = Query(..., min_length=1),
    language: str = Query("ko"),
    children: bool = Query(True),
):
    search_q = q
    if children:
        search_q = f"{q} subject:juvenile"

    params = {"q": search_q, "maxResults": 15, "langRestrict": language}
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
