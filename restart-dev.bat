@echo off
chcp 65001 > nul
echo ========================================
echo 개발 서버 재시작
echo ========================================
echo.
echo 기존 Node 프로세스 종료 중...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul

echo.
echo 개발 서버 시작 중...
echo.
start cmd /k "npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo ✅ 개발 서버 재시작 완료!
echo ========================================
echo.
echo 브라우저에서 확인:
echo http://localhost:3000
echo.
echo "📅 일주월별 판매" 탭을 클릭하세요!
echo.
pause
start http://localhost:3000

