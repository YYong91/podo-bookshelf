from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.books import router as books_router
from app.api.export import router as export_router
from app.api.reviews import router as reviews_router
from app.api.search import router as search_router
from app.api.stats import router as stats_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(books_router)
app.include_router(export_router)
app.include_router(reviews_router)
app.include_router(search_router)
app.include_router(stats_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
