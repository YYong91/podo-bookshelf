async def test_create_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    resp = await client.post("/api/reviews", json={
        "book_id": book_id, "read_date": "2026-02-15",
        "memo": "따뜻한 이야기", "child_reaction": "빵 먹고 싶다고 함",
    })
    assert resp.status_code == 201
    assert resp.json()["book_id"] == book_id

async def test_create_review_with_book(client):
    resp = await client.post("/api/reviews/with-book", json={
        "title": "곰 사냥을 떠나자", "author": "마이클 로젠",
        "read_date": "2026-02-14", "memo": "반복되는 문장이 재밌어요",
        "child_reaction": "같이 소리내며 읽음",
    })
    assert resp.status_code == 201
    assert resp.json()["book"]["title"] == "곰 사냥을 떠나자"

async def test_list_reviews(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-14", "memo": "또 읽었어요"})
    resp = await client.get("/api/reviews")
    assert resp.status_code == 200
    assert resp.json()["total"] == 2
    assert len(resp.json()["items"]) == 2

async def test_update_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    review = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    review_id = review.json()["id"]
    resp = await client.put(f"/api/reviews/{review_id}", json={"memo": "정말 좋아요!"})
    assert resp.status_code == 200
    assert resp.json()["memo"] == "정말 좋아요!"

async def test_delete_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    review = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "좋아요"})
    review_id = review.json()["id"]
    resp = await client.delete(f"/api/reviews/{review_id}")
    assert resp.status_code == 204
    list_resp = await client.get("/api/reviews")
    assert list_resp.json()["total"] == 0
