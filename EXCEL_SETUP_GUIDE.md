# 📊 엑셀 파일 연동 가이드

"ending focast.xlsx" 파일의 데이터를 대시보드에 반영하는 방법입니다.

---

## 🚀 빠른 시작

### 1단계: xlsx 패키지 설치

**방법 1 - 배치 파일 실행 (추천):**
```
install-and-check.bat 파일을 더블클릭
```

**방법 2 - 수동 설치:**
```bash
npm install xlsx
npm run check-excel
```

### 2단계: 엑셀 파일 구조 확인

`npm run check-excel` 명령어를 실행하면 다음 정보를 확인할 수 있습니다:
- 시트 이름 목록
- 각 시트의 컬럼(열) 이름
- 샘플 데이터 (처음 3행)

### 3단계: API 수정 (필요시)

엑셀 파일의 실제 컬럼명에 맞게 `app/api/dashboard/route.ts` 파일을 수정합니다.

---

## 📋 엑셀 파일 구조 가이드

대시보드가 인식할 수 있는 컬럼명 예시:

### 월별 매출 데이터
| 컬럼명 옵션 | 설명 |
|------------|------|
| `월`, `Month`, `month` | 월 정보 (예: "1월", "Jan", "2025-01") |
| `매출`, `Sales`, `sales`, `실적` | 매출액 |
| `목표`, `Target`, `target`, `계획` | 목표액 |

### 지역별 데이터
| 컬럼명 옵션 | 설명 |
|------------|------|
| `지역`, `Region`, `region` | 지역명 (예: "서울", "부산") |
| `달성률`, `Achievement`, `달성도`, `%` | 목표 달성률 (%) |

### 판매 내역 데이터
| 컬럼명 옵션 | 설명 |
|------------|------|
| `고객명`, `Customer`, `customer`, `이름` | 고객 이름 |
| `상품`, `Product`, `product`, `품목` | 상품명 |
| `금액`, `Amount`, `amount`, `매출` | 거래 금액 |
| `상태`, `Status`, `status` | 거래 상태 ("완료", "처리중", "대기") |
| `날짜`, `Date`, `date` | 거래 날짜 |

---

## 🔧 컬럼명 매칭 수정하기

실제 엑셀 파일의 컬럼명이 다르다면 `app/api/dashboard/route.ts` 파일에서 수정:

### 예시 1: 월 컬럼명이 "Month"인 경우

```typescript
// 현재 코드
month: row['월'] || row['Month'] || row['month'] || '',

// "Month"만 사용하고 싶다면
month: row['Month'] || '',
```

### 예시 2: 매출 컬럼명이 "Revenue"인 경우

```typescript
// 현재 코드
매출: parseNumber(row['매출'] || row['Sales'] || row['sales'] || row['실적'] || 0),

// "Revenue" 추가
매출: parseNumber(row['매출'] || row['Sales'] || row['Revenue'] || 0),
```

### 예시 3: 커스텀 컬럼명 사용

```typescript
// 엑셀 컬럼이 "2025년 1월 실적"이라면
매출: parseNumber(row['2025년 1월 실적'] || 0),
```

---

## 📂 엑셀 파일 배치 위치

현재 엑셀 파일 위치:
```
프로젝트폴더/
  ├── ending focast.xlsx  ← 여기!
  ├── app/
  ├── components/
  └── ...
```

**다른 위치에 있다면?**

`app/api/dashboard/route.ts` 파일에서 경로 수정:

```typescript
// 현재
const excelData = readExcelFile("ending focast.xlsx");

// data 폴더에 있다면
const excelData = readExcelFile("data/ending focast.xlsx");

// 절대 경로
const excelData = readExcelFile("C:/Users/YourName/data/ending focast.xlsx");
```

---

## 🧪 테스트 방법

### 1. 엑셀 구조 확인
브라우저에서 접속:
```
http://localhost:3000/api/test-excel
```

다음과 같은 정보를 JSON으로 확인할 수 있습니다:
- 시트 이름
- 컬럼 목록
- 샘플 데이터

### 2. 대시보드 데이터 확인
```
http://localhost:3000/api/dashboard
```

실제로 대시보드에 표시될 데이터를 확인합니다.

### 3. 대시보드 확인
```
http://localhost:3000
```

최종 대시보드를 확인합니다!

---

## ⚠️ 문제 해결

### 문제 1: "엑셀 파일을 읽을 수 없습니다"

