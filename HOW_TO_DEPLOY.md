# 🚀 로컬 사이트를 Vercel에 배포하는 방법

## 현재 상황
- ✅ 로컬에서 http://localhost:3000/ 에서 정상 작동
- ✅ 배포 준비 완료

---

## 🎯 배포 방법 (2가지)

### 방법 1: GitHub 연동 (가장 추천! ⭐)

**장점:**
- ✅ CLI 오류 없음
- ✅ 자동 배포
- ✅ Git 푸시할 때마다 자동 업데이트

#### 단계:

**1단계: GitHub 저장소 생성**
1. https://github.com/new 접속
2. 저장소 이름: `sales-dashboard` (또는 원하는 이름)
3. "Create repository" 클릭

**2단계: 코드 푸시**
터미널에서:
```cmd
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/sales-dashboard.git
git branch -M main
git push -u origin main
```

**3단계: Vercel 연동**
1. https://vercel.com/dashboard 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택 (sales-dashboard)
4. "Import" 클릭
5. 자동 배포 시작!

**완료!** 🎉

---

### 방법 2: 직접 배포 (토큰 사용)

**장점:**
- ✅ 빠름
- ✅ GitHub 없이 가능

#### 단계:

**1단계: 토큰 생성**
1. https://vercel.com/account/tokens 접속
2. "Create Token" 클릭
3. 이름 입력 (예: `deploy-token`)
4. 토큰 복사 (vercel_로 시작)

**2단계: 배포 실행**
터미널에서:
```cmd
REM JSON 파일 생성
node prepare-deploy.js

REM Git 초기화
git init
git add .
git commit -m "Deploy to Vercel"

REM 배포
vercel --token [복사한_토큰] --prod --yes
```

---

## 🚀 빠른 배포 (한 번에)

### 옵션 A: GitHub 연동 (추천)

```cmd
git init
git add .
git commit -m "Deploy"
git remote add origin https://github.com/your-username/sales-dashboard.git
git push -u origin main
```

그 다음 Vercel 대시보드에서 Import

### 옵션 B: 토큰 배포

```cmd
node prepare-deploy.js
git init
git add .
git commit -m "Deploy"
vercel --token YOUR_TOKEN --prod --yes
```

---

## 📋 배포 전 체크리스트

- [ ] `npm run build` 성공
- [ ] `public/backdata.json` 존재
- [ ] `public/weekly-sales-data.json` 존재
- [ ] `public/weekly-meeting-data.json` 존재
- [ ] `ending focast.xlsx` 존재 (또는 JSON)

---

## 💡 가장 쉬운 방법

### GitHub 연동 (1회 설정, 이후 자동)

1. **GitHub 저장소 생성**
2. **코드 푸시**
3. **Vercel에서 Import**

이후 Git 푸시할 때마다 자동 배포됩니다!

---

## 🎯 지금 바로 시작

어떤 방법을 선택하시겠어요?

1. **GitHub 연동** (가장 안정적) → `deploy-github.bat` 실행
2. **토큰 배포** (빠름) → `deploy-token-only.bat` 실행

