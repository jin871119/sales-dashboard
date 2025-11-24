# 🔧 Vercel 로그인 오류 해결 (한글 사용자명)

## ❌ 오류 메시지
```
Error: 윤진영 @ vercel 48.10.10 node-v24.11.1 win32 (x64) is not a legal HTTP header value
```

### 원인
Windows 사용자 이름이 한글("윤진영")이라서 HTTP 헤더에서 오류 발생

---

## ✅ 해결 방법

### 방법 1: 배치 파일 실행 (추천)

파일 탐색기에서 `deploy-fix-korean.bat` 더블클릭

### 방법 2: 수동 로그인

터미널(CMD)에서:

```cmd
REM 환경 변수 설정
set VERCEL_USER_AGENT=vercel-cli

REM GitHub으로 로그인
vercel login --github
```

또는:

```cmd
REM Email로 로그인
vercel login --email
```

### 방법 3: 토큰 기반 로그인

1. **토큰 생성**
   - https://vercel.com/account/tokens 접속
   - "Create Token" 클릭
   - 토큰 이름 입력 (예: "my-deploy-token")
   - "Create" 클릭
   - **토큰 복사** (다시 볼 수 없으니 꼭 저장!)

2. **토큰으로 배포**
```cmd
REM Git 초기화
git init
git add .
git commit -m "Deploy"

REM 토큰으로 배포 (YOUR_TOKEN을 복사한 토큰으로 교체)
vercel --token YOUR_TOKEN --prod --yes
```

---

## 🚀 단계별 실행 (방법 2)

### 1단계: 환경 변수 설정

```cmd
set VERCEL_USER_AGENT=vercel-cli/48.10.10
```

### 2단계: GitHub 로그인

```cmd
vercel login --github
```

브라우저가 열리면:
1. GitHub 계정으로 로그인
2. Vercel 권한 승인
3. 터미널로 돌아오기

### 3단계: Git 초기화

```cmd
git init
git add .
git commit -m "Deploy to Vercel"
```

### 4단계: 배포

```cmd
vercel --prod --yes
```

---

## 🎯 한 번에 실행

터미널(CMD)에서:

```cmd
set VERCEL_USER_AGENT=vercel-cli && vercel login --github && git init && git add . && git commit -m "Deploy" && vercel --prod --yes
```

---

## 💡 가장 쉬운 방법

### 옵션 A: 배치 파일

`deploy-fix-korean.bat` 더블클릭

### 옵션 B: 토큰 사용 (권장)

1. https://vercel.com/account/tokens 접속
2. 토큰 생성 및 복사
3. 터미널에서:

```cmd
git init
git add .
git commit -m "Deploy"
vercel --token [복사한_토큰] --prod --yes
```

---

## ⚠️ 중요

### 토큰 사용 시
- 토큰은 비밀번호처럼 중요합니다
- 절대 공유하지 마세요
- `.env.local`에 저장하지 마세요 (Git에 올라갈 수 있음)

### 환경 변수 설정 시
- CMD를 새로 열면 다시 설정해야 합니다
- 영구 설정하려면 시스템 환경 변수에 추가

---

## 🔍 문제 해결

### 여전히 같은 오류가 나오면

**토큰 방식 사용** (가장 확실):

1. https://vercel.com/account/tokens
2. 토큰 생성
3. 다음 명령어로 배포:

```cmd
vercel --token [YOUR_TOKEN] --prod --yes
```

### 다른 오류가 나오면

오류 메시지를 공유해주세요.

---

## ✅ 지금 실행

가장 빠른 방법:

**파일 탐색기에서 `deploy-fix-korean.bat` 더블클릭**


