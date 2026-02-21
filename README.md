# podo-bookshelf (포도책방)

개인 독서 기록과 서재를 관리하는 웹 앱입니다.
[bookshelf.podonest.com](https://bookshelf.podonest.com)에서 운영됩니다.

## 주요 기능

- **서재 관리** — 읽은 책 / 읽는 중 / 읽고 싶은 책 분류
- **독서 리뷰** — 책별 리뷰 작성 및 별점 관리
- **독서 목표** — 연간/월별 독서 목표 설정 및 추적
- **통계** — 독서 패턴 분석 (카테고리별, 월별)
- **검색** — 도서 검색
- **SSO 로그인** — podo-auth 연동 (auth.podonest.com)

## 기술 스택

### Backend
- **FastAPI** — 비동기 Python 웹 프레임워크
- **SQLite + SQLAlchemy 2.0** — 데이터베이스 (비동기, aiosqlite)
- **Alembic** — 데이터베이스 마이그레이션
- **uv** — 패키지 관리

### Frontend
- **React 19 + TypeScript** — SPA
- **Vite** — 빌드 도구
- **Tailwind CSS v4** — Grape 디자인 시스템 (Podonest 공통)
- **React Router v7** — 라우팅
- **Nginx** — 프로덕션 서빙

### Infrastructure
- **Docker Compose** — 컨테이너 오케스트레이션
- **Cloudflare Tunnel** — 외부 노출 (`bookshelf.podonest.com`)

## 실행

```bash
docker compose up -d
```

| 서비스 | URL |
|--------|-----|
| 웹 | http://localhost:3100 |
| API | http://localhost:8001 |
| API 문서 | http://localhost:8001/docs |

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `AUTH_SERVER_URL` | `https://auth.podonest.com` | podo-auth 백엔드 URL |
| `JWT_SECRET` | `podo-jwt-secret-change-in-production` | JWT 검증 키 |
| `CORS_ORIGINS` | `*` | CORS 허용 출처 |

프론트엔드 빌드 시 ARG:

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_AUTH_URL` | `https://auth.podonest.com` | SSO 로그인 페이지 URL |
| `VITE_AUTH_CALLBACK_URL` | `https://bookshelf.podonest.com/auth/callback` | 로그인 후 콜백 URL |

## 프로젝트 구조

```
podo-bookshelf/
├── backend/
│   └── app/
│       ├── api/       # books, reviews, goals, stats, search, export, settings
│       ├── core/      # config, database
│       ├── models/    # Book, Review, Goal 등
│       └── schemas/   # 요청/응답 스키마
├── frontend/
│   └── src/
│       ├── pages/     # BookshelfPage, BookDetailPage, ReviewListPage,
│       │              # WriteReviewPage, StatsPage, SearchPage 등
│       ├── context/   # AuthContext (podo-auth SSO)
│       └── components/
└── docker-compose.yml
```

## Podonest.com 서비스 연계

```
auth.podonest.com       → podo-auth (인증)
bookshelf.podonest.com  ← 이 서비스
budget.podonest.com     → podo-budget
```
