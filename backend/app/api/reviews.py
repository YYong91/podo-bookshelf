from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookResponse
from app.schemas.review import ReviewCreate, ReviewCreateWithBook, ReviewDetailResponse, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", status_code=201)
async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    book = (await db.execute(select(Book).where(Book.id == data.book_id, Book.is_deleted == False))).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review = Review(id=generate_tsid(), **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    total = (await db.execute(select(func.count(Review.id)).where(Review.is_deleted == False))).scalar() or 0
    return {**ReviewResponse.model_validate(review).model_dump(), "total_reviews": total}


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
            language=data.language,
        )
        db.add(book)
        await db.flush()

    review = Review(
        id=generate_tsid(),
        book_id=book.id,
        read_date=data.read_date,
        memo=data.memo,
        child_reaction=data.child_reaction,
        activity=data.activity,
        child_age_months=data.child_age_months,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await db.refresh(book)
    total = (await db.execute(select(func.count(Review.id)).where(Review.is_deleted == False))).scalar() or 0
    detail = ReviewDetailResponse(
        **review.__dict__,
        book=BookResponse(**book.__dict__, review_count=0),
    )
    return {**detail.model_dump(), "total_reviews": total}


@router.get("")
async def list_reviews(
    q: str | None = Query(None),
    language: str | None = Query(None),
    favorite: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    base = (
        select(Review, Book)
        .join(Book, Review.book_id == Book.id)
        .where(Review.is_deleted == False)
    )
    if q:
        base = base.where(
            or_(Book.title.ilike(f"%{q}%"), Book.author.ilike(f"%{q}%"))
        )
    if language:
        base = base.where(Book.language == language)
    if favorite is not None:
        base = base.where(Book.is_favorite == favorite)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar() or 0
    stmt = base.order_by(Review.id.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)

    items = [
        ReviewDetailResponse(
            **row.Review.__dict__,
            book=BookResponse(**row.Book.__dict__, review_count=0),
        )
        for row in result.all()
    ]
    return {"items": items, "total": total, "page": page, "size": size}


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
