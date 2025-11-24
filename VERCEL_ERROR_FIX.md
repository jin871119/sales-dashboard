# 🔧 Vercel 배포 오류 해결

## ❌ 문제: "Set up and deploy"에서 Y 누르면 바로 종료

### 원인
프로젝트 경로에 한글 문자가 있어서 Vercel CLI가 오류를 일으킬 수 있습니다.
```
~\AI\영업대쉬보드
     ^^^^^^^ 한글 문자
```

---

## ✅ 해결 방법

### 방법 1: Git 저장소 초기화 (빠른 해결)

1. **Git 저장소 초기화**
```cmd
git init
git add .
git commit -m "Initial commit"
```

2. **다시 배포**
```cmd
vercel --prod
```

### 방법 2: 디버그 모드로 실행

`deploy-debug.bat` 파일 실행

또는 터미널에서:
```cmd
vercel --debug --prod
```

### 방법 3: 프로젝트 경로 변경 (권장)

한글 경로가 문제라면 영문 경로로 복사:

```cmd
REM 1. 상위 폴더로 이동
cd ..

REM 2. 영문 이름으로 복사
xcopy /E /I "영업대쉬보드" "sales-dashboard"

REM 3. 새 폴더로 이동
cd sales-dashboard

REM 4. 배포
vercel --prod
```

### 방법 4: Vercel CLI 재인증

```cmd
REM 1. 로그아웃
vercel logout

REM 2. 재로그인
vercel login

REM 3. 배포
vercel --prod
```

---

## 🚀 단계별 배포 (권장)

### 1단계: Git 저장소 확인

```cmd
git init
git add .
git commit -m "Deploy to Vercel"
```

### 2단계: Vercel 로그인 확인

```cmd
vercel whoami
```

로그인되어 있지 않으면:
```cmd
vercel login
```

### 3단계: 배포 (비대화형 모드)

```cmd
vercel --prod --yes
```

`--yes` 옵션으로 모든 질문에 자동으로 Y 응답

---

## 🔍 오류 확인 방법

### 디버그 모드로 실행

```cmd
vercel --debug --prod
```

자세한 오류 메시지를 확인하고 공유해주세요.

---

## 💡 빠른 해결 (추천 순서)

### 1순위: Git 초기화 + 자동 배포

```cmd
REM Git 저장소 초기화
git init
git add .
git commit -m "Deploy"

REM 자동 배포
vercel --prod --yes
```

### 2순위: 디버그 모드

```cmd
deploy-debug.bat
```

### 3순위: 영문 경로로 복사

프로젝트를 `C:\projects\sales-dashboard` 같은 영문 경로로 복사

---

## ⚠️ 주의사항

1. **Git 저장소 필요**
   - Vercel은 Git 저장소를 선호합니다
   - `.git` 폴더가 없으면 초기화 필요

2. **경로 문제**
   - 한글 경로는 일부 도구에서 문제 발생
   - 가능하면 영문 경로 사용

3. **인증 문제**
   - `vercel whoami`로 로그인 상태 확인
   - 필요시 `vercel login` 재실행

---

## 🎯 지금 바로 시도

### 방법 A: 자동 배포 (Git 포함)

터미널에서:
```cmd
git init && git add . && git commit -m "Deploy" && vercel --prod --yes
```

### 방법 B: 디버그 배치 파일

파일 탐색기에서 `deploy-debug.bat` 더블클릭

---

## 📋 오류 메시지 공유

위 방법으로도 안 되면 다음 정보를 공유해주세요:

1. `vercel --debug --prod` 실행 결과
2. `git status` 실행 결과
3. `vercel whoami` 실행 결과

