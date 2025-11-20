@echo off
chcp 65001 > nul
node fix-weekly-dates.js
echo.
echo ========================================
echo 위 정보를 확인하고 Enter를 누르세요
echo ========================================
pause

