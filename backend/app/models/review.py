from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, String, func

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=False)
    read_date = Column(Date, nullable=False)
    memo = Column(String, nullable=True, default="")
    child_reaction = Column(String, nullable=True, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, server_default="0")
