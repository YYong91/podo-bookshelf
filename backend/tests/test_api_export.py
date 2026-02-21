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
