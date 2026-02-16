from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.book import Book
from app.models.review import Review
from app.schemas.stats import GardenStats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=GardenStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    stmt = select(func.count(Review.id)).where(Review.is_deleted == False)  # noqa: E712
    total = (await db.execute(stmt)).scalar() or 0
    return GardenStats(
        total_reviews=total,
        grapes=total % 10,
        bunches=(total // 10) % 10,
        trees=total // 100,
    )


@router.get("/detail")
async def get_detail_stats(db: AsyncSession = Depends(get_db)):
    base = select(Review, Book).join(Book, Review.book_id == Book.id).where(Review.is_deleted == False)
    rows = (await db.execute(base)).all()

    total = len(rows)
    if total == 0:
        return {
            "total": 0, "monthly": [], "language_ratio": {},
            "top_authors": [], "most_read_books": [], "streak": 0,
        }

    # 월별 권수 (최근 12개월)
    today = date.today()
    monthly_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        key = row.Review.read_date.strftime("%Y-%m")
        monthly_counts[key] += 1

    monthly = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        key = f"{y}-{m:02d}"
        monthly.append({"month": key, "count": monthly_counts.get(key, 0)})

    # 언어 비율
    lang_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        lang = row.Book.language or "ko"
        lang_counts[lang] += 1

    # 자주 읽은 작가 Top 5
    author_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        author_counts[row.Book.author] += 1
    top_authors = sorted(author_counts.items(), key=lambda x: -x[1])[:5]

    # 가장 많이 읽은 책 Top 5
    book_counts: dict[str, dict] = {}
    for row in rows:
        bid = str(row.Book.id)
        if bid not in book_counts:
            book_counts[bid] = {"title": row.Book.title, "author": row.Book.author, "count": 0}
        book_counts[bid]["count"] += 1
    most_read = sorted(book_counts.values(), key=lambda x: -x["count"])[:5]

    # 연속 읽기 일수 (현재 스트릭)
    read_dates = sorted({row.Review.read_date for row in rows}, reverse=True)
    streak = 0
    check = today
    for d in read_dates:
        if d == check:
            streak += 1
            check = check.replace(day=check.day) if False else date.fromordinal(check.toordinal() - 1)
        elif d < check:
            break

    return {
        "total": total,
        "monthly": monthly,
        "language_ratio": dict(lang_counts),
        "top_authors": [{"author": a, "count": c} for a, c in top_authors],
        "most_read_books": most_read,
        "streak": streak,
    }
