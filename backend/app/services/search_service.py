"""Google Books API 검색 서비스 — 파싱/변환 로직."""

import re

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

# 아동/유아 관련 카테고리 키워드
CHILDREN_CATEGORIES = {
    "juvenile",
    "children",
    "picture book",
    "그림책",
    "유아",
    "아동",
    "동화",
}

_KOREAN_RE = re.compile(r"[\uac00-\ud7af\u3130-\u318f]")


def is_children_book(info: dict) -> bool:
    """카테고리 기반 아동서 여부 판별."""
    categories = " ".join(info.get("categories", [])).lower()
    return any(kw in categories for kw in CHILDREN_CATEGORIES)


def detect_language(text: str) -> str:
    """한글 포함 여부로 언어 감지."""
    return "ko" if _KOREAN_RE.search(text) else "en"


def parse_google_book(info: dict, lang: str = "ko") -> dict:
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
        "is_children": is_children_book(info),
    }


def build_google_books_params(
    query: str,
    language: str | None = None,
    *,
    max_results: int = 20,
    api_key: str = "",
) -> dict[str, str | int]:
    """Google Books API 요청 파라미터 생성."""
    lang = language or detect_language(query)
    params: dict[str, str | int] = {
        "q": query,
        "maxResults": max_results,
        "langRestrict": lang,
    }
    if api_key:
        params["key"] = api_key
    return params


def sort_children_first(results: list[dict], *, limit: int = 15) -> list[dict]:
    """아동서 우선 정렬 후 limit 개수만큼 반환."""
    results.sort(key=lambda x: (not x["is_children"],))
    return results[:limit]
