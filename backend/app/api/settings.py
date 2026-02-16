import json
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_FILE = Path("/data/settings.json")


class SettingsUpdate(BaseModel):
    child_birthdate: str = ""


def _load() -> dict:
    if SETTINGS_FILE.exists():
        return json.loads(SETTINGS_FILE.read_text())
    return {}


def _save(data: dict):
    SETTINGS_FILE.write_text(json.dumps(data))


@router.get("")
async def get_settings():
    return _load()


@router.put("")
async def update_settings(data: SettingsUpdate):
    settings = _load()
    if data.child_birthdate:
        settings["child_birthdate"] = data.child_birthdate
    else:
        settings.pop("child_birthdate", None)
    _save(settings)
    return settings
