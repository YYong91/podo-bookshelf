from datetime import datetime

from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=200)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class BookResponse(BookBase):
    id: int
    created_at: datetime
    review_count: int = 0

    model_config = {"from_attributes": True}
