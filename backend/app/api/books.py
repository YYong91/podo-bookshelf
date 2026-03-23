from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.core.utils import escape_like
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookCreate, BookResponse, BookUpdate, PaginatedBooks
from app.schemas.review import ReviewResponse
from app.services.book_service import get_review_count, review_count_subquery

router = APIRouter(prefix="/api/books", tags=["books"])


@router.post("", response_model=BookResponse, status_code=201)
async def create_book(
    data: BookCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    # ISBN 중복 체크: 해당 사용자의 서재에서만 중복 방지
    if data.isbn:
        existing_query = select(Book).where(
            Book.isbn == data.isbn,
            Book.is_deleted.is_(False),
            Book.user_id == user_id,
        )
        existing = (await db.execute(existing_query)).scalar_one_or_none()
        if existing:
            count = await get_review_count(db, book_id=existing.id, user_id=user_id)
            resp = BookResponse(**existing.__dict__, review_count=count)
            return JSONResponse(content=resp.model_dump(mode="json"), status_code=200)

    book = Book(id=generate_tsid(), user_id=user_id, **data.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return BookResponse(**book.__dict__, review_count=0)


@router.get("", response_model=PaginatedBooks)
async def list_books(
    q: str | None = Query(None),
    sort: str = Query("recent"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    rc = review_count_subquery(user_id)
    base = select(Book, rc.label("review_count")).where(Book.is_deleted.is_(False), Book.user_id == user_id)
    if q:
        base = base.where(
            or_(
                Book.title.ilike(f"%{escape_like(q)}%", escape="\\"),
                Book.author.ilike(f"%{escape_like(q)}%", escape="\\"),
            )
        )

    # total count
    count_query = select(Book.id).where(Book.is_deleted.is_(False), Book.user_id == user_id)
    if q:
        count_query = count_query.where(
            or_(
                Book.title.ilike(f"%{escape_like(q)}%", escape="\\"),
                Book.author.ilike(f"%{escape_like(q)}%", escape="\\"),
            )
        )
    count_stmt = select(func.count()).select_from(count_query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # 정렬
    if sort == "title":
        base = base.order_by(Book.title)
    elif sort == "most_read":
        base = base.order_by(rc.desc(), Book.id.desc())
    elif sort == "newest":
        base = base.order_by(Book.id.desc())
    else:  # recent (기본) — 가장 최근 읽은 날짜 순
        latest_read = (
            select(func.max(Review.read_date))
            .where(
                Review.book_id == Book.id,
                Review.user_id == user_id,
                Review.is_deleted.is_(False),
            )
            .correlate(Book)
            .scalar_subquery()
        )
        base = base.add_columns(latest_read.label("latest_read"))
        base = base.order_by(latest_read.desc().nulls_last(), Book.id.desc())

    base = base.limit(limit).offset(offset)
    result = await db.execute(base)
    items = [BookResponse(**row.Book.__dict__, review_count=row.review_count or 0) for row in result.all()]
    return PaginatedBooks(items=items, total=total)


@router.get("/{book_id}/reviews", response_model=list[ReviewResponse])
async def list_book_reviews(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(Review).where(
        Review.book_id == book_id,
        Review.is_deleted.is_(False),
        Review.user_id == user.id,
    )
    stmt = stmt.order_by(Review.read_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(Book).where(
        Book.id == book_id,
        Book.is_deleted.is_(False),
        Book.user_id == user_id,
    )
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    count = await get_review_count(db, book_id=book_id, user_id=user_id)
    return BookResponse(**book.__dict__, review_count=count)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    data: BookUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(Book).where(
        Book.id == book_id,
        Book.is_deleted.is_(False),
        Book.user_id == user_id,
    )
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(book, key, value)
    await db.commit()
    await db.refresh(book)
    count = await get_review_count(db, book_id=book_id, user_id=user_id)
    return BookResponse(**book.__dict__, review_count=count)


@router.patch("/{book_id}/favorite")
async def toggle_favorite(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(Book).where(
        Book.id == book_id,
        Book.is_deleted.is_(False),
        Book.user_id == user_id,
    )
    book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    book.is_favorite = not book.is_favorite
    await db.commit()
    await db.refresh(book)
    count = await get_review_count(db, book_id=book_id, user_id=user_id)
    return BookResponse(**book.__dict__, review_count=count)


@router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(Book).where(
        Book.id == book_id,
        Book.is_deleted.is_(False),
        Book.user_id == user_id,
    )
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    now = datetime.now(UTC)
    book.is_deleted = True
    book.deleted_at = now
    # 연결된 리뷰도 함께 soft delete
    review_stmt = select(Review).where(
        Review.book_id == book_id,
        Review.user_id == user_id,
        Review.is_deleted.is_(False),
    )
    reviews = (await db.execute(review_stmt)).scalars().all()
    for review in reviews:
        review.is_deleted = True
        review.deleted_at = now
    await db.commit()
