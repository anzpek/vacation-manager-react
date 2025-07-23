# 부서 휴가 관리 시스템

🏢 부서별 휴가 관리를 위한 React 기반 웹 애플리케이션

## 🚀 주요 기능

### 📋 기본 기능
- **부서별 로그인**: 각 부서별 독립된 로그인 시스템
- **휴가 등록/수정/삭제**: 직관적인 캘린더 인터페이스
- **직원 관리**: 부서별 직원 등록 및 관리
- **실시간 동기화**: Firebase를 통한 실시간 데이터 동기화

### 📊 고급 기능
- **휴가 통계 대시보드**: 월별/연간 휴가 사용 현황
- **휴가 잔여일수 관리**: 개인별 연차 사용률 추적
- **팀별 휴가 현황**: 팀 단위 실시간 휴가 모니터링
- **Excel 내보내기**: 다양한 형태의 보고서 생성
- **실시간 알림**: 휴가 등록/수정/삭제 시 즉시 알림

### 🎨 UI/UX
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **다크모드**: 사용자 선호에 따른 테마 변경
- **스켈레톤 UI**: 부드러운 로딩 경험
- **직관적인 인터페이스**: 사용하기 쉬운 UI/UX

## 🏗️ 기술 스택

- **Frontend**: React 19.1.0, React Router DOM
- **Backend**: Firebase Realtime Database
- **Styling**: CSS Custom Properties, Responsive Design
- **Build**: Create React App, Craco
- **Deployment**: GitHub Pages, GitHub Actions

## 🔧 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/anzpek/vacation-manager.git
cd vacation-manager
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
Firebase 설정은 `src/utils/firebase.js`에서 확인하세요.

### 4. 개발 서버 실행
```bash
npm start
```

애플리케이션이 http://localhost:3000에서 실행됩니다.

## 🏢 부서 정보

현재 등록된 부서:
- **보상지원부**
- **경기보상3팀**

※ 로그인 정보는 부서 관리자에게 문의하세요.

## 🚀 배포

### GitHub Pages 자동 배포
1. GitHub 저장소에 코드 푸시
2. GitHub Actions가 자동으로 빌드 및 배포
3. https://anzpek.github.io/vacation-manager 에서 확인

### 수동 배포
```bash
npm run build
# build 폴더를 웹 서버에 업로드
```

## 🔒 보안

### Firebase Security Rules
부서별 데이터 격리를 위한 보안 규칙이 적용되어 있습니다:
- 각 부서는 자신의 데이터만 접근 가능
- 인증된 사용자만 데이터 읽기/쓰기 가능
- 데이터 유효성 검증 규칙 적용

### 데이터 구조
```
departments/
  ├── 보상지원부/
  │   ├── employees/
  │   ├── vacations/
  │   └── settings/
  └── 경기보상3팀/
      ├── employees/
      ├── vacations/
      └── settings/
```

## 📱 사용 가이드

### 로그인
1. 부서 카드 선택
2. 부서별 비밀번호 입력
3. 로그인 버튼 클릭

### 휴가 등록
1. 캘린더에서 날짜 클릭
2. 직원 및 휴가 유형 선택
3. 등록 버튼 클릭

### 통계 확인
- 사이드바에서 각종 통계 위젯 확인
- Excel 내보내기로 상세 보고서 생성

## 🛠️ 개발 참고사항

### 프로젝트 구조
```
src/
├── components/          # React 컴포넌트
│   ├── Auth/           # 인증 관련
│   ├── Calendar/       # 캘린더
│   ├── Dashboard/      # 대시보드
│   ├── Statistics/     # 통계
│   ├── Balance/        # 잔여일수
│   ├── Export/         # Excel 내보내기
│   ├── Team/           # 팀 현황
│   └── Firebase/       # Firebase 상태
├── contexts/           # React Context
├── utils/              # 유틸리티 함수
└── styles/             # 전역 스타일
```

### 주요 Context
- `AuthContext`: 인증 및 부서 관리
- `VacationContext`: 휴가 데이터 관리
- `ThemeContext`: 테마 설정
- `NotificationContext`: 알림 시스템

## 🤝 기여 가이드

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성: `git checkout -b feature/new-feature`
3. 변경사항 커밋: `git commit -m 'Add new feature'`
4. 브랜치 푸시: `git push origin feature/new-feature`
5. Pull Request 생성

## 📞 지원

문제나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발**: Claude Code AI Assistant  
**배포**: GitHub Pages  
**실시간 동기화**: Firebase Realtime Database