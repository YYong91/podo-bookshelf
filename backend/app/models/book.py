from sqlalchemy import BigInteger, Boolean, Column, DateTime, String, func

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=True, index=True)  # nullable for migration
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    cover_url = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    language = Column(String, nullable=True, default="ko")
    is_favorite = Column(Boolean, default=False, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, server_default="0")
