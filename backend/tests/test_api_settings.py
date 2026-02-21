async def test_get_settings_default(client):
    resp = await client.get("/api/settings")
    assert resp.status_code == 200
    assert resp.json()["child_birthdate"] is None


async def test_update_settings(client):
    resp = await client.put("/api/settings", json={"child_birthdate": "2022-05-15"})
    assert resp.status_code == 200
    assert resp.json()["child_birthdate"] == "2022-05-15"


async def test_get_settings_after_update(client):
    await client.put("/api/settings", json={"child_birthdate": "2022-05-15"})
    resp = await client.get("/api/settings")
    assert resp.status_code == 200
    assert resp.json()["child_birthdate"] == "2022-05-15"
