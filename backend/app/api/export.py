from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.models.book import Book
from app.models.review import Review

router = APIRouter(prefix="/api/export", tags=["export"])


def _serialize(val):
    if isinstance(val, date | datetime):
        return val.isoformat()
    return val


@router.get("")
async def export_all(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    books_result = await db.execute(select(Book).where(Book.is_deleted.is_(False), Book.user_id == user.id))
    books = []
    for b in books_result.scalars().all():
        books.append(
            {
                "id": str(b.id),
                "title": b.title,
                "author": b.author,
                "cover_url": b.cover_url,
                "isbn": b.isbn,
                "publisher": b.publisher,
                "language": b.language,
                "created_at": _serialize(b.created_at),
            }
        )

    reviews_result = await db.execute(select(Review).where(Review.is_deleted.is_(False), Review.user_id == user.id))
    reviews = []
    for r in reviews_result.scalars().all():
        reviews.append(
            {
                "id": str(r.id),
                "book_id": str(r.book_id),
                "read_date": _serialize(r.read_date),
                "memo": r.memo,
                "activity": r.activity,
                "tags": r.tags or [],
                "child_age_months": r.child_age_months,
                "created_at": _serialize(r.created_at),
                "updated_at": _serialize(r.updated_at),
            }
        )

    return JSONResponse(
        content={
            "exported_at": datetime.now(UTC).isoformat(),
            "books": books,
            "reviews": reviews,
            "counts": {"books": len(books), "reviews": len(reviews)},
        },
        headers={"Content-Disposition": f"attachment; filename=podo-backup-{date.today().isoformat()}.json"},
    )
