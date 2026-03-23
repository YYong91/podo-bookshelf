from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.core.utils import escape_like
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookResponse
from app.schemas.review import ReviewCreate, ReviewCreateWithBook, ReviewDetailResponse, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", status_code=201)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    book_query = select(Book).where(Book.id == data.book_id, Book.is_deleted.is_(False), Book.user_id == user_id)
    book = (await db.execute(book_query)).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review = Review(id=generate_tsid(), user_id=user_id, **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    total_query = select(func.count(Review.id)).where(Review.is_deleted.is_(False), Review.user_id == user_id)
    total = (await db.execute(total_query)).scalar() or 0
    return {**ReviewResponse.model_validate(review).model_dump(), "total_reviews": total}


@router.post("/with-book", status_code=201)
async def create_review_with_book(
    data: ReviewCreateWithBook,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    book = None
    if data.isbn:
        stmt = select(Book).where(Book.isbn == data.isbn, Book.is_deleted.is_(False), Book.user_id == user_id)
        book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        book = Book(
            id=generate_tsid(),
            user_id=user_id,
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
        user_id=user_id,
        book_id=book.id,
        read_date=data.read_date,
        memo=data.memo,
        activity=data.activity,
        tags=data.tags,
        child_age_months=data.child_age_months,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await db.refresh(book)
    total_query = select(func.count(Review.id)).where(Review.is_deleted.is_(False), Review.user_id == user_id)
    total = (await db.execute(total_query)).scalar() or 0
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
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    tag: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    base = select(Review, Book).join(Book, Review.book_id == Book.id).where(Review.is_deleted.is_(False), Review.user_id == user.id)
    if q:
        base = base.where(or_(Book.title.ilike(f"%{escape_like(q)}%", escape="\\"), Book.author.ilike(f"%{escape_like(q)}%", escape="\\")))
    if language:
        base = base.where(Book.language == language)
    if favorite is not None:
        base = base.where(Book.is_favorite == favorite)
    if date_from:
        base = base.where(Review.read_date >= date_from)
    if date_to:
        base = base.where(Review.read_date <= date_to)
    if tag:
        base = base.where(cast(Review.tags, String).ilike(f'%"{escape_like(tag)}"%', escape="\\"))

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar() or 0
    stmt = base.order_by(Review.read_date.desc(), Review.id.desc()).offset((page - 1) * size).limit(size)
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
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(Review, Book).join(Book, Review.book_id == Book.id).where(Review.id == review_id, Review.is_deleted.is_(False), Review.user_id == user.id)
    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    return ReviewDetailResponse(
        **result.Review.__dict__,
        book=BookResponse(**result.Book.__dict__, review_count=0),
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted.is_(False), Review.user_id == user.id)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    review.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=204)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(Review).where(Review.id == review_id, Review.is_deleted.is_(False), Review.user_id == user.id)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    review.is_deleted = True
    review.deleted_at = datetime.now(UTC)
    await db.commit()
