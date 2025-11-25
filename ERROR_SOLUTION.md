# 🔧 배포 오류 해결 가이드

## ❓ 어떤 오류가 발생했나요?

오류 메시지를 알려주시면 정확한 해결 방법을 제시하겠습니다.

---

## 🔍 일반적인 오류 및 해결

### 오류 1: "Cannot find module 'xlsx'"
**원인:** xlsx 패키지 미설치

**해결:**
```cmd
npm install xlsx
```

### 오류 2: "Cannot access file ... ending focast.xlsx"
**원인:** 엑셀 파일이 열려있거나 경로 문제

**해결:**
1. 엑셀 파일 닫기
2. 파일이 프로젝트 루트에 있는지 확인

### 오류 3: "Git commit failed"
**원인:** Git 설정 문제

**해결:**
```cmd
git config user.name "Your Name"
git config user.email "your@email.com"
```

### 오류 4: "Build failed"
**원인:** TypeScript 또는 의존성 오류

**해결:**
```cmd
npm run build
```
오류 메시지 확인 후 수정

### 오류 5: "Vercel deployment failed"
**원인:** 배포 설정 문제

**해결:**
```cmd
if exist .vercel rmdir /s /q .vercel
vercel --token YOUR_TOKEN --prod --yes
```

---

## 🚀 단계별 진단

### 1단계: JSON 변환 확인
```cmd
node prepare-deploy.js
```
오류가 나오면 오류 메시지 확인

### 2단계: 빌드 확인
```cmd
npm run build
```
오류가 나오면 오류 메시지 확인

### 3단계: 배포 확인
```cmd
vercel --token YOUR_TOKEN --prod --yes
```
오류가 나오면 오류 메시지 확인

---

## 📋 오류 메시지 공유

다음 정보를 알려주세요:

1. **어느 단계에서 오류가 발생했나요?**
   - JSON 변환 중?
   - 빌드 중?
   - 배포 중?

2. **오류 메시지**
   - 터미널의 빨간색 오류 메시지
   - "Error:" 로 시작하는 줄

3. **전체 로그**
   - 가능하면 터미널 전체 내용

---

## 💡 빠른 진단

**배치 파일 실행:**
파일 탐색기에서 `diagnose-error.bat` 더블클릭

이 스크립트가 각 단계를 테스트하고 오류 위치를 찾아줍니다.

---

## 🔧 즉시 확인

터미널에서 다음을 실행하고 결과를 알려주세요:

```cmd
node prepare-deploy.js
```

오류 메시지를 복사해서 알려주시면 정확한 해결 방법을 제시하겠습니다!





