@echo off
chcp 65001 > nul
echo ================================
echo   Excel 파일 업데이트 및 배포
echo ================================
echo.

echo [1/3] 업데이트된 Excel 파일 추가 중...
git add backdata.xlsx "ending focast.xlsx"
if %errorlevel% neq 0 (
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 파일 추가 완료!
echo.

echo [2/3] 커밋 생성 중...
git commit -m "Update: Excel 데이터 업데이트"
if %errorlevel% neq 0 (
    echo ⚠️  커밋할 변경사항이 없거나 이미 커밋되어 있습니다.
    echo.
    pause
    exit /b 0
)
echo ✅ 커밋 생성 완료!
echo.

echo [3/3] GitHub에 푸시 중...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ GitHub 푸시 실패!
    echo.
    pause
    exit /b 1
)
echo.
echo ================================
echo   ✅ 업데이트 완료!
echo ================================
echo.
echo 🚀 Vercel이 자동으로 재배포를 시작합니다.
echo    새로운 데이터가 반영되려면 2-3분 정도 소요됩니다.
echo.
echo 📊 Vercel 대시보드에서 배포 상태 확인:
echo    https://vercel.com/dashboard
echo.
pause

