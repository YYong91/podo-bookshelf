from datetime import date

from app.core.tsid import generate_tsid
from app.models.book import Book
from app.models.review import Review


async def test_create_book(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)
    assert book.title == "구름빵"
    assert book.is_deleted is False


async def test_create_review(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()

    review = Review(
        id=generate_tsid(),
        book_id=book.id,
        read_date=date(2026, 2, 15),
        memo="구름으로 만든 빵이 신기했어요",
    )
    db_session.add(review)
    await db_session.commit()
    await db_session.refresh(review)
    assert review.book_id == book.id
    assert review.is_deleted is False


async def test_soft_delete_book(db_session):
    book = Book(id=generate_tsid(), title="구름빵", author="백희나")
    db_session.add(book)
    await db_session.commit()
    book.is_deleted = True
    await db_session.commit()
    await db_session.refresh(book)
    assert book.is_deleted is True
