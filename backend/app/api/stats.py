from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.schemas.stats import GardenStats
from app.services.stats_service import get_detail_stats, get_garden_stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=GardenStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return await get_garden_stats(db, user_id=user.id)


@router.get("/detail")
async def get_detail_stats_endpoint(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return await get_detail_stats(db, user_id=user.id)
