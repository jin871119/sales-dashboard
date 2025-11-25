# 🚀 최종 배포 가이드

## ✅ 모든 오류 수정 완료!

- ✅ TypeScript 오류 수정
- ✅ 프로덕션 환경 엑셀 파일 접근 오류 수정
- ✅ JSON 파일 우선 읽기 로직 추가

---

## 📋 배포 전 체크리스트

### 1. JSON 파일 확인

다음 파일들이 있어야 합니다:
- ✅ `public/backdata.json`
- ✅ `public/weekly-sales-data.json`

**없다면 생성:**
```bash
node prepare-deploy.js
```

### 2. 빌드 테스트

```bash
npm run build
```

**성공하면** 다음 단계로 진행  
**실패하면** 오류 메시지 확인

---

## 🚀 배포 실행

### 방법 1: 한 번에 실행 (추천)

```bash
npm run build && vercel --prod
```

### 방법 2: 단계별 실행

```bash
# 1. 빌드
npm run build

# 2. Vercel CLI 설치 (처음만)
npm install -g vercel

# 3. 로그인 (처음만)
vercel login

# 4. 배포
vercel --prod
```

---

## 📊 배포 과정

### 1단계: 빌드
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

### 2단계: Vercel 배포
```
? Set up and deploy? (Y/n) → Y
? Which scope? → 본인 계정 선택
? Link to existing project? (y/N) → N (처음 배포)
? Project name? → Enter (기본값) 또는 원하는 이름
? Directory? → Enter (현재 디렉토리)
```

### 3단계: 배포 완료
```
✅ Production: https://your-project.vercel.app
```

---

## 🎉 배포 후 확인

1. **배포 URL 접속**
   - Vercel이 제공하는 URL로 접속
   - 예: `https://your-project.vercel.app`

2. **대시보드 테스트**
   - 23일까지 데이터 표시 확인
   - 모든 차트 정상 작동 확인
   - 상권별/팀별/유통별 데이터 확인

3. **Vercel 대시보드**
   - https://vercel.com/dashboard
   - 배포 상태 확인
   - 로그 확인

---

## ⚠️ 문제 발생 시

### 빌드 실패
```bash
# 캐시 삭제 후 재시도
rm -rf .next
npm run build
```

### JSON 파일 없음
```bash
# JSON 파일 생성
node prepare-deploy.js
```

### Vercel CLI 오류
```bash
# 재설치
npm uninstall -g vercel
npm install -g vercel
```

---

## 🎯 지금 바로 배포!

터미널에서 실행:

```bash
npm run build && vercel --prod
```

또는:

```bash
deploy-now.bat
```

---

## 📝 참고

- **프로덕션 환경**: JSON 파일만 사용 (엑셀 파일 접근 안 함)
- **로컬 개발**: 엑셀 파일 직접 읽기 가능
- **데이터 업데이트**: `prepare-deploy.js` 실행 후 재배포





