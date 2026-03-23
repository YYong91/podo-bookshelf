from pydantic import BaseModel, Field


class GoalUpdate(BaseModel):
    monthly: int | None = Field(None, ge=0)
    yearly: int | None = Field(None, ge=0)
