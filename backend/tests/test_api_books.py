async def test_create_book(client):
    resp = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "구름빵"
    assert "id" in data

async def test_list_books(client):
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    await client.post("/api/books", json={"title": "팥빙수의 전설", "author": "이지은"})
    resp = await client.get("/api/books")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2

async def test_get_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.get(f"/api/books/{book_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "구름빵"

async def test_update_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.put(f"/api/books/{book_id}", json={"title": "구름빵 (개정판)"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "구름빵 (개정판)"

async def test_delete_book(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.delete(f"/api/books/{book_id}")
    assert resp.status_code == 204
    list_resp = await client.get("/api/books")
    assert len(list_resp.json()["items"]) == 0


async def test_toggle_favorite(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.patch(f"/api/books/{book_id}/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is True


async def test_toggle_favorite_twice(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    await client.patch(f"/api/books/{book_id}/favorite")
    resp = await client.patch(f"/api/books/{book_id}/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is False


async def test_list_book_reviews(client):
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2024-01-01"})
    resp = await client.get(f"/api/books/{book_id}/reviews")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) == 1


async def test_get_book_not_found(client):
    resp = await client.get("/api/books/99999")
    assert resp.status_code == 404


async def test_create_book_missing_title(client):
    resp = await client.post("/api/books", json={"author": "백희나"})
    assert resp.status_code == 422
