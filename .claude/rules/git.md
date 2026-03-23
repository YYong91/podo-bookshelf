# Git 규칙

## 커밋 메시지
- 한국어로 작성
- 형식: `타입: 설명`
- 타입: feat, fix, refactor, test, docs, chore, style
- 예시: `feat: 바코드 스캔 독서 기록 추가`

## 브랜치 전략
- main: 운영 브랜치 (직접 push 금지)
- develop: 개발 브랜치 (feature/fix 브랜치의 머지 대상)
- feature/기능명: 기능 개발 (develop에서 분기)
- fix/버그명: 버그 수정 (develop에서 분기)
- release/x.x.x: 릴리즈 안정화 (develop에서 분기 → main 머지)
- hotfix/xxx: 운영 긴급 수정 (main에서 분기 → main 머지)

## 버전 관리
- SemVer (x.y.z) 기반, 현재 0.x.x (정식 출시 전)
- release → main 머지 시: minor bump
- hotfix → main 머지 시: patch bump

## 워크트리 활용
- 독립 작업은 워크트리로 분리: `git worktree add -b feature/xxx ../podo-bookshelf-xxx develop`
- 워크트리에서 작업 → PR → 머지 후 정리: `git worktree remove ../podo-bookshelf-xxx`

## 작업 워크플로우
```
1. 브랜치 생성      git checkout develop && git pull origin develop
                    git checkout -b feature/xxx

2. 작업 + 커밋      (커밋 전 체크 규칙 준수)

3. 로컬 테스트      cd backend && pytest tests/
                    cd frontend && npm run lint && npm run build

4. PR 생성          git push -u origin feature/xxx
                    gh pr create --base develop

5. CI 통과 확인     GitHub Actions CI 통과 대기

6. PR 머지          CI 통과 후 머지

7. 정리             git checkout develop && git pull origin develop
                    git branch -d feature/xxx
```

## 배포 흐름
- main 머지 → 운영 배포 (Fly.io + Cloudflare Pages)
- 배포 시 `alembic upgrade head` 자동 실행 (Fly.io release_command)
