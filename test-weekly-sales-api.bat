@echo off
chcp 65001 > nul
echo ========================================
echo 일주월별 판매 API 테스트
echo ========================================
echo.
echo 브라우저에서 다음 URL을 확인하세요:
echo.
echo 1. 전체 분석 데이터:
echo    http://localhost:3000/api/weekly-sales?view=analytics
echo.
echo 2. 요약 정보:
echo    http://localhost:3000/api/weekly-sales?view=summary
echo.
echo 3. 매장 목록 (페이징):
echo    http://localhost:3000/api/weekly-sales?view=stores^&page=1^&pageSize=30
echo.
echo 4. 일별 판매:
echo    http://localhost:3000/api/weekly-sales?view=daily
echo.
echo ========================================
echo.
echo 💡 메인 대시보드:
echo    http://localhost:3000
echo    → "📅 일주월별 판매" 탭 클릭!
echo.
echo ========================================
pause
start http://localhost:3000

