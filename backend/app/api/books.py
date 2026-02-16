from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookCreate, BookResponse, BookUpdate
from app.schemas.review import ReviewResponse

router = APIRouter(prefix="/api/books", tags=["books"])


@router.post("", response_model=BookResponse, status_code=201)
async def create_book(data: BookCreate, db: AsyncSession = Depends(get_db)):
    book = Book(id=generate_tsid(), **data.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return BookResponse(**book.__dict__, review_count=0)


@router.get("", response_model=list[BookResponse])
async def list_books(db: AsyncSession = Depends(get_db)):
    review_count = (
        select(func.count(Review.id))
        .where(Review.book_id == Book.id, Review.is_deleted == False)
        .correlate(Book)
        .scalar_subquery()
    )
    stmt = select(Book, review_count.label("review_count")).where(Book.is_deleted == False).order_by(Book.id.desc())
    result = await db.execute(stmt)
    return [BookResponse(**row.Book.__dict__, review_count=row.review_count or 0) for row in result.all()]


@router.get("/{book_id}/reviews", response_model=list[ReviewResponse])
async def list_book_reviews(book_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Review)
        .where(Review.book_id == book_id, Review.is_deleted == False)
        .order_by(Review.read_date.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted == False)
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: int, data: BookUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(book, key, value)
    await db.commit()
    await db.refresh(book)
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted == False)
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted == False)
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    book.is_deleted = True
    book.deleted_at = datetime.now()
    await db.commit()
