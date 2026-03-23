from sqlalchemy import JSON, BigInteger, Boolean, Column, Date, DateTime, ForeignKey, String, text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=False)
    read_date = Column(Date, nullable=False)
    memo = Column(String, nullable=True, default="")
    activity = Column(String, nullable=True, default="")
    tags = Column(JSON, nullable=True, default=list)
    child_age_months = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, server_default=text("(datetime('now'))"))
    updated_at = Column(DateTime, server_default=text("(datetime('now'))"))
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, server_default="0")

    # 관계 설정
    book = relationship("Book", back_populates="reviews")
