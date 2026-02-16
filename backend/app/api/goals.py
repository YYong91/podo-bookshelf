import json
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.review import Review

router = APIRouter(prefix="/api/goals", tags=["goals"])

GOALS_FILE = Path("/data/goals.json")


class GoalUpdate(BaseModel):
    monthly: int | None = None
    yearly: int | None = None


def _load_goals() -> dict:
    if GOALS_FILE.exists():
        return json.loads(GOALS_FILE.read_text())
    return {"monthly": 0, "yearly": 0}


def _save_goals(goals: dict):
    GOALS_FILE.write_text(json.dumps(goals))


@router.get("")
async def get_goals(db: AsyncSession = Depends(get_db)):
    goals = _load_goals()
    today = date.today()

    monthly_count = (await db.execute(
        select(func.count(Review.id)).where(
            Review.is_deleted == False,
            extract("year", Review.read_date) == today.year,
            extract("month", Review.read_date) == today.month,
        )
    )).scalar() or 0

    yearly_count = (await db.execute(
        select(func.count(Review.id)).where(
            Review.is_deleted == False,
            extract("year", Review.read_date) == today.year,
        )
    )).scalar() or 0

    return {
        "monthly_goal": goals.get("monthly", 0),
        "yearly_goal": goals.get("yearly", 0),
        "monthly_count": monthly_count,
        "yearly_count": yearly_count,
        "month": today.strftime("%Y-%m"),
        "year": today.year,
    }


@router.put("")
async def update_goals(data: GoalUpdate):
    goals = _load_goals()
    if data.monthly is not None:
        goals["monthly"] = data.monthly
    if data.yearly is not None:
        goals["yearly"] = data.yearly
    _save_goals(goals)
    return goals
