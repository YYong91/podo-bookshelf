from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.review import Review
from app.models.user_goals import UserGoals

router = APIRouter(prefix="/api/goals", tags=["goals"])


class GoalUpdate(BaseModel):
    monthly: int | None = None
    yearly: int | None = None


@router.get("")
async def get_goals(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    result = await db.execute(select(UserGoals).where(UserGoals.user_id == user_id))
    goals_row = result.scalar_one_or_none()

    monthly_goal = goals_row.monthly if goals_row else 0
    yearly_goal = goals_row.yearly if goals_row else 0

    today = date.today()

    # 목표는 개인별, 읽기 수는 가족 전체
    base_query = select(func.count(Review.id)).where(Review.is_deleted == False)

    monthly_count = (await db.execute(
        base_query.where(
            extract("year", Review.read_date) == today.year,
            extract("month", Review.read_date) == today.month,
        )
    )).scalar() or 0

    yearly_count = (await db.execute(
        base_query.where(
            extract("year", Review.read_date) == today.year,
        )
    )).scalar() or 0

    return {
        "monthly_goal": monthly_goal,
        "yearly_goal": yearly_goal,
        "monthly_count": monthly_count,
        "yearly_count": yearly_count,
        "month": today.strftime("%Y-%m"),
        "year": today.year,
    }


@router.put("")
async def update_goals(
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    result = await db.execute(select(UserGoals).where(UserGoals.user_id == user_id))
    goals_row = result.scalar_one_or_none()

    if not goals_row:
        goals_row = UserGoals(id=generate_tsid(), user_id=user_id)
        db.add(goals_row)

    if data.monthly is not None:
        goals_row.monthly = data.monthly
    if data.yearly is not None:
        goals_row.yearly = data.yearly

    await db.commit()
    return {"monthly": goals_row.monthly, "yearly": goals_row.yearly}
