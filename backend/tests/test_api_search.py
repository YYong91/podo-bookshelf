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
