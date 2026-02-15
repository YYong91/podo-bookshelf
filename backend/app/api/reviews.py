from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookResponse
from app.schemas.review import ReviewCreate, ReviewCreateWithBook, ReviewDetailResponse, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=201)
async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    book = (await db.execute(select(Book).where(Book.id == data.book_id, Book.is_deleted == False))).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review = Review(id=generate_tsid(), **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.post("/with-book", response_model=ReviewDetailResponse, status_code=201)
async def create_review_with_book(data: ReviewCreateWithBook, db: AsyncSession = Depends(get_db)):
    book = None
    if data.isbn:
        stmt = select(Book).where(Book.isbn == data.isbn, Book.is_deleted == False)
        book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        book = Book(
            id=generate_tsid(),
            title=data.title,
            author=data.author,
            cover_url=data.cover_url,
            isbn=data.isbn,
            publisher=data.publisher,
        )
        db.add(book)
        await db.flush()

    review = Review(
        id=generate_tsid(),
        book_id=book.id,
        read_date=data.read_date,
        memo=data.memo,
        child_reaction=data.child_reaction,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await db.refresh(book)
    return ReviewDetailResponse(
        **review.__dict__,
        book=BookResponse(**book.__dict__, review_count=0),
    )


@router.get("", response_model=list[ReviewDetailResponse])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Review, Book)
        .join(Book, Review.book_id == Book.id)
        .where(Review.is_deleted == False)
        .order_by(Review.id.desc())
    )
    result = await db.execute(stmt)
    return [
        ReviewDetailResponse(
            **row.Review.__dict__,
            book=BookResponse(**row.Book.__dict__, review_count=0),
        )
        for row in result.all()
    ]


@router.get("/{review_id}", response_model=ReviewDetailResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review, Book).join(Book, Review.book_id == Book.id).where(Review.id == review_id, Review.is_deleted == False)
    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    return ReviewDetailResponse(
        **result.Review.__dict__,
        book=BookResponse(**result.Book.__dict__, review_count=0),
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(review_id: int, data: ReviewUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted == False)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    review.updated_at = datetime.now()
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=204)
async def delete_review(review_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted == False)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    review.is_deleted = True
    review.deleted_at = datetime.now()
    await db.commit()
