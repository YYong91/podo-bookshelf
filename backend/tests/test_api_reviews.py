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


async def test_list_reviews_filter_language(client):
    """언어 필터가 올바르게 동작해야 한다."""
    b_ko = await client.post("/api/books", json={"title": "한국어책", "author": "작가", "language": "ko"})
    b_en = await client.post("/api/books", json={"title": "English Book", "author": "Author", "language": "en"})
    await client.post("/api/reviews", json={"book_id": b_ko.json()["id"], "read_date": "2026-02-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": b_en.json()["id"], "read_date": "2026-02-02", "memo": ""})

    resp = await client.get("/api/reviews?language=en")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["book"]["language"] == "en"


async def test_list_reviews_filter_favorite(client):
    """즐겨찾기 필터가 올바르게 동작해야 한다."""
    b1 = await client.post("/api/books", json={"title": "일반책", "author": "작가"})
    b2 = await client.post("/api/books", json={"title": "즐겨찾기책", "author": "작가"})
    await client.patch(f"/api/books/{b2.json()['id']}/favorite")
    await client.post("/api/reviews", json={"book_id": b1.json()["id"], "read_date": "2026-02-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": b2.json()["id"], "read_date": "2026-02-02", "memo": ""})

    resp = await client.get("/api/reviews?favorite=true")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["book"]["is_favorite"] is True


async def test_list_reviews_filter_date_range(client):
    """날짜 범위 필터가 올바르게 동작해야 한다."""
    book = await client.post("/api/books", json={"title": "날짜테스트", "author": "작가"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-15", "memo": "1월"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-02-15", "memo": "2월"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-03-15", "memo": "3월"})

    resp = await client.get("/api/reviews?date_from=2026-02-01&date_to=2026-02-28")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["memo"] == "2월"


async def test_list_reviews_filter_date_from_only(client):
    """date_from만 지정해도 필터가 동작해야 한다."""
    book = await client.post("/api/books", json={"title": "날짜시작", "author": "작가"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-01", "memo": "오래전"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-03-01", "memo": "최근"})

    resp = await client.get("/api/reviews?date_from=2026-02-01")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["memo"] == "최근"


async def test_list_reviews_filter_text_search(client):
    """텍스트 검색이 제목과 작가에 대해 동작해야 한다."""
    b1 = await client.post("/api/books", json={"title": "구름빵", "author": "백희나"})
    b2 = await client.post("/api/books", json={"title": "팥빙수", "author": "이지은"})
    await client.post("/api/reviews", json={"book_id": b1.json()["id"], "read_date": "2026-02-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": b2.json()["id"], "read_date": "2026-02-02", "memo": ""})

    resp = await client.get("/api/reviews?q=구름")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


async def test_list_reviews_pagination(client):
    """리뷰 페이지네이션이 동작해야 한다."""
    book = await client.post("/api/books", json={"title": "페이지책", "author": "작가"})
    bid = book.json()["id"]
    for i in range(5):
        await client.post("/api/reviews", json={"book_id": bid, "read_date": f"2026-02-0{i + 1}", "memo": f"리뷰{i}"})

    resp = await client.get("/api/reviews?page=1&size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["size"] == 2

    resp2 = await client.get("/api/reviews?page=3&size=2")
    assert len(resp2.json()["items"]) == 1


async def test_update_review_not_found(client):
    """존재하지 않는 리뷰 수정 시 404를 반환해야 한다."""
    resp = await client.put("/api/reviews/99999", json={"memo": "수정"})
    assert resp.status_code == 404


async def test_delete_review_not_found(client):
    """존재하지 않는 리뷰 삭제 시 404를 반환해야 한다."""
    resp = await client.delete("/api/reviews/99999")
    assert resp.status_code == 404


async def test_create_review_book_not_found(client):
    """존재하지 않는 책에 리뷰 생성 시 404를 반환해야 한다."""
    resp = await client.post("/api/reviews", json={"book_id": "99999", "read_date": "2026-02-01", "memo": "없는 책"})
    assert resp.status_code == 404


async def test_create_review_with_book_isbn_reuse(client):
    """ISBN이 동일한 책으로 with-book 리뷰 생성 시 기존 책을 재사용해야 한다."""
    resp1 = await client.post(
        "/api/reviews/with-book",
        json={
            "title": "구름빵",
            "author": "백희나",
            "isbn": "9788953523562",
            "read_date": "2026-02-01",
            "memo": "첫번째",
        },
    )
    assert resp1.status_code == 201
    book_id_1 = resp1.json()["book"]["id"]

    resp2 = await client.post(
        "/api/reviews/with-book",
        json={
            "title": "구름빵",
            "author": "백희나",
            "isbn": "9788953523562",
            "read_date": "2026-02-02",
            "memo": "두번째",
        },
    )
    assert resp2.status_code == 201
    book_id_2 = resp2.json()["book"]["id"]
    assert book_id_1 == book_id_2


async def test_update_review_tags(client):
    """리뷰의 태그를 업데이트할 수 있어야 한다."""
    book = await client.post("/api/books", json={"title": "태그수정", "author": "작가"})
    review = await client.post(
        "/api/reviews",
        json={
            "book_id": book.json()["id"],
            "read_date": "2026-02-01",
            "memo": "",
            "tags": ["그림책"],
        },
    )
    rid = review.json()["id"]
    resp = await client.put(f"/api/reviews/{rid}", json={"tags": ["동화", "잠자리"]})
    assert resp.status_code == 200
    assert resp.json()["tags"] == ["동화", "잠자리"]


async def test_list_reviews_order_by_read_date_desc(client):
    """리뷰 목록이 읽은 날짜 역순으로 정렬되어야 한다."""
    book = await client.post("/api/books", json={"title": "정렬책", "author": "작가"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-01", "memo": "옛날"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-03-01", "memo": "최근"})

    resp = await client.get("/api/reviews")
    items = resp.json()["items"]
    assert items[0]["memo"] == "최근"
    assert items[1]["memo"] == "옛날"
