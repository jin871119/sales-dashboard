@echo off
echo ====================================
echo 엑셀 라이브러리 설치 및 구조 확인
echo ====================================
echo.

echo 1단계: xlsx 패키지 설치 중...
call npm install xlsx
echo.

echo 2단계: 엑셀 파일 구조 확인 중...
echo.
call npm run check-excel
echo.

echo ====================================
echo 완료!
echo ====================================
pause


