from datetime import date, datetime, timedelta

from pydantic import BaseModel, Field, field_validator

from app.schemas.book import BookResponse, StrId

# KST(UTC+9) 타임존 버퍼: 서버가 UTC로 동작해도 KST 기준 "오늘"을 허용
_TIMEZONE_BUFFER = timedelta(days=1)


class ReviewBase(BaseModel):
    read_date: date
    memo: str = ""
    activity: str = ""
    tags: list[str] = []
    child_age_months: int | None = None

    @field_validator("read_date")
    @classmethod
    def read_date_not_future(cls, v: date) -> date:
        if v > date.today() + _TIMEZONE_BUFFER:
            raise ValueError("읽은 날짜는 미래일 수 없습니다")
        return v


class ReviewCreate(ReviewBase):
    book_id: StrId


class ReviewCreateWithBook(ReviewBase):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None
    language: str | None = "ko"


class ReviewUpdate(BaseModel):
    read_date: date | None = None
    memo: str | None = None
    activity: str | None = None
    tags: list[str] | None = None
    child_age_months: int | None = None

    @field_validator("read_date")
    @classmethod
    def read_date_not_future(cls, v: date | None) -> date | None:
        if v and v > date.today() + _TIMEZONE_BUFFER:
            raise ValueError("읽은 날짜는 미래일 수 없습니다")
        return v


class ReviewResponse(ReviewBase):
    id: StrId
    book_id: StrId
    user_id: StrId | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReviewDetailResponse(ReviewResponse):
    book: BookResponse


class PaginatedReviews(BaseModel):
    items: list[ReviewDetailResponse]
    total: int
    page: int
    size: int
