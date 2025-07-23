# 깃허브 배포 가이드

## 일반적인 업데이트 (버그 수정, 소규모 개선)

### 1. 변경사항 확인
```bash
git status
git diff
```

### 2. 로컬 빌드 테스트
```bash
npm run build
```

### 3. 변경사항 스테이징
```bash
git add [파일명들]
# 또는 모든 변경사항
git add .
```

### 4. 커밋 (의미있는 메시지 작성)
```bash
git commit -m "$(cat <<'EOF'
제목: 간단한 변경사항 설명

- 구체적인 변경내용 1
- 구체적인 변경내용 2
- 구체적인 변경내용 3

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 5. 푸시
```bash
git push
```

---

## 주요 업데이트 (새 기능, 대규모 변경) - 버전 관리

### 1. package.json 버전 업데이트
```bash
# 패치 버전 (1.0.0 → 1.0.1) - 버그 수정
npm version patch

# 마이너 버전 (1.0.0 → 1.1.0) - 새 기능 추가
npm version minor

# 메이저 버전 (1.0.0 → 2.0.0) - 대규모 변경, 호환성 변경
npm version major
```

### 2. 변경사항 스테이징 및 커밋
```bash
git add .
git commit -m "$(cat <<'EOF'
Release v[버전번호]: 주요 업데이트 제목

## 새로운 기능
- 새 기능 1 설명
- 새 기능 2 설명

## 개선사항
- 개선사항 1
- 개선사항 2

## 버그 수정
- 수정된 버그 1
- 수정된 버그 2

## 기술적 변경사항
- 기술적 개선사항들

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 3. 태그 생성 (선택사항 - 중요한 릴리즈)
```bash
git tag -a v1.2.0 -m "Release v1.2.0: 주요 기능 추가"
```

### 4. 푸시 (태그 포함)
```bash
git push
git push --tags  # 태그가 있는 경우
```

---

## 버전 관리 규칙

### Semantic Versioning (MAJOR.MINOR.PATCH)

**MAJOR (1.0.0 → 2.0.0)**
- 호환성이 깨지는 변경
- 전체 시스템 재설계
- 사용자 경험의 근본적 변화

**MINOR (1.0.0 → 1.1.0)**
- 새로운 기능 추가
- 기존 기능의 대폭 개선
- 새로운 컴포넌트/모듈 추가

**PATCH (1.0.0 → 1.0.1)**
- 버그 수정
- 작은 UI 개선
- 성능 최적화

---

## 빌드 실패 시 대응

### 1. 로컬에서 빌드 테스트
```bash
npm run build
```

### 2. ESLint 오류 확인 및 수정
```bash
npm run lint
```

### 3. 일반적인 오류 유형
- **Syntax error**: `await` without `async`, 문법 오류
- **Import error**: 잘못된 import 경로나 export
- **Missing dependencies**: useEffect dependency 누락
- **Type error**: TypeScript 타입 오류

### 4. 수정 후 재빌드 및 푸시
```bash
npm run build  # 성공 확인
git add [수정된 파일들]
git commit -m "Fix build errors: [오류 설명]"
git push
```

---

## GitHub Actions 확인

### 1. Actions 탭에서 빌드 상태 확인
- https://github.com/anzpek/vacation-manager-react/actions

### 2. 실패 시 로그 확인
- 실패한 workflow 클릭
- "Build and Deploy" 단계 확인
- 오류 메시지 분석 후 수정

### 3. 성공 시 배포 확인
- https://anzpek.github.io/vacation-manager-react/

---

## 현재 프로젝트 상태
- **현재 버전**: 1.0.0
- **배포 URL**: https://anzpek.github.io/vacation-manager-react/
- **Repository**: https://github.com/anzpek/vacation-manager-react

---

## 주요 업데이트 예정 사항
- [ ] 모바일 UI 최적화
- [ ] 사용자 권한 관리 개선
- [ ] 통계 및 리포트 기능
- [ ] 다국어 지원
- [ ] 테마 커스터마이징
- [ ] API 최적화
- [ ] 테스트 커버리지 개선

---

## 긴급 롤백 (문제 발생 시)

### 1. 이전 커밋으로 되돌리기
```bash
git log --oneline  # 커밋 히스토리 확인
git reset --hard [이전_커밋_해시]
git push --force-with-lease
```

### 2. 특정 파일만 되돌리기
```bash
git checkout [커밋_해시] -- [파일명]
git commit -m "Revert [파일명] to previous version"
git push
```