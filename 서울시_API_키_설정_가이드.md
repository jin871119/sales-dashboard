# 서울시 실시간 도시데이터 API 키 설정 가이드

## ✅ 로컬 환경 설정 (완료)

`.env.local` 파일이 생성되었고 API 키가 설정되었습니다.

**설정된 값:**
- `NEXT_PUBLIC_SEOUL_RTD_API_KEY=667a56454b6a696e39395570517a74`
- `NEXT_PUBLIC_SEOUL_RTD_BASE_URL=http://openapi.seoul.go.kr:8088`

**다음 단계:**
1. 개발 서버 재시작 (`npm run dev`)
2. 브라우저에서 `/api/seoul-realtime?type=congestion` 확인
3. 콘솔에서 실제 API 데이터 로드 확인

---

## 🌐 Vercel 환경 변수 설정

### 방법 1: Vercel 대시보드에서 설정 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **환경 변수 설정**
   - Settings → Environment Variables 클릭
   - Add New 버튼 클릭
   - 다음 값 입력:
     - **Key**: `NEXT_PUBLIC_SEOUL_RTD_API_KEY`
     - **Value**: `667a56454b6a696e39395570517a74`
     - **Environment**: Production, Preview, Development 모두 선택
   - Save 클릭

3. **추가 환경 변수 (선택사항)**
   - **Key**: `NEXT_PUBLIC_SEOUL_RTD_BASE_URL`
   - **Value**: `http://openapi.seoul.go.kr:8088`
   - **Environment**: Production, Preview, Development 모두 선택

4. **재배포**
   - 환경 변수 변경 후 자동 재배포되거나
   - 수동으로 재배포: `vercel --prod`

### 방법 2: Vercel CLI로 설정

```bash
# 환경 변수 추가
vercel env add NEXT_PUBLIC_SEOUL_RTD_API_KEY production
# 값 입력: 667a56454b6a696e39395570517a74

vercel env add NEXT_PUBLIC_SEOUL_RTD_API_KEY preview
# 값 입력: 667a56454b6a696e39395570517a74

vercel env add NEXT_PUBLIC_SEOUL_RTD_API_KEY development
# 값 입력: 667a56454b6a696e39395570517a74

# 재배포
vercel --prod
```

---

## 🔍 확인 방법

### 로컬 환경
1. 개발 서버 재시작
2. 브라우저 콘솔에서 다음 메시지 확인:
   - `✅ 실제 API 호출 시작`
   - `✅ 총 X개 지역 데이터 수집 완료`
   - `isMockData: false` (목업 데이터가 아님)

### Vercel 환경
1. 배포 후 사이트 접속
2. 서울 실시간 대시보드 탭 확인
3. 목업 데이터 경고 메시지가 사라지고 실제 데이터가 표시되는지 확인

---

## ⚠️ 주의사항

1. **API 키 보안**
   - `.env.local` 파일은 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
   - Vercel 환경 변수는 암호화되어 저장됩니다

2. **API 호출 제한**
   - 서울시 API는 초당 1회 호출 제한이 있을 수 있습니다
   - 현재 코드는 요청 간 1.1초 딜레이를 포함합니다

3. **샘플 키 vs 실제 키**
   - 샘플 키: '광화문·덕수궁' 지역만 조회 가능
   - 실제 키: 모든 지역 조회 가능 (현재는 처음 10개만 호출)

---

## 🐛 문제 해결

### 여전히 목업 데이터가 표시되는 경우

1. **로컬 환경**
   - 개발 서버를 완전히 종료하고 재시작
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 브라우저 캐시 삭제

2. **Vercel 환경**
   - 환경 변수가 올바르게 설정되었는지 확인
   - 재배포 후 몇 분 기다림 (환경 변수 반영 시간)
   - Vercel 로그에서 환경 변수 로드 확인

### API 호출 실패

- 네트워크 연결 확인
- API 키 유효성 확인
- 서울시 API 서버 상태 확인
- 콘솔 로그에서 오류 메시지 확인




