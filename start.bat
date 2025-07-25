@echo off
echo 휴가관리시스템 개발 서버를 시작합니다...
echo.

rem Node.js 버전 확인
node --version
echo.

rem npm 의존성 설치 (필요한 경우)
if not exist "node_modules" (
    echo 의존성을 설치하는 중...
    npm install
    echo.
)

rem 개발 서버 시작
echo 개발 서버 시작 중... (http://localhost:3000)
echo 종료하려면 Ctrl+C를 누르세요.
echo.
npm start

pause