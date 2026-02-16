from datetime import date, datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.book import Book
from app.models.review import Review

router = APIRouter(prefix="/api/export", tags=["export"])


def _serialize(val):
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    return val


@router.get("")
async def export_all(db: AsyncSession = Depends(get_db)):
    books_result = await db.execute(select(Book).where(Book.is_deleted == False))
    books = []
    for b in books_result.scalars().all():
        books.append({
            "id": str(b.id),
            "title": b.title,
            "author": b.author,
            "cover_url": b.cover_url,
            "isbn": b.isbn,
            "publisher": b.publisher,
            "language": b.language,
            "created_at": _serialize(b.created_at),
        })

    reviews_result = await db.execute(select(Review).where(Review.is_deleted == False))
    reviews = []
    for r in reviews_result.scalars().all():
        reviews.append({
            "id": str(r.id),
            "book_id": str(r.book_id),
            "read_date": _serialize(r.read_date),
            "memo": r.memo,
            "child_reaction": r.child_reaction,
            "activity": r.activity,
            "created_at": _serialize(r.created_at),
            "updated_at": _serialize(r.updated_at),
        })

    return JSONResponse(
        content={
            "exported_at": datetime.now().isoformat(),
            "books": books,
            "reviews": reviews,
            "counts": {"books": len(books), "reviews": len(reviews)},
        },
        headers={
            "Content-Disposition": f"attachment; filename=podo-backup-{date.today().isoformat()}.json"
        },
    )
