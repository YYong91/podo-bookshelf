---
paths:
  - "frontend/**"
---

# 프론트엔드 규칙

## 페이지 컴포넌트 구조
```typescript
// 1. 훅 초기화 (라우터, 컨텍스트, 상태)
const { isAuthenticated } = useAuth()
const [data, setData] = useState<Type[]>([])

// 2. 데이터 로딩 (useEffect → API 호출)
useEffect(() => { fetchData() }, [dependencies])

// 3. 이벤트 핸들러 (useCallback)
const handleSubmit = useCallback(async () => { ... }, [deps])

// 4. 렌더링 (로딩 → 에러 → 빈 상태 → 데이터)
return loading ? <Loader /> : data.length ? <List /> : <EmptyState />
```

## 상태 관리 분리
- **전역 (Context):** 인증(AuthContext)
- **로컬 (useState):** 폼 입력, UI 토글, 일시적 데이터
- 전역 상태가 늘어나면 Zustand 도입 검토

## API 클라이언트 패턴
- Axios 인스턴스 공유 (`api/client.ts`)
- 토큰은 getCookieToken() 유틸리티로 통일 (cookie > localStorage fallback)
- 응답 타입 제네릭: `api.get<Book[]>('/books', { params })`
- 모든 API 호출은 try/catch로 에러 처리 + toast 알림

## 에러 처리 필수
- API 호출 실패 시 반드시 사용자에게 피드백 (toast.error)
- 전체 API 실패 시 재시도 버튼 또는 에러 메시지 표시
- React Error Boundary로 렌더링 에러 대응

## 폼 패턴
- 날짜 입력: `input type="date"` 사용
- 제출 후: toast 알림 + 목록으로 navigate

## 라우팅
- 모든 페이지 `lazy()` import (코드 스플리팅)
- `ProtectedRoute` > `Layout` > 페이지 (중첩 구조)
- 404 catch-all 라우트 필수

## 컴포넌트 크기 기준
- 200줄 이상 → 분할 검토
- UI 블록이 독립적으로 재사용 가능 → 컴포넌트 분리
- 상태 로직이 복잡 → custom hook 추출
