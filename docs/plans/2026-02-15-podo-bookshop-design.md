# 포도책방 MVP 디자인

## 개요

아이와 함께 읽은 책의 도서 리딩 로그를 관리하는 개인용 웹 앱.
아이 태명 "포도"에서 따온 포도 성장 시스템으로 독서 기록의 재미를 더함.

- 서비스명: 포도책방
- 대상: 개인용 MVP (1명의 아이)
- 인증: 없음
- 디바이스: 모바일/데스크톱 동등 지원
- 배포: 맥미니 서버에서 구동, 모바일/맥북에서 접속

## 포도 성장 시스템

| 단위 | 조건 | 의미 |
|------|------|------|
| 포도알 | 리뷰 1개 | 책 1권 |
| 포도송이 | 포도알 10개 | 10권 |
| 포도나무 | 포도송이 10개 | 100권 |
| 포도정원 | 포도나무 모음 | 전체 성과 |

계산 로직:
- 포도알 = total % 10
- 포도송이 = (total / 10) % 10
- 포도나무 = total / 100

## 페이지 구조

| 페이지 | 설명 |
|--------|------|
| 홈 (포도정원) | 포도나무/송이/알 시각화 + "리뷰 쓰기" FAB + 총 읽은 권수 + 최근 리뷰 |
| 리뷰 쓰기 | Google Books 검색 → 책 선택 → 감상/아이 반응 입력 → 저장 |
| 리뷰 목록 | 전체 리뷰 리스트 (표지 썸네일 + 제목 + 날짜 + 한줄 감상) |
| 리뷰 상세 | 책 정보 + 감상 전문 + 아이 반응 + 수정/삭제 |

네비게이션: 하단 탭 (모바일), 사이드 네비 (데스크톱)
- 홈(정원) / 리뷰 쓰기 / 리뷰 목록

## 데이터 모델

### Book (책 정보)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | TSID |
| title | TEXT | 제목 |
| author | TEXT | 저자 |
| cover_url | TEXT (nullable) | 표지 이미지 URL |
| isbn | TEXT (nullable) | ISBN |
| publisher | TEXT (nullable) | 출판사 |
| created_at | DATETIME | 생성일 |
| deleted_at | DATETIME (nullable) | 삭제일 (soft delete) |
| is_deleted | BOOLEAN | 삭제 여부 (default false) |

### Review (리딩 로그)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | TSID |
| book_id | BIGINT FK | Book 참조 |
| read_date | DATE | 읽은 날짜 |
| memo | TEXT | 감상/메모 |
| child_reaction | TEXT | 아이 반응 |
| created_at | DATETIME | 생성일 |
| updated_at | DATETIME | 수정일 |
| deleted_at | DATETIME (nullable) | 삭제일 (soft delete) |
| is_deleted | BOOLEAN | 삭제 여부 (default false) |

- Book과 Review 분리: 같은 책 여러 번 읽기 가능
- 포도알 개수 = is_deleted=false인 Review count

## 리뷰 쓰기 플로우

1. 책 찾기: Google Books 검색 또는 직접 입력
2. 이미 등록된 책이면 "이 책으로 또 리뷰 쓰기" 선택 가능
3. 리딩 로그 작성: 읽은 날짜 + 감상 + 아이 반응 (감상/반응은 선택사항)
4. 저장 → 포도알 +1 애니메이션 → 홈으로 이동

## API 설계

```
Books
  GET    /api/books                  # 책 목록 (is_deleted=false)
  GET    /api/books/:id              # 책 상세 + 해당 책 리뷰들
  POST   /api/books                  # 책 등록
  PUT    /api/books/:id              # 책 정보 수정
  DELETE /api/books/:id              # soft delete

Reviews
  GET    /api/reviews                # 리뷰 목록 (TSID 역순, is_deleted=false)
  GET    /api/reviews/:id            # 리뷰 상세
  POST   /api/reviews                # 리뷰 작성 (book_id 포함)
  PUT    /api/reviews/:id            # 리뷰 수정
  DELETE /api/reviews/:id            # soft delete

Search
  GET    /api/search/books?q=검색어   # Google Books API 프록시

Stats
  GET    /api/stats                  # 포도정원 통계
         → { total_reviews, grapes, bunches, trees }
```

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| Backend | FastAPI (async) | homenrich와 동일 패턴 |
| DB | SQLite + aiosqlite | 개인용 MVP, 파일 하나로 간단 |
| ORM | SQLAlchemy 2.0 (async) | homenrich와 동일 |
| Migration | Alembic | DB 마이그레이션 관리 |
| ID | TSID (python-tsid) | 시간순 정렬 + 유니크 |
| Frontend | React 19 + Vite + Tailwind CSS v4 | homenrich와 동일 |
| 시각화 | SVG 커스텀 컴포넌트 | 포도 일러스트 |
| 책 검색 | Google Books API (백엔드 프록시) | 무료, 한국 도서 지원 |
| 배포 | Docker Compose (맥미니) | 로컬 네트워크에서 접속 가능 |

## 프로젝트 구조

```
podo-bookshop/
├── backend/
│   ├── app/
│   │   ├── api/           # books.py, reviews.py, search.py, stats.py
│   │   ├── core/          # config.py, database.py, tsid.py
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── schemas/       # Pydantic 스키마
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios 클라이언트
│   │   ├── components/
│   │   │   ├── garden/    # 포도정원 SVG 컴포넌트
│   │   │   ├── layout/    # 네비게이션, 레이아웃
│   │   │   └── common/    # 공통 UI
│   │   ├── pages/         # HomePage, WriteReviewPage, ReviewListPage, ReviewDetailPage
│   │   ├── assets/svg/    # 포도 일러스트 SVG
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── docs/
```

## UI 디자인 시스템

### 컬러 팔레트
| 용도 | 컬러 | 설명 |
|------|------|------|
| Primary | #7C3AED (보라) | 포도알, 주요 버튼 |
| Primary Light | #C4B5FD (연보라) | 빈 포도알, 배경 포인트 |
| Accent | #22C55E (초록) | 포도잎, 나무줄기 |
| Background | #FEFCE8 (크림) | 동화책 느낌 배경 |
| Surface | #FFFFFF | 카드, 입력 영역 |
| Text | #1C1917 (진한 갈색) | 본문 |
| Sub Text | #78716C | 보조 텍스트 |

### 타이포그래피
- 한글: Pretendard
- 포인트: font-weight 600~700 (둥근 느낌)

### SVG 에셋 (단계별)
- 포도알: 빈 원 → 채워진 보라색 원
- 포도송이: 포도알 10개가 모여 송이 형태
- 포도나무: 줄기 + 잎 + 매달린 송이들
- 포도정원: 완성된 나무들 나란히

### 마이크로 인터랙션
- 저장 시: 포도알 bounce 애니메이션
- 10권 달성: 포도알 → 송이 트랜지션
- 100권 달성: 나무 성장 애니메이션

## 배포 (맥미니 서버)

- Docker Compose로 backend + frontend 실행
- 맥미니 로컬 IP 또는 tailscale 등으로 외부 접속
- 모바일/맥북에서 브라우저로 접속

## 미래 확장 (MVP 이후)

- 다자녀 지원
- 커뮤니티 (엄마들 공유)
- 댓글
- 작가별 소팅
- 별점
- 사용자 인증
