@echo off
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔧 ERR_CONNECTION_REFUSED 문제 해결
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [단계 1] 기존 Next.js 프로세스 종료 중...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
echo ✅ 완료
echo.

echo [단계 2] .next 캐시 폴더 삭제 중...
if exist ".next" (
    rmdir /s /q .next
    echo ✅ .next 폴더 삭제됨
) else (
    echo ℹ️  .next 폴더가 없습니다
)
echo.

echo [단계 3] 패키지 재설치 중...
if exist "node_modules" (
    echo 기존 node_modules 삭제 중...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del /f /q package-lock.json
)
echo.
echo 패키지 설치 중... (시간이 좀 걸릴 수 있습니다)
call npm install
echo.

echo [단계 4] xlsx 패키지 설치 중...
call npm install xlsx
echo.

echo [단계 5] 개발 서버 시작 중...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 문제 해결 완료!
echo.
echo 🌐 브라우저에서 접속하세요:
echo    http://localhost:3000
echo.
echo ⚠️  중지하려면 Ctrl + C
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

call npm run dev


