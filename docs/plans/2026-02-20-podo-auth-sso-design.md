# Podo 통합 인증 (SSO) 설계

## 개요

podo 시리즈 앱(bookshop, budget 등)을 위한 중앙 인증 서버 구축. 별도 `podo-auth` 서비스가 사용자 관리, 로그인/가입, JWT 발급을 전담하고, 각 앱은 JWT 서명만 검증하여 인증한다.

## 결정 사항

- **아키텍처**: 중앙 인증 서버 + 리다이렉트 방식 SSO
- **인증 방식**: 이메일 + 비밀번호
- **토큰**: JWT (Access Token 1시간, Refresh Token 30일)
- **가입 정책**: 오픈 가입
- **기술 스택**: FastAPI + React + SQLite (기존 podo 시리즈와 동일)
- **배포**: 같은 Mac Mini, Docker Compose
- **디자인**: podo-bookshop 디자인 톤 동일 적용

## 전체 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  브라우저      │     │  브라우저      │     │  브라우저      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ podo-auth   │     │podo-bookshop│     │ podo-budget  │
│ :3000       │     │ :3100       │     │ :3200       │
│ (인증 서버)  │◄────│ (독서 기록)  │     │ (향후 추가)   │
│ FastAPI+React│    │ FastAPI+React│    │             │
│ SQLite      │     │ SQLite      │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 인증 흐름

1. 사용자가 podo-bookshop 접속
2. JWT 없거나 만료 → `podo-auth` 로그인 페이지로 리다이렉트 (`redirect_uri` 파라미터 포함)
3. 로그인/가입 성공 → JWT 발급 → `redirect_uri`로 리다이렉트 (토큰은 query param)
4. podo-bookshop이 JWT를 localStorage에 저장, API 호출 시 Authorization 헤더에 포함
5. 백엔드가 JWT 서명 검증으로 사용자 인증

**공유하는 것**: JWT signing key만 (환경변수로 주입)

## podo-auth 데이터 모델

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT (TSID) | PK |
| email | TEXT UNIQUE | 로그인용 이메일 |
| password_hash | TEXT | bcrypt 해시 |
| name | TEXT | 표시 이름 |
| is_active | BOOLEAN | 계정 활성 상태 |
| created_at | DATETIME | 생성일 |
| updated_at | DATETIME | 수정일 |

### registered_apps 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT (TSID) | PK |
| name | TEXT | 앱 이름 |
| redirect_uri | TEXT | 로그인 후 리다이렉트 URL |
| is_active | BOOLEAN | 활성 상태 |

### refresh_tokens 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT (TSID) | PK |
| user_id | TEXT FK | users.id |
| token_hash | TEXT | refresh token 해시 |
| expires_at | DATETIME | 만료 시각 |
| created_at | DATETIME | 생성일 |

## podo-auth API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 (email, password, name) |
| POST | `/api/auth/login` | 로그인 → JWT 발급 |
| POST | `/api/auth/refresh` | Access Token 갱신 |
| GET | `/api/auth/me` | 현재 사용자 정보 |
| PUT | `/api/auth/me` | 사용자 정보 수정 |

### JWT 구조

**Access Token** (만료: 1시간):
```json
{
  "sub": "user_tsid",
  "email": "user@example.com",
  "name": "홍길동",
  "exp": 1708500000,
  "iss": "podo-auth"
}
```

**Refresh Token** (만료: 30일): DB에 저장, httpOnly 쿠키로 전달

## podo-auth 프론트엔드

### 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login?redirect_uri=...` | 이메일/비밀번호 + 가입 링크 |
| 회원가입 | `/register?redirect_uri=...` | 이메일/비밀번호/이름 |
| 프로필 | `/profile` | 이름/비밀번호 변경 |

### 디자인

podo-bookshop과 동일한 디자인 언어:
- **컬러**: grape(보라) 주색상, leaf(초록) 성공, cream 배경, warm 텍스트
- **폰트**: Pretendard Variable
- **카드**: `rounded-xl bg-white shadow-sm` on cream 배경
- **애니메이션**: grape-pop, bounce-in
- **브랜드**: 🍇 포도 이모지, 한국어 UI
- **모바일 우선** 반응형

## podo-bookshop 연동 변경

### 백엔드
1. JWT 검증 미들웨어 추가 (공유 signing key)
2. books, reviews 테이블에 `user_id` 컬럼 추가 (사용자별 데이터 격리)
3. settings/goals를 JSON 파일 → DB 테이블로 마이그레이션 (user_id 포함)
4. 모든 API에 `get_current_user` 의존성 주입

### 프론트엔드
1. AuthContext 추가: JWT 관리, 로그인 상태
2. `/auth/callback` 라우트: 인증 서버 리다이렉트 처리, 토큰 저장
3. API 클라이언트: Authorization 헤더 자동 포함
4. ProtectedRoute 컴포넌트: 미인증 시 podo-auth로 리다이렉트

### DB 마이그레이션
- books, reviews에 `user_id` 컬럼 추가 (nullable, 기존 데이터 보존)
- user_settings, user_goals 테이블 신규 생성

## 배포

같은 Mac Mini Docker Compose에 podo-auth 컨테이너 추가:
- podo-auth backend: port 8000
- podo-auth frontend: port 3000
- 환경변수로 JWT_SECRET 공유
- Tailscale 통해 가족 접근
