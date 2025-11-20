@echo off
chcp 65001 > nul
echo ========================================
echo 일주월별 판매 데이터 JSON 변환
echo ========================================
echo.
node convert-weekly-to-json.js
echo.
pause

