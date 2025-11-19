@echo off
chcp 65001 > nul
echo ================================
echo   GitHub 저장소 업로드 스크립트
echo ================================
echo.

echo [1/8] Git 설치 확인 중...
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git이 설치되어 있지 않습니다!
    echo.
    echo 다음 링크에서 Git을 다운로드하여 설치하세요:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo ✅ Git 설치 확인 완료!
echo.

echo [2/8] Git 초기화 중...
git init
if %errorlevel% neq 0 (
    echo ⚠️  이미 Git 저장소가 초기화되어 있습니다.
) else (
    echo ✅ Git 저장소 초기화 완료!
)
echo.

echo [3/8] Git 사용자 설정 중...
git config --global user.name "jin871119"
git config --global user.email "jin871119@github.com"
echo ✅ Git 사용자 설정 완료!
echo.

echo [4/8] .gitignore 파일 확인 중...
if not exist .gitignore (
    echo node_modules/ > .gitignore
    echo .next/ >> .gitignore
    echo .env.local >> .gitignore
    echo .DS_Store >> .gitignore
    echo *.log >> .gitignore
    echo ✅ .gitignore 파일 생성 완료!
) else (
    echo ✅ .gitignore 파일이 이미 존재합니다.
)
echo.

echo [5/8] 파일 추가 중...
git add .
if %errorlevel% neq 0 (
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 모든 파일 추가 완료!
echo.

echo [6/8] 커밋 생성 중...
git commit -m "Initial commit: Sales Dashboard"
if %errorlevel% neq 0 (
    echo ⚠️  커밋 실패 또는 이미 커밋되어 있습니다.
) else (
    echo ✅ 커밋 생성 완료!
)
echo.

echo [7/8] GitHub 원격 저장소 연결 중...
git remote add origin https://github.com/jin871119/sales-dashboard.git 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  원격 저장소가 이미 연결되어 있습니다.
    git remote set-url origin https://github.com/jin871119/sales-dashboard.git
    echo ✅ 원격 저장소 URL 업데이트 완료!
) else (
    echo ✅ GitHub 원격 저장소 연결 완료!
)
echo.

echo [8/8] GitHub에 푸시 중...
git branch -M main
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ GitHub 푸시 실패!
    echo.
    echo 💡 문제 해결 방법:
    echo 1. GitHub 로그인 정보를 확인하세요.
    echo 2. 아래 명령어로 다시 시도하세요:
    echo    git push -u origin main
    echo.
    echo 3. Personal Access Token이 필요할 수 있습니다.
    echo    https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)
echo.
echo ================================
echo   ✅ GitHub 업로드 성공!
echo ================================
echo.
echo 다음 링크에서 확인하세요:
echo https://github.com/jin871119/sales-dashboard
echo.
pause

