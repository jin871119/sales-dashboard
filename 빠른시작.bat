@echo off
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🚀 영업 대시보드 - 빠른 시작
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [1/3] 패키지 설치 확인 중...
echo.

REM node_modules 폴더가 없으면 설치
if not exist "node_modules" (
    echo 📦 패키지를 설치합니다...
    call npm install
    echo.
) else (
    echo ✅ 패키지가 이미 설치되어 있습니다.
    echo.
)

echo [2/3] xlsx 패키지 설치 중...
call npm install xlsx
echo.

echo [3/3] 개발 서버 시작 중...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 서버가 시작됩니다!
echo.
echo 🌐 브라우저에서 다음 주소로 접속하세요:
echo    http://localhost:3000
echo.
echo ⚠️  서버를 중지하려면 Ctrl + C를 누르세요
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

call npm run dev


