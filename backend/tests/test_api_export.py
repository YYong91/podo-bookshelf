async def test_export_empty(client):
    resp = await client.get("/api/export")
    assert resp.status_code == 200
    data = resp.json()
    assert data["books"] == []
    assert data["reviews"] == []
    assert data["counts"] == {"books": 0, "reviews": 0}
    assert "exported_at" in data


async def test_export_with_data(client):
    book_resp = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book_resp.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2024-01-01"})

    resp = await client.get("/api/export")
    assert resp.status_code == 200
    data = resp.json()
    assert data["counts"]["books"] == 1
    assert data["counts"]["reviews"] == 1
    assert data["books"][0]["title"] == "구름빵"


async def test_export_content_disposition_header(client):
    resp = await client.get("/api/export")
    assert "content-disposition" in resp.headers
    assert "attachment" in resp.headers["content-disposition"]
    assert "podo-backup-" in resp.headers["content-disposition"]


async def test_export_includes_all_review_fields(client):
    """export에 tags, activity, child_age_months 필드가 포함되어야 한다."""
    book = await client.post("/api/books", json={"title": "필드 테스트", "author": "테스트"})
    book_id = book.json()["id"]
    await client.post(
        "/api/reviews",
        json={
            "book_id": book_id,
            "read_date": "2026-02-15",
            "memo": "메모",
            "activity": "따라 읽기",
            "tags": ["그림책", "잠자리"],
            "child_age_months": 36,
        },
    )

    resp = await client.get("/api/export")
    review = resp.json()["reviews"][0]
    assert review["activity"] == "따라 읽기"
    assert review["tags"] == ["그림책", "잠자리"]
    assert review["child_age_months"] == 36


async def test_export_includes_book_is_favorite(client):
    """export에 is_favorite 필드가 포함되어야 한다."""
    book = await client.post("/api/books", json={"title": "즐겨찾기 테스트", "author": "테스트"})
    book_id = book.json()["id"]
    await client.patch(f"/api/books/{book_id}/favorite")

    resp = await client.get("/api/export")
    exported_book = resp.json()["books"][0]
    assert "is_favorite" in exported_book
    assert exported_book["is_favorite"] is True
