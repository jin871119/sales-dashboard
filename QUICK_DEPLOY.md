# 🚀 빠른 배포 가이드

## ✅ 배포 준비 완료!

모든 설정이 완료되었습니다. 다음 단계만 수행하세요:

---

## 📋 배포 단계

### 1단계: 배포 준비 확인

필수 파일 확인:
- ✅ `public/backdata.json` - 준비됨
- ✅ `public/weekly-sales-data.json` - 준비됨  
- ✅ `ending focast.xlsx` - 준비됨

### 2단계: 빌드 테스트

터미널에서 실행:

```bash
npm run build
```

**성공하면** 다음 단계로 진행  
**실패하면** 오류 메시지를 확인하고 수정

### 3단계: Vercel CLI 설치 (처음만)

```bash
npm install -g vercel
```

### 4단계: Vercel 로그인 (처음만)

```bash
vercel login
```

브라우저가 열리면 로그인하세요.

### 5단계: 배포 실행

```bash
vercel --prod
```

또는 배치 파일 실행:
```bash
deploy.bat
```

---

## 🎯 한 번에 실행

터미널에서 순서대로:

```bash
# 1. 빌드 테스트
npm run build

# 2. Vercel CLI 설치 (처음만)
npm install -g vercel

# 3. 로그인 (처음만)
vercel login

# 4. 배포
vercel --prod
```

---

## ⚠️ 문제 해결

### 빌드 실패
```bash
# 캐시 삭제 후 재시도
rm -rf .next
npm run build
```

### Vercel CLI 오류
```bash
# 재설치
npm uninstall -g vercel
npm install -g vercel
```

### 파일 크기 오류
- `ending focast.xlsx`가 50MB 초과하면 `node convert-ending-focast.js` 실행

---

## 📊 배포 후 확인

1. **Vercel 대시보드** 접속
   - https://vercel.com/dashboard
   - 배포 상태 확인

2. **배포된 URL** 접속
   - Vercel이 제공하는 URL로 접속
   - 대시보드 정상 작동 확인

3. **데이터 확인**
   - 23일까지 데이터 표시 확인
   - 모든 차트 정상 작동 확인

---

## 🎉 완료!

배포가 성공하면 Vercel이 URL을 제공합니다:
- Production: `https://your-project.vercel.app`
- 각 커밋마다 Preview URL 자동 생성





