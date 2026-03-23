# GitHub 이슈 & 프로젝트 관리 규칙

## 이슈 생성 시 필수
1. **Type 라벨** (1개 필수): `bug`, `feature`, `improvement`, `chore`, `docs`
2. **Priority 라벨** (1개 필수): `priority: high`, `priority: medium`, `priority: low`
3. **Area 라벨** (1개 이상): `area: frontend`, `area: backend`, `area: infra`
4. **프로젝트 추가**: "포도책장 로드맵"에 추가 + Status 설정

## 라벨 체계 (13개)

### Type
| 라벨 | 언제 사용 |
|------|----------|
| `bug` | 기존 기능이 의도대로 동작하지 않을 때 |
| `feature` | 완전히 새로운 기능 추가 |
| `improvement` | 기존 기능 개선, 리팩토링, 성능 최적화, 코드 품질 |
| `chore` | CI/CD, 인프라, 의존성, 설정, 빌드 |
| `docs` | 문서 작성/수정 |

### Priority
| 라벨 | 기준 |
|------|------|
| `priority: high` | 이번 주 안에 처리 |
| `priority: medium` | 다음 스프린트 |
| `priority: low` | 시간 나면 |

### Area
| 라벨 | 범위 |
|------|------|
| `area: frontend` | React, TypeScript, Vite, CSS |
| `area: backend` | FastAPI, Python, SQLAlchemy, Alembic |
| `area: infra` | GitHub Actions, Fly.io, Cloudflare, Docker, 모니터링 |

여러 영역에 걸치면 복수 area 라벨 가능.

### Close 사유
| 라벨 | 용도 |
|------|------|
| `duplicate` | 중복 이슈 |
| `wontfix` | 의도적으로 처리 안 함 |

## Status — Projects 필드 흐름
```
Backlog → Todo → In Progress → On Dev → Done
```

| Status | 전환 시점 |
|--------|----------|
| Backlog | 이슈 생성 시 |
| Todo | 작업 계획 시 |
| In Progress | 코드 수정 시작 시 |
| On Dev | PR → develop 머지 시 |
| Done | release/hotfix → main 머지 시 |

## PR 규칙
- body에 `close #번호` 포함 (머지 시 이슈 자동 close)
- 머지 후 관련 이슈 Status 업데이트
