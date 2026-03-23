async def test_stats_empty(client):
    resp = await client.get("/api/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"total_reviews": 0, "grapes": 0, "bunches": 0, "trees": 0}


async def test_stats_with_reviews(client):
    for i in range(37):
        book = await client.post("/api/books", json={"title": f"책{i}", "author": "작가"})
        await client.post(
            "/api/reviews",
            json={
                "book_id": book.json()["id"],
                "read_date": "2026-02-15",
                "memo": f"감상{i}",
            },
        )
    resp = await client.get("/api/stats")
    data = resp.json()
    assert data["total_reviews"] == 37
    assert data["grapes"] == 7
    assert data["bunches"] == 3
    assert data["trees"] == 0


async def test_stats_tree_threshold(client):
    """100개 리뷰 → trees=1 계산 확인."""
    for i in range(100):
        book = await client.post("/api/books", json={"title": f"나무책{i}", "author": "작가"})
        await client.post(
            "/api/reviews",
            json={
                "book_id": book.json()["id"],
                "read_date": "2026-01-10",
                "memo": f"메모{i}",
            },
        )
    resp = await client.get("/api/stats")
    data = resp.json()
    assert data["total_reviews"] == 100
    assert data["trees"] == 1
    assert data["bunches"] == 0
    assert data["grapes"] == 0


async def test_detail_stats_empty(client):
    """리뷰 없을 때 상세 통계가 빈 기본값을 반환해야 한다."""
    resp = await client.get("/api/stats/detail")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["monthly"] == []
    assert data["language_ratio"] == {}
    assert data["top_authors"] == []
    assert data["most_read_books"] == []
    assert data["streak"] == 0


async def test_detail_stats_monthly(client):
    """월별 통계가 올바르게 집계되어야 한다."""
    book = await client.post("/api/books", json={"title": "월별책", "author": "작가A"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-15", "memo": "1월"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-01-20", "memo": "1월2"})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-02-10", "memo": "2월"})

    resp = await client.get("/api/stats/detail")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    # monthly는 12개월 항목
    assert len(data["monthly"]) == 12


async def test_detail_stats_top_authors(client):
    """자주 읽은 작가 Top 5가 올바르게 정렬되어야 한다."""
    for i in range(5):
        b = await client.post("/api/books", json={"title": f"인기작가책{i}", "author": "인기작가"})
        await client.post("/api/reviews", json={"book_id": b.json()["id"], "read_date": "2026-02-01", "memo": ""})
    for i in range(2):
        b = await client.post("/api/books", json={"title": f"보통작가책{i}", "author": "보통작가"})
        await client.post("/api/reviews", json={"book_id": b.json()["id"], "read_date": "2026-02-01", "memo": ""})

    resp = await client.get("/api/stats/detail")
    data = resp.json()
    assert len(data["top_authors"]) == 2
    assert data["top_authors"][0]["author"] == "인기작가"
    assert data["top_authors"][0]["count"] == 5


async def test_detail_stats_most_read_books(client):
    """같은 책을 여러 번 읽으면 most_read_books에 올라야 한다."""
    book = await client.post("/api/books", json={"title": "반복독서", "author": "작가"})
    bid = book.json()["id"]
    for i in range(3):
        await client.post("/api/reviews", json={"book_id": bid, "read_date": f"2026-02-0{i + 1}", "memo": ""})

    resp = await client.get("/api/stats/detail")
    data = resp.json()
    assert data["most_read_books"][0]["title"] == "반복독서"
    assert data["most_read_books"][0]["count"] == 3


async def test_detail_stats_language_ratio(client):
    """언어 비율이 올바르게 계산되어야 한다."""
    b1 = await client.post("/api/books", json={"title": "한국어책", "author": "작가", "language": "ko"})
    b2 = await client.post("/api/books", json={"title": "English Book", "author": "Author", "language": "en"})
    await client.post("/api/reviews", json={"book_id": b1.json()["id"], "read_date": "2026-02-01", "memo": ""})
    await client.post("/api/reviews", json={"book_id": b2.json()["id"], "read_date": "2026-02-02", "memo": ""})

    resp = await client.get("/api/stats/detail")
    data = resp.json()
    assert data["language_ratio"]["ko"] == 1
    assert data["language_ratio"]["en"] == 1


async def test_detail_stats_streak(client):
    """연속 읽기 스트릭이 올바르게 계산되어야 한다."""
    from datetime import date, timedelta

    today = date.today()
    book = await client.post("/api/books", json={"title": "스트릭책", "author": "작가"})
    bid = book.json()["id"]
    # 오늘과 어제 연속 읽기
    await client.post("/api/reviews", json={"book_id": bid, "read_date": today.isoformat(), "memo": ""})
    await client.post("/api/reviews", json={"book_id": bid, "read_date": (today - timedelta(days=1)).isoformat(), "memo": ""})

    resp = await client.get("/api/stats/detail")
    data = resp.json()
    assert data["streak"] >= 2


async def test_detail_stats_language_ratio_null_defaults_ko(client):
    """language가 null인 책은 'ko'로 집계되어야 한다."""
    book = await client.post("/api/books", json={"title": "언어없는책", "author": "작가"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": "2026-02-01", "memo": ""})

    resp = await client.get("/api/stats/detail")
    data = resp.json()
    # language가 None이면 default "ko"로 카운트
    assert "ko" in data["language_ratio"]
