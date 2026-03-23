# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

포도책장(Podo Bookshelf)은 아이 독서 기록 앱으로, 책을 등록하고 독서 리뷰를 기록하며 독서 통계를 포도 정원 메타포로 시각화합니다. 바코드 스캔으로 책을 빠르게 추가하고, 독서 목표를 설정하여 진행 상황을 추적합니다. 포도가계부(podo-budget)와 동일한 Grape 디자인 시스템을 공유합니다. Korean is the primary user-facing language.

## Commands

### Docker (full stack)
```bash
docker compose up -d              # Start backend + frontend
docker compose down               # Stop all services
```

### Backend local development
```bash
cd backend
uv sync --all-extras              # Install all dependencies
uv run uvicorn app.main:app --reload --port 8001  # Dev server at http://localhost:8001
```

### Frontend local development
```bash
cd frontend
npm ci                            # Install dependencies
npm run dev                       # Dev server at http://localhost:3100
npm run build                     # Production build (tsc + vite)
npm run lint                      # ESLint check
```

### Testing
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm run test:run
```

### Database migrations (Alembic)
```bash
cd backend
uv run alembic upgrade head                          # Apply migrations
uv run alembic revision --autogenerate -m "설명"     # Generate migration
```

## Architecture

### Backend (FastAPI, async-first)
```
backend/app/
├── api/          # Route handlers (books, reviews, search, stats, goals, settings, export)
├── core/         # Config, auth (JWT), database (async SQLite), TSID generation
├── models/       # SQLAlchemy 2.0 ORM (Book, Review, UserGoals, UserSettings)
├── schemas/      # Pydantic request/response schemas
└── main.py       # FastAPI app entry, CORS, router registration
```

### Frontend (React 19 + TypeScript + Vite)
```
frontend/src/
├── api/           # Axios API client (client.ts + endpoint functions)
├── components/    # Reusable components (Layout, BottomNav, BarcodeScanner, Garden/*)
├── pages/         # Page components (Home, Bookshelf, Search, WriteReview, ReviewDetail, BookDetail, ReviewList, Stats, AuthCallback)
├── context/       # AuthContext (podo-auth SSO token management)
├── types/         # TypeScript type definitions
├── __tests__/     # Test setup
├── App.tsx        # React Router routes (lazy loading)
├── main.tsx       # Entry point
└── index.css      # Tailwind v4 + Grape design system
```

### Key patterns
- **podo-auth SSO**: JWT via cookie/localStorage, AuthContext manages token lifecycle
- **TSID IDs**: BigInteger in DB, string in API (JS precision safety)
- **Soft delete**: `is_deleted` + `deleted_at` on Book and Review
- **User isolation**: All queries filter by `user_id`, tested in `test_api_isolation.py`
- **Google Books API**: ISBN/keyword search via httpx async client
- **Garden metaphor**: 리뷰 수 → 포도알 → 포도송이 → 나무 → 정원 시각화

### Database
- SQLite (async via aiosqlite)
- 4 models: Book, Review, UserGoals, UserSettings
- Alembic: 6 migrations
- Production: Fly.io persistent volume (`/app/data/podo.db`)

### API Endpoints (26 endpoints)
- `/api/books` — 책 CRUD + 즐겨찾기 토글
- `/api/reviews` — 리뷰 CRUD + with-book (책+리뷰 동시 생성)
- `/api/search` — Google Books 검색 + ISBN 조회
- `/api/stats` — 독서 통계 (정원, 월별, 작가별, 스트릭)
- `/api/goals` — 월간/연간 독서 목표
- `/api/settings` — 아이 생년월일 설정
- `/api/export` — JSON 데이터 내보내기
- `/health` — 헬스 체크

### Infrastructure
- Backend: Fly.io (Tokyo, shared-cpu-1x, 512MB, SQLite on volume)
- Frontend: Cloudflare Pages
- Auth: podo-auth SSO (auth.podonest.com)
- CI/CD: GitHub Actions (`deploy-production.yml`)

## Environment Variables

Backend (`backend/.env`):
- `DATABASE_URL` — async SQLite URL (`sqlite+aiosqlite:///./podo.db`)
- `JWT_SECRET` — JWT 검증 시크릿 (podo-auth와 공유)
- `AUTH_SERVER_URL` — podo-auth 서버 URL
- `GOOGLE_BOOKS_API_KEY` — Google Books API 키 (선택)
- `CORS_ORIGINS` — 허용 origin (쉼표 구분)
- `DEBUG` — 디버그 모드 (default: true)

Frontend:
- `VITE_API_URL` — API base URL (dev: `/api`, prod: `https://podo-bookshelf-backend.fly.dev/api`)
- `VITE_AUTH_URL` — podo-auth URL (default: `https://auth.podonest.com`)
- `VITE_AUTH_CALLBACK_URL` — 인증 콜백 URL
- `VITE_BUDGET_URL` — 포도가계부 URL

## Known Issues

현재 GitHub 이슈로 관리 중 (https://github.com/YYong91/podo-bookshelf/issues):
- #3: 리뷰 작성 시 타임존 불일치
- #8: 백엔드 보안 취약점 (LIKE injection, 미인증 API)
- #9: 프론트엔드 인증 버그
- #16: 프로덕션 API URL 수정 (해결됨)
- #17: 배포 설정 수정 (해결됨)
