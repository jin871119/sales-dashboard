# 🔍 배포된 사이트 문제 진단

## ❓ 현재 상황
URL: https://sales-dashboard-gamma-three.vercel.app/
문제: 사이트가 안 나옴

---

## 🔍 확인 사항

### 1. 어떤 화면이 보이나요?

#### A. 빈 화면 (흰색 페이지)
→ JavaScript 오류 가능성

#### B. "404 Not Found"
→ 라우팅 문제

#### C. "500 Internal Server Error"
→ 서버 오류

#### D. 로딩만 계속
→ API 오류 가능성

#### E. 오류 메시지
→ 어떤 메시지인지 확인

---

## 🚀 빠른 진단

### 브라우저에서 확인

1. **URL 접속**
   - https://sales-dashboard-gamma-three.vercel.app/

2. **F12 (개발자 도구) 열기**
   - Console 탭 확인
   - 빨간색 오류 메시지 확인
   - Network 탭 확인
   - `/api/dashboard` 요청 상태 확인

3. **오류 메시지 복사**
   - Console의 빨간색 오류
   - Network 탭의 실패한 요청

---

## 🔧 Vercel 대시보드에서 확인

1. **https://vercel.com/dashboard** 접속
2. **프로젝트 클릭** (sales-dashboard-gamma-three)
3. **Deployments 탭**
4. **최근 배포 클릭**
5. **"View Function Logs"** 클릭
6. **오류 메시지 확인**

---

## 💡 일반적인 문제 및 해결

### 문제 1: "Cannot find module"
**원인:** 의존성 문제

**해결:**
- Vercel 대시보드 → Settings → Environment Variables 확인
- 재배포

### 문제 2: "File not found"
**원인:** JSON 파일 누락

**해결:**
```cmd
node prepare-deploy.js
git add .
git commit -m "Add JSON files"
vercel --prod
```

### 문제 3: API 오류
**원인:** 데이터 파일 경로 문제

**해결:**
- `public/backdata.json` 존재 확인
- `public/weekly-sales-data.json` 존재 확인
- `public/weekly-meeting-data.json` 존재 확인

### 문제 4: 빌드 오류
**원인:** TypeScript 오류

**해결:**
- 로컬에서 `npm run build` 테스트
- 오류 수정 후 재배포

---

## 📋 현재 상태 알려주세요

다음 중 어떤 상황인가요?

1. **빈 화면** → Console 오류 확인
2. **404 오류** → 라우팅 문제
3. **500 오류** → 서버 오류 (Function Logs 확인)
4. **로딩만 계속** → API 오류 (Network 탭 확인)
5. **오류 메시지** → 메시지 내용 알려주세요

---

## 🎯 즉시 확인

### 브라우저에서
1. F12 열기
2. Console 탭 확인
3. 오류 메시지 알려주세요

### Vercel 대시보드에서
1. 프로젝트 → Deployments
2. 최근 배포 → Function Logs
3. 오류 메시지 알려주세요

---

## 💬 알려주세요

어떤 화면이 보이나요?
- 빈 화면?
- 오류 메시지?
- 로딩만 계속?

그리고 F12 Console 탭의 오류 메시지를 알려주시면 정확한 해결 방법을 제시하겠습니다!


