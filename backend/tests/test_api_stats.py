async def test_stats_empty(client):
    resp = await client.get("/api/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"total_reviews": 0, "grapes": 0, "bunches": 0, "trees": 0}


async def test_stats_with_reviews(client):
    for i in range(37):
        book = await client.post("/api/books", json={"title": f"책{i}", "author": "작가"})
        await client.post("/api/reviews", json={
            "book_id": book.json()["id"],
            "read_date": "2026-02-15",
            "memo": f"감상{i}",
        })
    resp = await client.get("/api/stats")
    data = resp.json()
    assert data["total_reviews"] == 37
    assert data["grapes"] == 7
    assert data["bunches"] == 3
    assert data["trees"] == 0
