from unittest.mock import AsyncMock, patch

import httpx


async def test_search_books(client):
    mock_response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://www.googleapis.com/books/v1/volumes"),
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


async def test_search_books_isbn_local_hit(client):
    """ISBN 검색 시 로컬 DB에 책이 있으면 source=local로 반환해야 한다."""
    # 먼저 로컬에 ISBN이 있는 책 등록
    await client.post(
        "/api/books",
        json={
            "title": "구름빵",
            "author": "백희나",
            "isbn": "9788953523562",
        },
    )

    resp = await client.get("/api/search/books/isbn/9788953523562")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "local"
    assert data["book"]["title"] == "구름빵"
    assert data["book"]["isbn"] == "9788953523562"


async def test_search_books_isbn_google_fallback(client):
    """ISBN이 로컬 DB에 없으면 Google Books API로 폴백해야 한다."""
    mock_response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://www.googleapis.com/books/v1/volumes"),
        json={
            "items": [
                {
                    "volumeInfo": {
                        "title": "알 수 없는 책",
                        "authors": ["미지 작가"],
                        "publisher": "출판사",
                        "imageLinks": {"thumbnail": "https://example.com/cover.jpg"},
                        "industryIdentifiers": [{"type": "ISBN_13", "identifier": "9781234567890"}],
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

        resp = await client.get("/api/search/books/isbn/9781234567890")
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "google"
        assert data["book"]["title"] == "알 수 없는 책"


async def test_search_books_isbn_invalid(client):
    """유효하지 않은 ISBN은 400 에러를 반환해야 한다."""
    resp = await client.get("/api/search/books/isbn/12345")
    assert resp.status_code == 400


async def test_search_books_isbn_not_found_google(client):
    """Google Books에서도 찾지 못하면 404를 반환해야 한다."""
    mock_response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://www.googleapis.com/books/v1/volumes"),
        json={},
    )
    with patch("app.api.search.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        resp = await client.get("/api/search/books/isbn/9789999999999")
        assert resp.status_code == 404


async def test_search_books_isbn_with_hyphens(client):
    """하이픈이 포함된 ISBN도 처리할 수 있어야 한다."""
    await client.post(
        "/api/books",
        json={
            "title": "하이픈책",
            "author": "작가",
            "isbn": "9788953523562",
        },
    )
    resp = await client.get("/api/search/books/isbn/978-89-535-2356-2")
    assert resp.status_code == 200
    assert resp.json()["source"] == "local"


async def test_search_books_children_priority(client):
    """아동서가 일반서보다 먼저 정렬되어야 한다."""
    mock_response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://www.googleapis.com/books/v1/volumes"),
        json={
            "items": [
                {
                    "volumeInfo": {
                        "title": "일반서적",
                        "authors": ["작가A"],
                        "categories": ["Fiction"],
                    }
                },
                {
                    "volumeInfo": {
                        "title": "그림책모음",
                        "authors": ["작가B"],
                        "categories": ["Juvenile Fiction"],
                    }
                },
            ]
        },
    )
    with patch("app.api.search.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        resp = await client.get("/api/search/books?q=test&language=en")
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 2
        # 아동서(is_children=True)가 먼저
        assert results[0]["is_children"] is True
        assert results[1]["is_children"] is False


async def test_search_books_empty_results(client):
    """검색 결과가 없으면 빈 리스트를 반환해야 한다."""
    mock_response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://www.googleapis.com/books/v1/volumes"),
        json={},
    )
    with patch("app.api.search.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        resp = await client.get("/api/search/books?q=존재하지않는책")
        assert resp.status_code == 200
        assert resp.json() == []


async def test_search_books_isbn_local_with_review_count(client):
    """로컬 ISBN 검색 시 review_count가 포함되어야 한다."""
    book = await client.post("/api/books", json={"title": "리뷰수책", "author": "작가", "isbn": "9788953523562"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-02", "memo": ""})

    resp = await client.get("/api/search/books/isbn/9788953523562")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "local"
    assert data["book"]["review_count"] == 2
