import asyncio
import warnings
from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.books import router as books_router
from app.api.export import router as export_router
from app.api.goals import router as goals_router
from app.api.reviews import router as reviews_router
from app.api.search import router as search_router
from app.api.settings import router as settings_router
from app.api.stats import router as stats_router
from app.core.config import settings


def _run_migrations() -> None:
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # JWT_SECRET 검증 — 기본값이면 프로덕션에서 에러
    if settings.JWT_SECRET == "change-me-in-production":  # pragma: allowlist secret
        if not settings.DEBUG:
            raise RuntimeError("프로덕션 환경에서 JWT_SECRET을 반드시 설정해야 합니다")
        else:
            warnings.warn("JWT_SECRET이 기본값입니다. 프로덕션에서는 podo-auth와 동일한 JWT_SECRET을 설정하세요.", stacklevel=2)

    await asyncio.to_thread(_run_migrations)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(books_router)
app.include_router(export_router)
app.include_router(goals_router)
app.include_router(reviews_router)
app.include_router(search_router)
app.include_router(settings_router)
app.include_router(stats_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
