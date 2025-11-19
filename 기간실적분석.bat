@echo off
chcp 65001 > nul
echo ================================
echo   기간실적 컬럼 분석
echo ================================
echo.

node analyze-period-performance.js

echo.
pause

