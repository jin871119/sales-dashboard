@echo off
chcp 65001 > nul
echo ╔════════════════════════════════════════╗
echo ║   판매 대시보드 Vercel 배포           ║
echo ╚════════════════════════════════════════╝
echo.

echo [1/5] Git 상태 확인...
git status

echo.
echo [2/5] 변경사항 추가 중...
git add .

echo.
echo [3/5] 커밋 생성 중...
git commit -m "feat: 판매 대시보드 완성 - 192개 매장, 일별 판매 추이, 지역별 분석, 제품별 Top5 매장"

echo.
echo [4/5] GitHub에 푸시 중...
git push origin main

echo.
echo [5/5] Vercel 배포 트리거됨!
echo.
echo ════════════════════════════════════════
echo ✅ 배포 완료!
echo ════════════════════════════════════════
echo.
echo 🌐 Vercel 대시보드에서 배포 상태 확인:
echo    https://vercel.com/
echo.
echo 📊 배포된 기능:
echo    ✅ 판매 대시보드 (일주월별)
echo    ✅ 192개 매장 데이터 분석
echo    ✅ 11/1~19일 일별 판매 추이 차트
echo    ✅ 지역별 분석 (매장 분석)
echo    ✅ 제품별 Top 5 매장 팝업
echo    ✅ 정상 판매 데이터 기준
echo    ✅ 세부 데이터 토글 기능
echo.
echo 💡 배포 후 테스트:
echo    1. 개요 탭 확인
echo    2. 판매 탭 (개요 바로 옆) 확인
echo    3. 일별 판매 추이 차트 확인
echo    4. 세부 데이터 보기 버튼 테스트
echo    5. 제품 분석 - 베스트셀러 클릭 테스트
echo.
pause

