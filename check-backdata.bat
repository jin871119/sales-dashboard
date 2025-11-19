@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   backdata.xlsx 구조 분석
echo ========================================
echo.

node check-backdata-structure.js

echo.
echo 아무 키나 눌러 종료...
pause > nul


