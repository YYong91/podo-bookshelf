from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.review import Review
from app.schemas.stats import GardenStats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=GardenStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    stmt = select(func.count(Review.id)).where(Review.is_deleted == False)  # noqa: E712
    total = (await db.execute(stmt)).scalar() or 0
    return GardenStats(
        total_reviews=total,
        grapes=total % 10,
        bunches=(total // 10) % 10,
        trees=total // 100,
    )
