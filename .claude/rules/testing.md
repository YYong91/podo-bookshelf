# 테스트 규칙

## 백엔드 (pytest + pytest-asyncio)

### 구조
- `tests/` — API 통합 테스트 + 모델 테스트
- `tests/conftest.py` — 공유 fixture

### 핵심 fixture
- `db_session` — SQLite in-memory, 테스트마다 테이블 생성/삭제
- `client` — httpx.AsyncClient (앱 dependency override 포함)
- `user_headers` — JWT 인증 헤더

### 패턴
```python
@pytest.mark.asyncio
async def test_기능_설명(client, user_headers):
    # 1. 데이터 준비
    # 2. API 호출
    response = await client.post("/api/books", json=payload, headers=user_headers)
    # 3. 응답 검증
    assert response.status_code == 201
    assert response.json()["title"] == "테스트 책"
```

### 주의사항
- 테스트 데이터에 user_id 필수 포함
- 멀티 유저 격리 테스트 유지 (test_api_isolation.py)
- soft delete된 데이터가 조회에서 제외되는지 확인

## 프론트엔드 (Vitest + React Testing Library)

### 구조
- `src/pages/__tests__/` — 페이지 테스트
- `src/__tests__/setup.ts` — 글로벌 설정

### 패턴
```typescript
describe('BookshelfPage', () => {
  it('책 목록이 표시된다', async () => {
    render(<BookshelfPage />)
    expect(await screen.findByText('테스트 책')).toBeInTheDocument()
  })
})
```

### 테스트 네이밍
- 함수명: 영어 (`test_create_book`, `it('renders ...')`)
- 설명/describe: 한국어 (`describe('책 생성')`, `it('제목이 표시된다')`)

## 전체 테스트 실행
```bash
# 백엔드
cd backend && pytest tests/ -v

# 프론트엔드
cd frontend && npm run test:run

# PR 전 필수
cd frontend && npm run lint && npm run build
```
