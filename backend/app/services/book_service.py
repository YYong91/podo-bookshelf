"""책 관련 공통 서비스 로직."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.review import Review


def review_count_subquery(user_id: int) -> select:
    """특정 사용자의 리뷰 수를 반환하는 상관 서브쿼리 생성."""
    return (
        select(func.count(Review.id))
        .where(
            Review.book_id == Book.id,
            Review.user_id == user_id,
            Review.is_deleted.is_(False),
        )
        .correlate(Book)
        .scalar_subquery()
    )


async def get_review_count(db: AsyncSession, *, book_id: int, user_id: int) -> int:
    """특정 책의 리뷰 수를 조회."""
    stmt = select(func.count(Review.id)).where(
        Review.book_id == book_id,
        Review.user_id == user_id,
        Review.is_deleted.is_(False),
    )
    return (await db.execute(stmt)).scalar() or 0
