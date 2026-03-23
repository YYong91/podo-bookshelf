async def test_get_goals_default(client):
    resp = await client.get("/api/goals")
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly_goal"] == 0
    assert data["yearly_goal"] == 0
    assert data["monthly_count"] == 0
    assert data["yearly_count"] == 0
    assert "month" in data
    assert "year" in data


async def test_update_goals(client):
    resp = await client.put("/api/goals", json={"monthly": 10, "yearly": 100})
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly"] == 10
    assert data["yearly"] == 100


async def test_get_goals_after_update(client):
    await client.put("/api/goals", json={"monthly": 5, "yearly": 50})
    resp = await client.get("/api/goals")
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly_goal"] == 5
    assert data["yearly_goal"] == 50


async def test_update_goals_negative_rejected(client):
    """음수 목표는 거부되어야 한다."""
    resp = await client.put("/api/goals", json={"monthly": -1})
    assert resp.status_code == 422


async def test_update_goals_zero_allowed(client):
    """0 목표는 허용되어야 한다."""
    resp = await client.put("/api/goals", json={"monthly": 0, "yearly": 0})
    assert resp.status_code == 200


async def test_update_goals_partial_monthly_only(client):
    """monthly만 업데이트하면 yearly는 기존 값을 유지해야 한다."""
    await client.put("/api/goals", json={"monthly": 5, "yearly": 50})
    resp = await client.put("/api/goals", json={"monthly": 10})
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly"] == 10
    assert data["yearly"] == 50


async def test_update_goals_partial_yearly_only(client):
    """yearly만 업데이트하면 monthly는 기존 값을 유지해야 한다."""
    await client.put("/api/goals", json={"monthly": 5, "yearly": 50})
    resp = await client.put("/api/goals", json={"yearly": 100})
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly"] == 5
    assert data["yearly"] == 100


async def test_goals_count_with_reviews(client):
    """리뷰가 있으면 monthly_count, yearly_count에 반영되어야 한다."""
    from datetime import date

    today = date.today()
    book = await client.post("/api/books", json={"title": "목표책", "author": "작가"})
    bid = book.json()["id"]
    await client.post("/api/reviews", json={"book_id": bid, "read_date": today.isoformat(), "memo": ""})

    resp = await client.get("/api/goals")
    data = resp.json()
    assert data["monthly_count"] >= 1
    assert data["yearly_count"] >= 1


async def test_update_goals_empty_body(client):
    """빈 body로 업데이트해도 에러 없이 기존 값을 반환해야 한다."""
    await client.put("/api/goals", json={"monthly": 5, "yearly": 50})
    resp = await client.put("/api/goals", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data["monthly"] == 5
    assert data["yearly"] == 50


async def test_update_goals_creates_on_first_call(client):
    """최초 업데이트 시 goals 레코드가 생성되어야 한다."""
    resp = await client.put("/api/goals", json={"monthly": 3})
    assert resp.status_code == 200
    assert resp.json()["monthly"] == 3

    get_resp = await client.get("/api/goals")
    assert get_resp.json()["monthly_goal"] == 3
