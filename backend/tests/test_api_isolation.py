"""사용자별 데이터 격리 테스트 — 다른 사용자의 데이터는 보이지 않아야 함."""

from tests.conftest import TEST_USER, TEST_USER2


async def test_books_isolated_between_users(switchable_client):
    client, state = switchable_client

    # 유저1이 책 추가
    state["user"] = TEST_USER
    await client.post("/api/books", json={"title": "유저1의 책", "author": "작가"})

    # 유저2는 유저1의 책을 볼 수 없음
    state["user"] = TEST_USER2
    resp = await client.get("/api/books")
    assert resp.json()["total"] == 0
    assert resp.json()["items"] == []


async def test_reviews_isolated_between_users(switchable_client):
    client, state = switchable_client

    # 유저1이 책과 리뷰 추가
    state["user"] = TEST_USER
    book = await client.post("/api/books", json={"title": "유저1의 책", "author": "작가"})
    book_id = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-01-01", "memo": "좋아요"})

    # 유저2는 유저1의 리뷰를 볼 수 없음
    state["user"] = TEST_USER2
    resp = await client.get("/api/reviews")
    assert resp.json()["total"] == 0


async def test_stats_isolated_between_users(switchable_client):
    client, state = switchable_client

    # 유저1이 10개의 리뷰 추가
    state["user"] = TEST_USER
    for i in range(10):
        book = await client.post("/api/books", json={"title": f"책{i}", "author": "작가"})
        await client.post("/api/reviews", json={"book_id": book.json()["id"], "read_date": "2026-01-01"})

    # 유저2의 통계는 0
    state["user"] = TEST_USER2
    resp = await client.get("/api/stats")
    assert resp.json()["total_reviews"] == 0
    assert resp.json()["grapes"] == 0


async def test_export_isolated_between_users(switchable_client):
    client, state = switchable_client

    # 유저1이 데이터 추가
    state["user"] = TEST_USER
    book = await client.post("/api/books", json={"title": "유저1의 책", "author": "작가"})
    await client.post("/api/reviews", json={"book_id": book.json()["id"], "read_date": "2026-01-01"})

    # 유저2 내보내기에는 유저1 데이터 없음
    state["user"] = TEST_USER2
    resp = await client.get("/api/export")
    assert resp.json()["counts"]["books"] == 0
    assert resp.json()["counts"]["reviews"] == 0


async def test_book_ownership_enforced(switchable_client):
    """유저1의 책을 유저2가 수정/삭제 불가."""
    client, state = switchable_client

    # 유저1이 책 추가
    state["user"] = TEST_USER
    book = await client.post("/api/books", json={"title": "유저1의 책", "author": "작가"})
    book_id = book.json()["id"]

    # 유저2가 수정 시도 → 404
    state["user"] = TEST_USER2
    resp = await client.put(f"/api/books/{book_id}", json={"title": "탈취 시도"})
    assert resp.status_code == 404

    # 유저2가 삭제 시도 → 404
    resp = await client.delete(f"/api/books/{book_id}")
    assert resp.status_code == 404


async def test_review_ownership_enforced(switchable_client):
    """유저1의 리뷰를 유저2가 수정/삭제 불가."""
    client, state = switchable_client

    # 유저1이 책과 리뷰 추가
    state["user"] = TEST_USER
    book = await client.post("/api/books", json={"title": "유저1의 책", "author": "작가"})
    book_id = book.json()["id"]
    review = await client.post("/api/reviews", json={"book_id": book_id, "read_date": "2026-01-01"})
    review_id = review.json()["id"]

    # 유저2가 수정 시도 → 404
    state["user"] = TEST_USER2
    resp = await client.put(f"/api/reviews/{review_id}", json={"memo": "탈취 시도"})
    assert resp.status_code == 404

    # 유저2가 삭제 시도 → 404
    resp = await client.delete(f"/api/reviews/{review_id}")
    assert resp.status_code == 404


async def test_isbn_dedup_is_per_user(switchable_client):
    """같은 ISBN 책을 두 사용자가 각각 별도로 등록 가능."""
    client, state = switchable_client
    isbn = "9788901234567"

    state["user"] = TEST_USER
    resp1 = await client.post("/api/books", json={"title": "같은 책", "author": "작가", "isbn": isbn})
    assert resp1.status_code == 201

    state["user"] = TEST_USER2
    resp2 = await client.post("/api/books", json={"title": "같은 책", "author": "작가", "isbn": isbn})
    assert resp2.status_code == 201  # 유저2는 별도로 등록됨 (유저1 것과 중복 아님)

    # 유저1은 여전히 자기 것만 1권 보임
    state["user"] = TEST_USER
    list_resp = await client.get("/api/books")
    assert list_resp.json()["total"] == 1

    # 유저2도 자기 것만 1권 보임
    state["user"] = TEST_USER2
    list_resp = await client.get("/api/books")
    assert list_resp.json()["total"] == 1
