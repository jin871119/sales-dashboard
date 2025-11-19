# 📊 데이터 업데이트 가이드

대시보드의 데이터를 업데이트하는 방법을 설명합니다.

---

## 🎯 방법 1: API 라우트에서 직접 수정 (간단)

### 위치: `app/api/dashboard/route.ts`

이 파일에서 모든 데이터를 중앙 관리합니다. 데이터를 수정하려면 이 파일만 편집하면 됩니다!

```typescript
// app/api/dashboard/route.ts 파일 편집

export async function GET() {
  const data = {
    // 1️⃣ KPI 데이터 수정
    kpis: {
      totalSales: {
        value: "₩1,234,567,890",  // ← 여기를 수정
        change: "+12.5%",          // ← 여기를 수정
        trend: "up",               // "up" 또는 "down"
      },
      targetRate: {
        value: "87.3%",
        change: "+5.2%",
        trend: "up",
      },
      // ... 나머지
    },

    // 2️⃣ 월별 매출 데이터 수정
    monthlySales: [
      { month: "1월", 매출: 85000000, 목표: 80000000 },  // ← 숫자 수정
      { month: "2월", 매출: 92000000, 목표: 85000000 },
      // ... 원하는 달 추가/삭제 가능
    ],

    // 3️⃣ 지역별 데이터 수정
    regionalTargets: [
      { 지역: "서울", 달성률: 95, 목표: 100 },  // ← 숫자 수정
      { 지역: "부산", 달성률: 87, 목표: 100 },
      // ... 지역 추가/삭제 가능
    ],

    // 4️⃣ 최근 판매 내역 수정
    recentSales: [
      {
        id: 1,
        customer: "김철수",              // ← 고객명
        product: "프리미엄 패키지",       // ← 상품명
        amount: "₩15,000,000",          // ← 금액
        status: "완료",                  // "완료", "처리중", "대기" 중 하나
        date: "2025-01-15",             // ← 날짜
      },
      // ... 거래 내역 추가/삭제 가능
    ],
  };

  return NextResponse.json(data);
}
```

### 수정 후 확인 방법:
1. 파일을 저장합니다
2. 브라우저를 새로고침합니다 (F5)
3. 변경된 데이터가 대시보드에 표시됩니다! ✨

---

## 🚀 방법 2: 실제 데이터베이스 연동

실제 프로젝트에서는 데이터베이스나 외부 API를 연동합니다.

### 예시 1: 데이터베이스 연동 (PostgreSQL)

```typescript
// app/api/dashboard/route.ts

import { sql } from '@vercel/postgres';

export async function GET() {
  // 데이터베이스에서 실제 데이터 조회
  const salesData = await sql`
    SELECT 
      month,
      SUM(amount) as 매출,
      target as 목표
    FROM sales
    WHERE year = 2025
    GROUP BY month, target
    ORDER BY month
  `;

  const data = {
    monthlySales: salesData.rows,
    // ... 나머지 데이터
  };

  return NextResponse.json(data);
}
```

### 예시 2: 외부 API 연동

```typescript
// app/api/dashboard/route.ts

export async function GET() {
  // 외부 API에서 데이터 가져오기
  const response = await fetch('https://your-api.com/sales-data');
  const externalData = await response.json();

  const data = {
    kpis: externalData.kpis,
    monthlySales: externalData.sales,
    // ... 변환 로직
  };

  return NextResponse.json(data);
}
```

### 예시 3: Excel/CSV 파일에서 읽기

```typescript
// app/api/dashboard/route.ts

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

export async function GET() {
  // CSV 파일 읽기
  const fileContent = readFileSync('./data/sales.csv', 'utf-8');
  const records = parse(fileContent, { columns: true });

  const monthlySales = records.map(row => ({
    month: row.month,
    매출: parseInt(row.sales),
    목표: parseInt(row.target),
  }));

  const data = {
    monthlySales,
    // ... 나머지 데이터
  };

  return NextResponse.json(data);
}
```

