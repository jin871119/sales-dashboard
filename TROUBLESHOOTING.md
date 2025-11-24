# 🔧 Vercel 배포 문제 해결 가이드

## ❌ 일반적인 배포 오류 및 해결 방법

### 1. 빌드 오류 (Build Error)

**증상:**
```
Error: Build failed
Module not found
```

**해결 방법:**
```bash
# 1. 캐시 삭제
rm -rf .next
rm -rf node_modules

# 2. 패키지 재설치
npm install

# 3. 로컬 빌드 테스트
npm run build
```

---

### 2. 파일 크기 제한 오류

**증상:**
```
Error: File too large
Maximum file size exceeded
```

**해결 방법:**

#### 방법 A: ending focast.xlsx를 JSON으로 변환

`ending focast.xlsx` 파일이 50MB를 초과하면 JSON으로 변환해야 합니다:

1. `convert-ending-focast.js` 스크립트 생성 (아래 참조)
2. 실행하여 JSON 변환
3. 코드 수정하여 JSON 읽기

#### 방법 B: 파일 최적화

엑셀 파일에서 불필요한 데이터 제거:
- 빈 행/열 삭제
- 불필요한 시트 삭제
- 데이터 압축

---

### 3. 메모리 부족 오류

**증상:**
```
Error: Out of memory
Function exceeded memory limit
```

**해결 방법:**

`vercel.json`에서 메모리 증가:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 3008,  // 최대값
      "maxDuration": 60
    }
  }
}
```

---

### 4. 타임아웃 오류

**증상:**
```
Error: Function execution timeout
```

**해결 방법:**

1. 데이터 로딩 최적화
2. 캐싱 추가
3. 배치 처리로 분할

---

### 5. JSON 파싱 오류

**증상:**
```
Error: Unexpected token
JSON parse error
```

**해결 방법:**

1. JSON 파일 재생성:
```bash
node prepare-deploy.js
```

2. JSON 파일 유효성 검사:
```bash
node -e "JSON.parse(require('fs').readFileSync('public/backdata.json', 'utf8'))"
```

---

### 6. 엑셀 파일을 찾을 수 없음

**증상:**
```
Error: File not found
ending focast.xlsx not found
```

**해결 방법:**

1. 파일이 프로젝트 루트에 있는지 확인
2. `.vercelignore`에서 제외되지 않았는지 확인
3. Git에 커밋되어 있는지 확인

---

## 🚀 배포 체크리스트

배포 전 다음을 확인하세요:

- [ ] `npm run build` 성공
- [ ] `public/backdata.json` 파일 존재
- [ ] `public/weekly-sales-data.json` 파일 존재
- [ ] `ending focast.xlsx` 파일 크기 < 50MB
- [ ] 모든 의존성 설치됨
- [ ] TypeScript 오류 없음
- [ ] ESLint 오류 없음

---

## 📊 파일 크기 확인

```bash
# Windows
dir /s *.xlsx
dir /s public\*.json

# Linux/Mac
du -sh *.xlsx
du -sh public/*.json
```

**권장 크기:**
- 각 JSON 파일: < 10MB
- ending focast.xlsx: < 50MB
- 전체 프로젝트: < 100MB

---

## 🔄 배포 재시도

배포 실패 시:

1. **Vercel 대시보드에서 로그 확인**
   - Build Logs
   - Function Logs
   - Runtime Logs

2. **로컬에서 재현**
   ```bash
   npm run build
   npm run start
   ```

3. **점진적 배포**
   - 먼저 작은 변경사항만 배포
   - 문제가 있는 부분 제거 후 배포
   - 점진적으로 기능 추가

---

## 💡 최적화 팁

### 1. 데이터 최적화
- 불필요한 데이터 제거
- 중복 데이터 제거
- 데이터 압축

### 2. 코드 최적화
- 동적 import 사용
- 코드 스플리팅
- 이미지 최적화

### 3. 캐싱
- API 응답 캐싱
- 정적 데이터 캐싱
- CDN 활용

---

## 🆘 여전히 문제가 있나요?

1. **Vercel 로그 확인**
   - Vercel 대시보드 → Deployments → Logs

2. **로컬 빌드 확인**
   ```bash
   npm run build
   ```

3. **에러 메시지 공유**
   - 정확한 에러 메시지
   - 빌드 로그
   - 배포 설정


