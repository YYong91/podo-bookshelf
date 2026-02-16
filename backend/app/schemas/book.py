from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

# TSID(BigInteger)를 JSON에서 문자열로 직렬화 (JS 정밀도 문제 방지)
StrId = Annotated[str, BeforeValidator(lambda v: str(v))]


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=200)
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None
    language: str | None = "ko"


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    publisher: str | None = None
    language: str | None = None


class BookResponse(BookBase):
    id: StrId
    is_favorite: bool = False
    created_at: datetime
    review_count: int = 0

    model_config = {"from_attributes": True}
