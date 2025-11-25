# 🚀 배포 명령어 (Windows)

## ✅ Windows 환경에 맞는 명령어

### 방법 1: 배치 파일 실행 (가장 간단)

파일 탐색기에서 `deploy-fresh.bat` 더블클릭

### 방법 2: CMD에서 직접 실행

```cmd
REM 캐시 삭제
if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

REM 패키지 재설치
npm install

REM 빌드 테스트
npm run build

REM 배포
vercel --prod
```

### 방법 3: PowerShell에서 실행

```powershell
# 캐시 삭제
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }

# 패키지 재설치
npm install

# 빌드 테스트
npm run build

# 배포
vercel --prod
```

---

## 📋 단계별 설명

### 1단계: 캐시 삭제
- `.next` 폴더: Next.js 빌드 캐시
- `node_modules` 폴더: 설치된 패키지
- `package-lock.json`: 패키지 잠금 파일

### 2단계: 패키지 재설치
```cmd
npm install
```
- 모든 의존성을 깨끗하게 재설치

### 3단계: 빌드 테스트
```cmd
npm run build
```
- 프로덕션 빌드가 성공하는지 확인
- 오류가 있으면 수정 후 재시도

### 4단계: 배포
```cmd
vercel --prod
```
- Vercel에 프로덕션 배포
- 처음이면 `vercel login` 먼저 실행

---

## 🎯 빠른 실행

### 한 번에 실행 (배치 파일)
```cmd
deploy-fresh.bat
```

### 또는 수동으로
```cmd
deploy-fresh.bat
```
배치 파일이 자동으로 모든 단계를 수행합니다.

---

## ⚠️ 주의사항

1. **시간이 걸릴 수 있습니다**
   - `node_modules` 삭제/재설치: 2-5분
   - 빌드: 1-3분
   - 배포: 2-5분

2. **인터넷 연결 필요**
   - npm 패키지 다운로드
   - Vercel 배포

3. **Vercel 로그인 필요** (처음만)
   ```cmd
   vercel login
   ```

---

## 🔍 문제 발생 시

### 빌드 실패
- 오류 메시지 확인
- TypeScript 오류 수정
- 의존성 문제 확인

### 배포 실패
- Vercel 대시보드에서 로그 확인
- Build Logs 확인
- 오류 메시지 공유

---

## ✅ 성공 확인

배포가 성공하면:
```
✅ Production: https://your-project.vercel.app
```

이 URL로 접속하여 대시보드를 확인하세요!





