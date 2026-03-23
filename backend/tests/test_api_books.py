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


async def test_update_book_empty_title_rejected(client):
    """빈 문자열로 제목 업데이트는 거부되어야 한다."""
    create = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = create.json()["id"]
    resp = await client.put(f"/api/books/{book_id}", json={"title": ""})
    assert resp.status_code == 422


async def test_delete_book_cascades_reviews(client):
    """책 삭제 시 연결된 리뷰도 함께 soft delete되어야 한다."""
    book = await client.post("/api/books", json={"title": "삭제 테스트", "author": "테스트"})
    book_id = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-15", "memo": "리뷰1"})
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-02-16", "memo": "리뷰2"})

    # 책 삭제
    resp = await client.delete(f"/api/books/{book_id}")
    assert resp.status_code == 204

    # 리뷰 목록에서 해당 리뷰 미노출
    reviews = await client.get("/api/reviews")
    assert reviews.json()["total"] == 0


async def test_list_books_search_by_title(client):
    """제목으로 책 검색이 되어야 한다."""
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    await client.post("/api/books", json={"title": "팥빙수의 전설", "author": "이지은"})
    resp = await client.get("/api/books?q=구름")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "구름빵"


async def test_list_books_search_by_author(client):
    """작가명으로 책 검색이 되어야 한다."""
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    await client.post("/api/books", json={"title": "팥빙수의 전설", "author": "이지은"})
    resp = await client.get("/api/books?q=이지은")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["author"] == "이지은"


async def test_list_books_search_no_match(client):
    """검색 결과가 없으면 빈 목록을 반환해야 한다."""
    await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    resp = await client.get("/api/books?q=존재하지않는검색어")
    assert resp.status_code == 200
    assert resp.json()["items"] == []
    assert resp.json()["total"] == 0


async def test_list_books_sort_title(client):
    """제목순 정렬이 올바르게 동작해야 한다."""
    await client.post("/api/books", json={"title": "나무", "author": "작가"})
    await client.post("/api/books", json={"title": "가나다", "author": "작가"})
    await client.post("/api/books", json={"title": "다라마", "author": "작가"})
    resp = await client.get("/api/books?sort=title")
    assert resp.status_code == 200
    titles = [b["title"] for b in resp.json()["items"]]
    assert titles == sorted(titles)


async def test_list_books_sort_newest(client):
    """최신순 정렬이 올바르게 동작해야 한다."""
    await client.post("/api/books", json={"title": "첫번째", "author": "작가"})
    await client.post("/api/books", json={"title": "두번째", "author": "작가"})
    resp = await client.get("/api/books?sort=newest")
    assert resp.status_code == 200
    items = resp.json()["items"]
    # 최신(두번째)이 먼저 와야 함
    assert items[0]["title"] == "두번째"
    assert items[1]["title"] == "첫번째"


async def test_list_books_sort_most_read(client):
    """많이 읽은 순 정렬이 올바르게 동작해야 한다."""
    b1 = await client.post("/api/books", json={"title": "적게읽은책", "author": "작가"})
    b2 = await client.post("/api/books", json={"title": "많이읽은책", "author": "작가"})
    await client.post("/api/reviews", json={"book_id": b1.json()["id"], "read_date": "2026-01-01", "memo": ""})
    for i in range(3):
        await client.post("/api/reviews", json={"book_id": b2.json()["id"], "read_date": f"2026-01-0{i + 1}", "memo": ""})
    resp = await client.get("/api/books?sort=most_read")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert items[0]["title"] == "많이읽은책"


async def test_list_books_sort_recent_default(client):
    """기본 정렬(recent)이 최근 읽은 날짜 순이어야 한다."""
    b1 = await client.post("/api/books", json={"title": "오래전에읽은책", "author": "작가"})
    b2 = await client.post("/api/books", json={"title": "최근에읽은책", "author": "작가"})
    await client.post("/api/reviews", json={"book_id": b1.json()["id"], "read_date": "2026-01-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": b2.json()["id"], "read_date": "2026-02-01", "memo": ""})
    resp = await client.get("/api/books")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert items[0]["title"] == "최근에읽은책"


async def test_list_books_pagination(client):
    """limit/offset 페이지네이션이 동작해야 한다."""
    for i in range(5):
        await client.post("/api/books", json={"title": f"책{i}", "author": "작가"})
    resp = await client.get("/api/books?limit=2&offset=0")
    assert len(resp.json()["items"]) == 2
    assert resp.json()["total"] == 5

    resp2 = await client.get("/api/books?limit=2&offset=4")
    assert len(resp2.json()["items"]) == 1


async def test_create_book_isbn_duplicate_returns_existing(client):
    """같은 ISBN의 책을 중복 생성하면 기존 책을 200으로 반환해야 한다."""
    resp1 = await client.post("/api/books", json={"title": "구름빵", "author": "백희나", "isbn": "9788953523562"})
    assert resp1.status_code == 201
    first_id = resp1.json()["id"]

    resp2 = await client.post("/api/books", json={"title": "구름빵", "author": "백희나", "isbn": "9788953523562"})
    assert resp2.status_code == 200
    assert resp2.json()["id"] == first_id


async def test_create_book_isbn_duplicate_with_reviews(client):
    """ISBN 중복 시 review_count도 포함해서 반환해야 한다."""
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나", "isbn": "9788953523562"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-01", "memo": ""})

    resp = await client.post("/api/books", json={"title": "구름빵", "author": "백희나", "isbn": "9788953523562"})
    assert resp.status_code == 200
    assert resp.json()["review_count"] == 1


async def test_update_book_not_found(client):
    """존재하지 않는 책 수정 시 404를 반환해야 한다."""
    resp = await client.put("/api/books/99999", json={"title": "수정된 제목"})
    assert resp.status_code == 404


async def test_delete_book_not_found(client):
    """존재하지 않는 책 삭제 시 404를 반환해야 한다."""
    resp = await client.delete("/api/books/99999")
    assert resp.status_code == 404


async def test_toggle_favorite_not_found(client):
    """존재하지 않는 책의 즐겨찾기 토글 시 404를 반환해야 한다."""
    resp = await client.patch("/api/books/99999/favorite")
    assert resp.status_code == 404


async def test_create_book_with_all_fields(client):
    """모든 필드를 포함한 책 생성이 동작해야 한다."""
    resp = await client.post(
        "/api/books",
        json={
            "title": "구름빵",
            "author": "백희나",
            "cover_url": "https://example.com/cover.jpg",
            "isbn": "9788953523562",
            "publisher": "한솔수북",
            "language": "ko",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["isbn"] == "9788953523562"
    assert data["publisher"] == "한솔수북"
