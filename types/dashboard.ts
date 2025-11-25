export interface KPIData {
  value: string;
  change: string;
  trend: "up" | "down";
}

export interface KPIs {
  salesTarget: KPIData;   // 매출목표 (H7)
  periodPerformance?: KPIData; // 실적 (Q7)
  lastYearPeriod?: KPIData;     // 전년실적 (R7)
  periodGrowthRate?: KPIData;  // 전년비 (S7)
  forecast: KPIData;       // 예상마감 (I7)
  forecastAchievementRate?: KPIData; // 예상달성율 (J7)
  lastYear?: KPIData;       // 전년실적 (K7) - 레거시
  growthRate?: KPIData;     // 신장율 - 레거시
}

export interface MonthlySales {
  month: string;
  매출: number;
  목표: number;
  작년실적: number;
  신장율: number;
}

export interface WeeklySales {
  week: string;
  금년: number;
  전년: number;
  신장율: number;
}

export interface RegionalTarget {
  지역: string;
  달성률: number;
  목표: number;
}

export interface Sale {
  id: number;
  customer: string;
  product: string;
  amount: string;
  status: "완료" | "처리중" | "대기";
  date: string;
}

export interface StorePerformance {
  storeName: string;
  nov2025: number;
  nov2024: number;
  growthRate: number;
  area?: string;
}

export interface DashboardData {
  kpis: KPIs;
  monthlySales: MonthlySales[];
  weeklySales: WeeklySales[];
  regionalTargets: RegionalTarget[];
  recentSales: Sale[];
  forecast?: any[]; // 예측 데이터 (엑셀 구조에 따라 타입 변경)
  summarySheet?: {
    byArea?: any[];      // 상권별
    byTeam?: any[];      // team별
    byChannel?: any[];   // 유통별
    byPure?: any[];      // 순수별
    byGroup?: any[];     // 단체별
    salesTarget?: any[]; // H열: 매출목표
    forecast?: any[];    // I열: 예상마감
    lastYear?: any[];    // K열: 작년실적
    rawData?: any[];     // 원본 데이터
  };
  storeByArea?: { [area: string]: StorePerformance[] }; // 상권별 매장 실적
  storeDCRate?: Array<{
    area: string;
    stores: Array<{
      storeName: string;
      realPrice?: number;      // 실판가
      tagPrice?: number;       // 택가
      dcRate?: number;         // DC율
      lastYearDcRate?: number; // 전년DC율
      difference?: number;     // 전년대비차이
    }>;
  }>; // 매장별 DC율
  summary?: {
    totalRows: number;
    lastUpdated: string;
    dataRange: string;
  };
}

