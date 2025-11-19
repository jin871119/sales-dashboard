@echo off
chcp 65001 > nul
echo ================================
echo   상권구분 시트 분석
echo ================================
echo.

node analyze-store-area.js

echo.
pause

