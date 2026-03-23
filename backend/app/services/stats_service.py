"""통계 계산 서비스."""

from datetime import date, timedelta

from sqlalchemy import String, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.review import Review
from app.schemas.stats import GardenStats


async def get_garden_stats(db: AsyncSession, *, user_id: int) -> GardenStats:
    """포도밭 통계 (포도알, 포도송이, 나무) 계산."""
    stmt = select(func.count(Review.id)).where(
        Review.is_deleted.is_(False),
        Review.user_id == user_id,
    )
    total = (await db.execute(stmt)).scalar() or 0
    return GardenStats(
        total_reviews=total,
        grapes=total % 10,
        bunches=(total // 10) % 10,
        trees=total // 100,
    )


async def get_detail_stats(db: AsyncSession, *, user_id: int) -> dict:
    """상세 통계 (월별, 인기 작가, 다독 도서, 언어 비율, 연속 읽기) 계산 — SQL 집계 사용."""
    base_filter = [Review.is_deleted.is_(False), Review.user_id == user_id]

    # 전체 독서 기록 수
    total = (await db.execute(select(func.count(Review.id)).where(*base_filter))).scalar() or 0

    if total == 0:
        return {
            "total": 0,
            "monthly": [],
            "language_ratio": {},
            "top_authors": [],
            "most_read_books": [],
            "streak": 0,
        }

    # 월별 권수 — SQL GROUP BY
    monthly_stmt = (
        select(
            func.strftime("%Y-%m", Review.read_date).label("month"),
            func.count(Review.id).label("cnt"),
        )
        .where(*base_filter)
        .group_by("month")
    )
    monthly_rows = (await db.execute(monthly_stmt)).all()
    monthly_map = {row.month: row.cnt for row in monthly_rows}

    today = date.today()
    monthly = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        key = f"{y}-{m:02d}"
        monthly.append({"month": key, "count": monthly_map.get(key, 0)})

    # 언어 비율 — SQL GROUP BY
    lang_stmt = (
        select(
            case((Book.language.is_(None), "ko"), else_=Book.language).label("lang"),
            func.count(Review.id).label("cnt"),
        )
        .join(Book, Review.book_id == Book.id)
        .where(*base_filter)
        .group_by("lang")
    )
    lang_rows = (await db.execute(lang_stmt)).all()
    language_ratio = {row.lang: row.cnt for row in lang_rows}

    # 자주 읽은 작가 Top 5 — SQL GROUP BY
    author_stmt = (
        select(Book.author, func.count(Review.id).label("cnt"))
        .join(Book, Review.book_id == Book.id)
        .where(*base_filter)
        .group_by(Book.author)
        .order_by(func.count(Review.id).desc())
        .limit(5)
    )
    author_rows = (await db.execute(author_stmt)).all()
    top_authors = [{"author": row.author, "count": row.cnt} for row in author_rows]

    # 가장 많이 읽은 책 Top 5 — SQL GROUP BY
    book_stmt = (
        select(
            Book.id,
            Book.title,
            Book.author,
            func.count(Review.id).label("cnt"),
        )
        .join(Book, Review.book_id == Book.id)
        .where(*base_filter)
        .group_by(Book.id, Book.title, Book.author)
        .order_by(func.count(Review.id).desc())
        .limit(5)
    )
    book_rows = (await db.execute(book_stmt)).all()
    most_read = [{"id": str(row.id), "title": row.title, "author": row.author, "count": row.cnt} for row in book_rows]

    # 연속 읽기 일수 — 최근 날짜만 조회 (문자열로 비교하여 DB 호환성 확보)
    cutoff = (today - timedelta(days=365)).isoformat()
    streak_stmt = (
        select(func.distinct(cast(Review.read_date, String)).label("d"))
        .where(*base_filter, cast(Review.read_date, String) >= cutoff)
        .order_by(cast(Review.read_date, String).desc())
    )
    date_rows = (await db.execute(streak_stmt)).scalars().all()
    streak = 0
    if date_rows:
        # 가장 최근 독서일부터 연속 카운트 (오늘 안 읽어도 어제까지의 연속 인정)
        first = date.fromisoformat(str(date_rows[0])) if not isinstance(date_rows[0], date) else date_rows[0]
        check = first
        for d in date_rows:
            d_date = date.fromisoformat(str(d)) if not isinstance(d, date) else d
            if d_date == check:
                streak += 1
                check = check - timedelta(days=1)
            elif d_date < check:
                break

    return {
        "total": total,
        "monthly": monthly,
        "language_ratio": language_ratio,
        "top_authors": top_authors,
        "most_read_books": most_read,
        "streak": streak,
    }
