from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.review import Review


async def get_book_or_404(db: AsyncSession, book_id: int, user_id: int) -> Book:
    """책 조회 — 없으면 404 반환"""
    stmt = select(Book).where(
        Book.id == book_id,
        Book.user_id == user_id,
        Book.is_deleted.is_(False),
    )
    book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    return book


async def get_review_or_404(db: AsyncSession, review_id: int, user_id: int) -> Review:
    """리뷰 조회 — 없으면 404 반환"""
    stmt = select(Review).where(
        Review.id == review_id,
        Review.user_id == user_id,
        Review.is_deleted.is_(False),
    )
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    return review
