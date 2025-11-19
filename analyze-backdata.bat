@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   backdata.xlsx 분석 도구
echo ========================================
echo.
echo 📊 backdata.xlsx 파일의 "월별목표" 시트를 분석합니다...
echo.

node analyze-backdata.js

echo.
echo 아무 키나 눌러 종료하세요...
pause > nul


