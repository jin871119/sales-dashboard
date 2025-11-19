@echo off
chcp 65001 > nul
echo ================================
echo   최종 수정사항 GitHub 업로드
echo ================================
echo.

echo [1/3] 모든 변경사항 추가 중...
git add .
if %errorlevel% neq 0 (
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 파일 추가 완료!
echo.

echo [2/3] 커밋 생성 중...
git commit -m "Fix: 빌드 오류 수정 - 구버전 컴포넌트 제거"
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
    echo 💡 문제 해결:
    echo VS Code 터미널에서 직접 실행해보세요:
    echo   git push origin main
    echo.
    pause
    exit /b 1
)
echo.
echo ================================
echo   ✅ 업로드 성공!
echo ================================
echo.
echo 🚀 Vercel이 자동으로 재배포를 시작합니다!
echo.
echo 📊 배포 상태 확인:
echo https://vercel.com/dashboard
echo.
echo 🎉 배포 완료되면 대시보드가 온라인으로 작동합니다!
echo.
pause

