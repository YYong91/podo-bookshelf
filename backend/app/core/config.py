from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "포도책방"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite+aiosqlite:///./podo.db"
    GOOGLE_BOOKS_API_KEY: str = ""
    CORS_ORIGINS: str = "*"


settings = Settings()
