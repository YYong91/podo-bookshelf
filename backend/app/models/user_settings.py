from sqlalchemy import BigInteger, Column, DateTime, String, func

from app.core.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, nullable=True, unique=True, index=True)
    child_birthdate = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
