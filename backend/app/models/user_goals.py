from sqlalchemy import BigInteger, Column, DateTime, Integer, func

from app.core.database import Base


class UserGoals(Base):
    __tablename__ = "user_goals"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=True, unique=True, index=True)
    monthly = Column(Integer, default=0, server_default="0")
    yearly = Column(Integer, default=0, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
