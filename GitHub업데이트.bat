@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   GitHub 업데이트 (기간실적 타입 수정)
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 변경사항 스테이징 중...
git add lib/summaryReader.ts
if %errorlevel% neq 0 (
    echo ❌ 스테이징 실패!
    pause
    exit /b 1
)
echo ✅ 스테이징 완료

echo.
echo [2/3] 커밋 중...
git commit -m "TypeScript 타입 오류 수정: SummaryData 인터페이스에 기간실적 관련 속성 추가"
if %errorlevel% neq 0 (
    echo ⚠️  커밋할 변경사항이 없거나 이미 커밋됨
)
echo ✅ 커밋 완료

echo.
echo [3/3] GitHub에 푸시 중...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ 푸시 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ GitHub 업데이트 완료!
echo ========================================
echo.
echo Vercel 자동 배포가 시작됩니다...
echo 약 2-3분 후 사이트에서 확인하세요!
echo.
echo 배포 상태: https://vercel.com/
echo.
pause

