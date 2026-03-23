# 아키텍처 원칙

## 백엔드 레이어 구조
```
api/ → schemas/ → services/ → models/ → database
```

- api: HTTP 요청/응답, 간단한 CRUD 쿼리 가능. 복잡한 비즈니스 로직은 services로 분리
- services: 복잡한 비즈니스 로직, 외부 API 호출, 다중 모델 조합. DB 직접 접근 가능
- models: SQLAlchemy ORM 모델. 테이블 정의와 관계만
- schemas: Pydantic 모델. 입출력 검증과 직렬화

### 서비스 분리 기준
- 단순 CRUD (1~2 쿼리) → api에서 직접 처리
- 외부 API 연동 (Google Books 등), 복잡한 집계 → services로 분리
- 여러 모델을 조합하는 트랜잭션 → services로 분리

## 의존성 방향
- api → services → models (단방향)
- schemas는 api와 services에서 사용
- api에서 models import 가능 (단순 CRUD용)

## DB 접근
- AsyncSession을 Depends(get_db)로 주입
- 서비스 함수에 session 파라미터로 전달
- ORM 쿼리는 select() 스타일 (2.0 방식)

## 데이터 소유권 (user_id 기반)
- 모든 데이터는 user_id 기반 (NOT NULL)
- API에서 `get_current_user`로 인증된 사용자 확인
- 모든 쿼리에 `WHERE user_id == current_user.id` 필터 필수
- 소유권 검증 실패 시 404 반환 (403 아님 — 존재 여부 노출 방지)

## 인증 (podo-auth SSO)
- 자체 로그인 없음 — podo-auth SSO 전용
- 토큰: 쿠키(podo_access_token) > localStorage (Safari ITP fallback)
- 프론트: `isAuthenticated` 동기 판단 → 미인증 시 auth.podonest.com으로 리디렉션
- 백엔드: `get_current_user` 디펜던시로 JWT 검증 (issuer="podo-auth")

## 외부 API 통합 (Google Books)
- httpx.AsyncClient로 비동기 호출
- timeout 필수 설정 (10초)
- 외부 API 호출은 services에서 처리

## 프론트엔드 구조
```
pages/ → api/ → types/
  ↕         ↕
context/  components/
```

- pages: 페이지 단위 컴포넌트. API 호출 + 상태 관리
- api: Axios 기반 API 클라이언트. 공유 인스턴스 (`api/client.ts`)
- types: TypeScript 타입 정의 (백엔드 스키마 대응)
- components: 재사용 UI 컴포넌트
- context: React Context (AuthContext)
- utils: 헬퍼 함수

## ID 전략
- TSID (Timestamp Sorted ID) 사용
- DB: BigInteger, API: 문자열 직렬화 (JavaScript BigInt 정밀도 이슈 방지)
- `StrId` 타입 별칭으로 통일
