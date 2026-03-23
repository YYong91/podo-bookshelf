async def test_create_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    resp = await client.post(
        "/api/reviews",
        json={
            "book_id": book_id,
            "read_date": "2026-02-15",
            "memo": "따뜻한 이야기",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["book_id"] == book_id


async def test_create_review_with_book(client):
    resp = await client.post(
        "/api/reviews/with-book",
        json={
            "title": "곰 사냥을 떠나자",
            "author": "마이클 로젠",
            "read_date": "2026-02-14",
            "memo": "반복되는 문장이 재밌어요",
        },
    )
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


async def test_get_review(client):
    book = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    book_id = book.json()["id"]
    create = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2024-01-01"})
    review_id = create.json()["id"]
    resp = await client.get(f"/api/reviews/{review_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == review_id
    assert "book" in resp.json()
    assert resp.json()["book"]["title"] == "구름빵"


async def test_get_review_not_found(client):
    resp = await client.get("/api/reviews/99999")
    assert resp.status_code == 404


async def test_read_date_kst_today_accepted(client):
    """KST 기준 오늘(=UTC 기준 내일)도 타임존 버퍼로 허용되어야 한다."""
    from datetime import date, timedelta

    # UTC 기준 "내일" = KST 자정~08:59에 오늘로 보이는 날짜
    tomorrow = date.today() + timedelta(days=1)

    book = await client.post("/api/books", json={"title": "시간 테스트", "author": "테스트"})
    book_id = book.json()["id"]
    resp = await client.post(
        "/api/reviews",
        json={
            "book_id": book_id,
            "read_date": tomorrow.isoformat(),
            "memo": "KST 자정 테스트",
        },
    )
    assert resp.status_code == 201


async def test_read_date_future_rejected(client):
    """확실히 미래인 날짜는 거부되어야 한다."""
    from datetime import date, timedelta

    future_date = date.today() + timedelta(days=30)
    book = await client.post("/api/books", json={"title": "미래 테스트", "author": "테스트"})
    book_id = book.json()["id"]
    resp = await client.post(
        "/api/reviews",
        json={
            "book_id": book_id,
            "read_date": future_date.isoformat(),
            "memo": "미래 날짜",
        },
    )
    assert resp.status_code == 422


async def test_create_review_with_book_returns_total_reviews(client):
    """POST /with-book 응답에 total_reviews가 포함되어야 한다."""
    resp = await client.post(
        "/api/reviews/with-book",
        json={
            "title": "토탈 테스트",
            "author": "테스트 작가",
            "read_date": "2026-02-14",
            "memo": "메모",
        },
    )
    assert resp.status_code == 201
    assert "total_reviews" in resp.json()
    assert resp.json()["total_reviews"] >= 1


async def test_create_review_with_book_tags(client):
    """ReviewCreateWithBook으로 tags를 전달할 수 있어야 한다."""
    resp = await client.post(
        "/api/reviews/with-book",
        json={
            "title": "태그 테스트",
            "author": "테스트 작가",
            "read_date": "2026-02-14",
            "memo": "메모",
            "tags": ["그림책", "잠자리"],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["tags"] == ["그림책", "잠자리"]