**원인:**
- 파일이 열려있거나 다른 프로그램에서 사용 중
- 파일 경로가 잘못됨
- 파일 이름 오타

**해결:**
1. 엑셀 파일을 닫습니다
2. 파일명이 정확한지 확인 (공백, 대소문자 포함)
3. 프로젝트 루트 디렉토리에 파일이 있는지 확인

### 문제 2: 데이터가 표시되지 않음

**원인:**
- 엑셀 컬럼명이 코드와 맞지 않음

**해결:**
1. `npm run check-excel` 실행
2. 실제 컬럼명 확인
3. `app/api/dashboard/route.ts`의 `convertExcelToDashboard` 함수 수정

### 문제 3: 날짜 형식이 이상함

**원인:**
- 엑셀의 날짜 포맷이 특수한 경우

**해결:**
`formatDate` 함수를 수정하여 커스텀 로직 추가

### 문제 4: 숫자가 0으로 표시됨

**원인:**
- 엑셀의 숫자에 특수 문자(공백, 쉼표 등)가 포함된 경우

**해결:**
`parseNumber` 함수가 자동으로 처리하지만, 필요시 수정 가능

---

## 💡 고급 기능

### 여러 시트 사용하기

```typescript
const excelData = readExcelFile("ending focast.xlsx");

// 특정 시트 선택
const salesSheet = excelData['매출'];
const targetSheet = excelData['목표'];

// 각각 처리
const monthlySales = processSalesData(salesSheet);
const regionalTargets = processTargetData(targetSheet);
```

### 데이터 필터링

```typescript
// 특정 월만 가져오기
const recentMonths = monthlySales.filter(item => 
  ['1월', '2월', '3월'].includes(item.month)
);

// 특정 지역만
const seoulData = regionalData.filter(item => 
  item.지역 === '서울'
);
```

### 데이터 정렬

```typescript
// 매출 높은 순으로
monthlySales.sort((a, b) => b.매출 - a.매출);

// 날짜 최신순으로
recentSales.sort((a, b) => 
  new Date(b.date).getTime() - new Date(a.date).getTime()
);
```

---

## 📝 엑셀 파일 템플릿

다음과 같은 구조로 엑셀을 작성하면 가장 잘 작동합니다:

### 시트 1: 월별 데이터
| 월 | 매출 | 목표 |
|----|------|------|
| 1월 | 85000000 | 80000000 |
| 2월 | 92000000 | 85000000 |
| 3월 | 78000000 | 90000000 |

### 시트 2: 지역별 데이터
| 지역 | 달성률 |
|------|--------|
| 서울 | 95 |
| 부산 | 87 |
| 대구 | 82 |

### 시트 3: 판매 내역
| 고객명 | 상품 | 금액 | 상태 | 날짜 |
|--------|------|------|------|------|
| 김철수 | 프리미엄 패키지 | 15000000 | 완료 | 2025-01-15 |
| 이영희 | 스탠다드 플랜 | 8500000 | 완료 | 2025-01-14 |

---

## 🔄 자동 업데이트 설정

엑셀 파일이 변경될 때마다 자동으로 반영하려면:

### 방법 1: 파일 감시 (개발 환경)

개발 서버(`npm run dev`)가 실행 중이면 파일 저장 시 자동으로 갱신됩니다.

### 방법 2: 새로고침 버튼 추가

대시보드에 새로고침 버튼을 추가하여 수동으로 갱신할 수 있습니다.

### 방법 3: 주기적 폴링

```typescript
// Dashboard.tsx에서
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData(); // 30초마다 갱신
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

---

## ❓ FAQ

**Q: 엑셀 파일을 다른 이름으로 바꿀 수 있나요?**
A: 네! `app/api/dashboard/route.ts`에서 파일명을 수정하면 됩니다.

**Q: CSV 파일도 사용할 수 있나요?**
A: 네! xlsx 라이브러리가 CSV도 지원합니다.

**Q: 엑셀이 클라우드에 있는 경우는?**
A: URL에서 파일을 다운로드한 후 처리하는 로직을 추가해야 합니다.

**Q: 보안은 어떻게 하나요?**
A: API 라우트에 인증 미들웨어를 추가하세요.

---

## 📞 도움이 필요하신가요?

문제가 해결되지 않으면:
1. `npm run check-excel` 결과를 확인하세요
2. 브라우저 콘솔(F12)에서 오류 메시지를 확인하세요
3. 터미널에서 서버 로그를 확인하세요

행운을 빕니다! 🎉


