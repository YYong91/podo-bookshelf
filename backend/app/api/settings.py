from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.user_settings import UserSettings
from app.schemas.settings import SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings_row = result.scalar_one_or_none()
    if not settings_row:
        return {"child_birthdate": None}
    return {"child_birthdate": settings_row.child_birthdate}


@router.put("")
async def update_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings_row = result.scalar_one_or_none()

    if not settings_row:
        settings_row = UserSettings(id=generate_tsid(), user_id=user_id)
        db.add(settings_row)

    settings_row.child_birthdate = data.child_birthdate
    await db.commit()
    return {"child_birthdate": settings_row.child_birthdate}
