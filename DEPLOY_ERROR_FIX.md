# 🔧 배포 오류 해결 가이드

## ❌ 일반적인 배포 오류 및 해결 방법

### 1. 빌드 오류 (Build Error)

**증상:**
```
Error: Build failed
Module not found
Type error
```

**해결 방법:**

#### A. 로컬에서 빌드 테스트
```bash
npm run build
```

#### B. 캐시 삭제 후 재시도
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### C. TypeScript 오류 확인
```bash
npm run lint
```

---

### 2. 파일 크기 제한 오류

**증상:**
```
Error: File too large
Maximum file size exceeded (50MB)
```

**해결 방법:**

#### A. JSON 파일 확인
```bash
# 파일 크기 확인
ls -lh public/*.json

# Windows
dir public\*.json
```

#### B. ending focast.xlsx 크기 확인
- 50MB 초과 시 JSON으로 변환 필요
```bash
node convert-ending-focast.js
```

#### C. .vercelignore 확인
- 불필요한 큰 파일 제외

---

### 3. 메모리 부족 오류

**증상:**
```
Error: Out of memory
Function exceeded memory limit
```

**해결 방법:**

`vercel.json`에서 이미 최대 메모리(3008MB)로 설정되어 있습니다.

---

### 4. 타임아웃 오류

**증상:**
```
Error: Function execution timeout
```

**해결 방법:**

`vercel.json`에서 이미 60초로 설정되어 있습니다.

---

### 5. 의존성 문제

**증상:**
```
Error: Cannot find module
Package not found
```

**해결 방법:**

```bash
# package.json 확인
cat package.json

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

---

### 6. next.config.js 설정 문제

**증상:**
```
Error: Invalid next.config.js
```

**해결 방법:**

`output: 'standalone'` 제거 (Vercel은 자체 빌드 시스템 사용)

---

## 🚀 배포 재시도 체크리스트

### 1단계: 로컬 빌드 테스트
```bash
npm run build
```
✅ **성공하면** 다음 단계로  
❌ **실패하면** 오류 메시지 확인 후 수정

### 2단계: 설정 파일 확인
- ✅ `next.config.js` - `output: 'standalone'` 제거됨
- ✅ `vercel.json` - 최적화됨
- ✅ `package.json` - 모든 의존성 포함

### 3단계: JSON 파일 확인
```bash
# 필수 파일 확인
ls public/backdata.json
ls public/weekly-sales-data.json
```

### 4단계: 배포 재시도
```bash
vercel --prod
```

---

## 🔍 Vercel 대시보드에서 오류 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **배포 로그 확인**
   - Deployments → 실패한 배포 클릭
   - Build Logs 확인
   - Function Logs 확인

3. **오류 메시지 복사**
   - 정확한 오류 메시지를 알려주시면 해결 도와드리겠습니다

---

## 💡 빠른 해결 방법

### 방법 1: 완전 초기화
```bash
# 1. 캐시 삭제
rm -rf .next node_modules package-lock.json

# 2. 재설치
npm install

# 3. 빌드 테스트
npm run build

# 4. 배포
vercel --prod
```

### 방법 2: 설정 최소화
```bash
# vercel.json을 최소 설정으로 변경
# (이미 최적화됨)
```

---

## 📋 배포 전 최종 체크리스트

- [ ] `npm run build` 성공
- [ ] `public/backdata.json` 존재
- [ ] `public/weekly-sales-data.json` 존재
- [ ] `ending focast.xlsx` 존재 (또는 JSON 변환됨)
- [ ] `next.config.js`에 `output: 'standalone'` 없음
- [ ] `vercel.json` 설정 확인
- [ ] TypeScript 오류 없음
- [ ] ESLint 오류 없음

---

## 🆘 여전히 문제가 있나요?

**정확한 오류 메시지를 알려주세요:**

1. **빌드 로그** (Vercel 대시보드에서 복사)
2. **로컬 빌드 결과** (`npm run build` 출력)
3. **오류 발생 단계** (빌드 중? 배포 중? 런타임?)

오류 메시지를 공유해주시면 정확한 해결 방법을 제시하겠습니다!





