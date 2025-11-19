@echo off
chcp 65001 > nul
echo ================================
echo   수정사항 GitHub에 푸시하기
echo ================================
echo.

echo [1/3] 수정된 파일 추가 중...
git add .
if %errorlevel% neq 0 (
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 파일 추가 완료!
echo.

echo [2/3] 커밋 생성 중...
git commit -m "Fix: Vercel 빌드 오류 수정 (ESLint 오류 해결)"
if %errorlevel% neq 0 (
    echo ⚠️  커밋할 변경사항이 없거나 이미 커밋되어 있습니다.
) else (
    echo ✅ 커밋 생성 완료!
)
echo.

echo [3/3] GitHub에 푸시 중...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ GitHub 푸시 실패!
    echo.
    echo 💡 문제 해결 방법:
    echo 1. GitHub 로그인 정보를 확인하세요.
    echo 2. 아래 명령어로 다시 시도하세요:
    echo    git push origin main
    echo.
    pause
    exit /b 1
)
echo.
echo ================================
echo   ✅ GitHub 푸시 성공!
echo ================================
echo.
echo Vercel이 자동으로 다시 배포를 시작합니다.
echo Vercel 대시보드에서 확인하세요:
echo https://vercel.com/dashboard
echo.
pause

