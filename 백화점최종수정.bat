@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   백화점 항목 최종 수정 (TTL 제거)
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
git commit -m "유통별 백화점 수정: TTL이 없음, 21행(백화점)부터 시작"
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
echo   ✅ 백화점 최종 수정 완료!
echo ========================================
echo.
echo Vercel 자동 배포가 시작됩니다...
echo 약 2-3분 후 사이트에서 확인하세요!
echo.
echo 🏬 유통별 섹션에 백화점이 표시됩니다!
echo.
pause




