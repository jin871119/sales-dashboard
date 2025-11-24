# 🚀 Vercel 배포 대안 방법

## 현재 문제
`.vercel` 폴더 설정 오류가 계속 발생합니다.

---

## ✅ 해결 방법 (3가지)

### 방법 1: GitHub 연동 자동 배포 (가장 추천!)

Vercel은 GitHub 연동이 가장 안정적입니다.

#### 1단계: GitHub에 코드 푸시
```cmd
git remote -v
```

원격 저장소가 없으면:
```cmd
REM GitHub 저장소 생성 후
git remote add origin https://github.com/your-username/sales-dashboard.git
git push -u origin main
```

#### 2단계: Vercel 대시보드에서 연동
1. https://vercel.com/dashboard 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. "Import" 클릭
5. 자동 배포 시작!

**장점:**
- ✅ CLI 오류 없음
- ✅ 자동 배포
- ✅ Git 푸시할 때마다 자동 업데이트

---

### 방법 2: Vercel 대시보드에서 직접 배포

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **"Add New..." → "Project" 클릭**

3. **"Browse" 또는 "Drag & Drop"**
   - 프로젝트 폴더를 드래그 앤 드롭
   - 또는 "Browse"로 폴더 선택

4. **설정 확인**
   - Framework: Next.js (자동 감지)
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

5. **"Deploy" 클릭**

---

### 방법 3: vercel unlink 후 재배포

터미널에서:

```cmd
REM 1. 완전 초기화
if exist .vercel rmdir /s /q .vercel
vercel unlink

REM 2. 프로젝트 이름 지정하여 배포
vercel --token v1wibOwakOLEXIzvDcTaKypl --prod --yes --name sales-dashboard
```

---

## 🎯 가장 추천하는 방법

### GitHub 연동 (방법 1)

**이유:**
- CLI 오류 없음
- 자동 배포
- 가장 안정적

**단계:**

1. **GitHub 저장소 생성**
   - https://github.com/new
   - 저장소 이름: `sales-dashboard`
   - "Create repository" 클릭

2. **코드 푸시**
```cmd
git remote add origin https://github.com/your-username/sales-dashboard.git
git branch -M main
git push -u origin main
```

3. **Vercel 연동**
   - https://vercel.com/dashboard
   - "Add New..." → "Project"
   - GitHub 저장소 선택
   - "Import"

---

## 🔍 현재 오류 확인

어떤 오류 메시지가 나오나요?

터미널의 오류 메시지를 복사해서 알려주시면 정확한 해결책을 제시하겠습니다.

---

## 💡 빠른 해결

**지금 바로 시도:**

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **"Add New..." → "Project"**

3. **프로젝트 폴더 드래그 앤 드롭**

4. **"Deploy" 클릭**

이 방법은 CLI를 사용하지 않아서 오류가 없습니다!


