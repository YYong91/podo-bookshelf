from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_db
from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review
from app.schemas.book import BookCreate, BookResponse, BookUpdate, PaginatedBooks
from app.schemas.review import ReviewResponse

router = APIRouter(prefix="/api/books", tags=["books"])


@router.post("", response_model=BookResponse, status_code=201)
async def create_book(
    data: BookCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    user_id = user.id
    # ISBN 중복 체크: 가족 서재 전체에서 중복 방지
    if data.isbn:
        existing_query = select(Book).where(Book.isbn == data.isbn, Book.is_deleted.is_(False))
        existing = (await db.execute(existing_query)).scalar_one_or_none()
        if existing:
            review_count_stmt = select(func.count(Review.id)).where(
                Review.book_id == existing.id, Review.is_deleted.is_(False)
            )
            count = (await db.execute(review_count_stmt)).scalar() or 0
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
    review_count = (
        select(func.count(Review.id))
        .where(Review.book_id == Book.id, Review.is_deleted.is_(False))
        .correlate(Book)
        .scalar_subquery()
    )
    # 가족 서재: 전체 책 목록 반환 (user_id 필터 없음)
    base = select(Book, review_count.label("review_count")).where(Book.is_deleted.is_(False))
    if q:
        base = base.where(or_(Book.title.ilike(f"%{q}%"), Book.author.ilike(f"%{q}%")))

    # total count
    count_query = select(Book.id).where(Book.is_deleted.is_(False))
    if q:
        count_query = count_query.where(or_(Book.title.ilike(f"%{q}%"), Book.author.ilike(f"%{q}%")))
    count_stmt = select(func.count()).select_from(count_query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # 정렬
    if sort == "title":
        base = base.order_by(Book.title)
    elif sort == "most_read":
        base = base.order_by(review_count.desc(), Book.id.desc())
    elif sort == "newest":
        base = base.order_by(Book.id.desc())
    else:  # recent (기본) — 가장 최근 읽은 날짜 순
        latest_read = (
            select(func.max(Review.read_date))
            .where(Review.book_id == Book.id, Review.is_deleted.is_(False))
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
    # 가족 서재: 전체 리뷰 반환 (user_id 필터 없음)
    stmt = select(Review).where(Review.book_id == book_id, Review.is_deleted.is_(False))
    stmt = stmt.order_by(Review.read_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # 가족 서재: user_id 필터 없음
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted.is_(False))
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted.is_(False))
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    data: BookUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # 가족 서재: 가족 누구나 수정 가능 (user_id 필터 없음)
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted.is_(False))
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(book, key, value)
    await db.commit()
    await db.refresh(book)
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted.is_(False))
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.patch("/{book_id}/favorite")
async def toggle_favorite(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # 가족 서재: 가족 누구나 즐겨찾기 가능
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted.is_(False))
    book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    book.is_favorite = not book.is_favorite
    await db.commit()
    await db.refresh(book)
    review_count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id, Review.is_deleted.is_(False))
    count = (await db.execute(review_count_stmt)).scalar() or 0
    return BookResponse(**book.__dict__, review_count=count)


@router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # 가족 서재: 가족 누구나 삭제 가능 (user_id 필터 없음)
    stmt = select(Book).where(Book.id == book_id, Book.is_deleted.is_(False))
    result = await db.execute(stmt)
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    book.is_deleted = True
    book.deleted_at = datetime.now()
    await db.commit()
