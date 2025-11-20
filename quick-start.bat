@echo off
chcp 65001 > nul
cls
echo ╔════════════════════════════════════════╗
echo ║   영업 대시보드 - 빠른 시작           ║
echo ╚════════════════════════════════════════╝
echo.
echo 🔄 기존 서버 종료 중...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak > nul

echo.
echo 🚀 개발 서버 시작 중...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

npm run dev

