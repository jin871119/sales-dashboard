# Vercel 배포 가이드

## 🚀 빠른 배포

### 1단계: 배포 준비 (엑셀 → JSON 변환)

**방법 A: 배치 파일 실행**
```bash
prepare-deploy.bat
```

**방법 B: 터미널에서 실행**
```bash
node prepare-deploy.js
```

이 과정에서:
- `backdata.xlsx` → `public/backdata.json`
- `mw_일주월별_판매.xlsx` → `public/weekly-sales-data.json`
- `ending focast.xlsx`는 그대로 유지

### 2단계: 빌드 테스트

```bash
npm run build
```

빌드 오류가 없으면 다음 단계로 진행합니다.

### 3단계: Vercel 배포

**Vercel CLI가 설치되어 있지 않다면:**
```bash
npm install -g vercel
```

**배포 실행:**
```bash
vercel --prod
```

**또는 한 번에:**
```bash
npm run deploy
```

---

## 📋 배포 체크리스트

### 배포 전 확인사항

- [ ] 모든 엑셀 파일이 최신 데이터로 업데이트됨
- [ ] `prepare-deploy.js` 실행 완료
- [ ] `public/backdata.json` 파일 생성됨
- [ ] `public/weekly-sales-data.json` 파일 생성됨
- [ ] `npm run build` 성공
- [ ] Vercel CLI 설치됨

### 배포 후 확인사항

- [ ] Vercel 대시보드에서 배포 상태 확인
- [ ] 배포된 URL 접속 테스트
- [ ] 23일까지 데이터 표시 확인
- [ ] 모든 차트 정상 작동 확인

---

## 🔧 Vercel 설정 파일

### `vercel.json`
- 서울 리전(icn1) 사용
- API 메모리: 1024MB
- 최대 실행 시간: 60초

### `.vercelignore`
- 로컬 엑셀 파일 제외 (JSON만 업로드)
- 분석 스크립트 제외
- Node modules 제외 (자동 설치)

---

## ⚠️ 주의사항

1. **엑셀 파일 크기**
   - Vercel의 파일 크기 제한: 50MB
   - JSON 변환 후 크기가 크면 최적화 필요

2. **ending focast.xlsx**
   - 이 파일은 엑셀 형태로 배포됩니다
   - 파일이 너무 크면 Vercel 제한에 걸릴 수 있습니다

3. **데이터 업데이트**
   - 데이터 업데이트 시 `prepare-deploy.js` 재실행 필요
   - 재배포 필요

---

## 🔄 데이터 업데이트 후 재배포

```bash
# 1. 엑셀 파일 업데이트 (파일을 새 버전으로 교체)

# 2. JSON 변환
node prepare-deploy.js

# 3. 재배포
vercel --prod
```

---

## 🆘 문제 해결

### 빌드 오류 발생
```bash
# 캐시 삭제 후 재시도
rm -rf .next
npm run build
```

### Vercel CLI 로그인
```bash
vercel login
```

### 배포 로그 확인
```bash
vercel logs [deployment-url]
```

### 로컬 테스트
```bash
npm run build
npm run start
```

---

## 📊 Vercel 환경 변수 (필요시)

Vercel 대시보드에서 환경 변수 설정:

```
# 없음 (현재 프로젝트는 환경 변수 불필요)
```

---

## 🌐 배포 URL

배포 후 Vercel이 제공하는 URL:
- Production: `https://your-project.vercel.app`
- Preview: 각 커밋마다 자동 생성

---

## 💡 팁

1. **Git과 연동**: Vercel을 Git 저장소와 연동하면 푸시할 때마다 자동 배포
2. **도메인 연결**: Vercel 대시보드에서 커스텀 도메인 연결 가능
3. **환경별 배포**: 개발/스테이징/프로덕션 환경 분리 가능