---

## 🔄 방법 3: 정기적 자동 업데이트

매일 자동으로 데이터를 업데이트하려면:

### Vercel Cron Jobs 사용

```typescript
// app/api/cron/update-dashboard/route.ts

export async function GET(request: Request) {
  // Cron 보안 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 데이터베이스 업데이트 로직
  await updateDashboardData();

  return Response.json({ success: true });
}
```

`vercel.json` 파일 추가:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-dashboard",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 📝 데이터 구조 참고

### KPI 데이터 형식
```typescript
{
  value: string;    // 표시할 값 (예: "₩1,234,567,890")
  change: string;   // 변화율 (예: "+12.5%")
  trend: "up" | "down";  // 상승/하락
}
```

### 월별 매출 데이터 형식
```typescript
{
  month: string;    // 월 (예: "1월")
  매출: number;     // 매출액 (예: 85000000)
  목표: number;     // 목표액 (예: 80000000)
}
```

### 지역별 데이터 형식
```typescript
{
  지역: string;     // 지역명 (예: "서울")
  달성률: number;   // 달성률 % (예: 95)
  목표: number;     // 목표 % (예: 100)
}
```

### 판매 내역 데이터 형식
```typescript
{
  id: number;                           // 고유 ID
  customer: string;                     // 고객명
  product: string;                      // 상품명
  amount: string;                       // 금액 (예: "₩15,000,000")
  status: "완료" | "처리중" | "대기";   // 상태
  date: string;                         // 날짜 (YYYY-MM-DD)
}
```

---

## 🛠️ 직접 테스트해보기

### 1. API 응답 확인
브라우저에서 다음 주소로 접속:
```
http://localhost:3000/api/dashboard
```

현재 반환되는 JSON 데이터를 확인할 수 있습니다.

### 2. 데이터 수정 테스트
1. `app/api/dashboard/route.ts` 파일을 엽니다
2. 아무 값이나 수정합니다 (예: 매출 금액 변경)
3. 파일을 저장합니다
4. 브라우저에서 대시보드를 새로고침합니다
5. 변경사항이 즉시 반영됩니다! ✅

---

## 💡 팁

### 1. 실시간 업데이트
10초마다 자동 새로고침하려면 `Dashboard.tsx`에 추가:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 10000); // 10초마다 갱신

  return () => clearInterval(interval);
}, []);
```

### 2. 날짜 필터링
특정 기간의 데이터만 보려면 API에 쿼리 파라미터 추가:

```typescript
// 사용: /api/dashboard?start=2025-01&end=2025-06
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  
  // start, end 기반으로 데이터 필터링
  // ...
}
```

### 3. 사용자 인증
민감한 데이터는 인증을 추가:

```typescript
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 인증된 사용자만 데이터 조회 가능
  // ...
}
```

---

## ❓ 자주 묻는 질문

### Q: 데이터 수정 후 바로 반영되나요?
A: 네! API 파일을 수정하고 저장하면 브라우저 새로고침으로 즉시 확인 가능합니다.

### Q: 차트에 12개월 데이터를 표시하려면?
A: `monthlySales` 배열에 12개 항목을 추가하면 됩니다.

### Q: 여러 사용자가 다른 데이터를 보려면?
A: API에서 사용자 ID를 받아 각 사용자별로 다른 데이터를 반환하도록 구현합니다.

### Q: 엑셀 파일에서 직접 데이터를 읽을 수 있나요?
A: 네! xlsx 라이브러리를 설치하고 위의 "예시 3"을 참고하세요.

---

## 🎉 시작하기

가장 쉬운 방법:
1. `app/api/dashboard/route.ts` 파일을 엽니다
2. 숫자나 텍스트를 원하는 값으로 수정합니다
3. 저장하고 브라우저를 새로고침합니다!

그게 전부입니다! 😊


