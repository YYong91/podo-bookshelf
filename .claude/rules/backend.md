---
paths:
  - "backend/**"
---

# 백엔드 규칙

## API 엔드포인트
- 라우터 prefix: `/api/{리소스명}`
- CRUD 순서: Create → Read(list) → Read(detail) → Update → Delete
- 응답은 Pydantic 스키마 (`response_model` 명시)
- 에러는 HTTPException으로 처리
- 모든 데이터 엔드포인트에서 user_id 필터 필수

## user_id 접근 패턴
```python
# 모든 데이터 엔드포인트의 표준 패턴
user_id = current_user.id
stmt = select(Model).where(Model.user_id == user_id, Model.is_deleted.is_(False))
```

## 공통 헬퍼 패턴
```python
# 조회 + 404 패턴 (중복 최소화)
async def get_book_or_404(book_id: int, user_id: int, db: AsyncSession) -> Book:
    stmt = select(Book).where(Book.id == book_id, Book.user_id == user_id, Book.is_deleted.is_(False))
    book = (await db.execute(stmt)).scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="책을 찾을 수 없습니다")
    return book
```

## 새 기능 추가 시 순서
1. models/에 모델 정의 (필요시) — `user_id` NOT NULL 포함
2. schemas/에 요청/응답 스키마
3. services/에 비즈니스 로직 (복잡한 경우)
4. api/에 라우터 추가
5. main.py에 라우터 등록
6. Alembic 마이그레이션 생성 (`alembic revision --autogenerate -m "설명"`)

## Soft Delete 패턴
- `is_deleted: bool = False`, `deleted_at: datetime | None = None`
- 삭제 시 `is_deleted = True`, `deleted_at = datetime.now(timezone.utc)`
- 모든 조회 쿼리에 `Model.is_deleted.is_(False)` 필터 필수
- 책 삭제 시 연결된 리뷰도 함께 soft delete

## 테스트
- pytest + pytest-asyncio
- 디렉토리: `tests/` (API 통합 테스트 중심)
- 비동기 테스트에 `@pytest.mark.asyncio`
- httpx.AsyncClient로 API 테스트 (`client` fixture)
- DB: SQLite in-memory, 테스트마다 테이블 생성/삭제
- conftest.py fixtures: `db_session`, `client`, `user_headers`
- 테스트 데이터에 user_id 필수 포함

## 날짜/시간
- 서버 시간: UTC 기준 (`datetime.now(timezone.utc)`)
- 사용자 대상 날짜 검증: KST 기준 고려 (타임존 버퍼)
