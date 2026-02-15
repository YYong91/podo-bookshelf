from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.book import BookResponse


class ReviewBase(BaseModel):
    read_date: date
    memo: str = ""
    child_reaction: str = ""


class ReviewCreate(ReviewBase):
    book_id: int


class ReviewCreateWithBook(ReviewBase):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None


class ReviewUpdate(BaseModel):
    read_date: date | None = None
    memo: str | None = None
    child_reaction: str | None = None


class ReviewResponse(ReviewBase):
    id: int
    book_id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReviewDetailResponse(ReviewResponse):
    book: BookResponse
