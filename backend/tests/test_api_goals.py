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
    assert resp.json()["monthly_goal"] == 5
    assert resp.json()["yearly_goal"] == 50
