export interface KPIData {
  value: string;
  change: string;
  trend: "up" | "down";
}

export interface KPIs {
  salesTarget: KPIData;   // 매출목표 (H7)
  forecast: KPIData;       // 예상마감 (I7)
  lastYear: KPIData;       // 전년실적 (K7)
  growthRate: KPIData;     // 신장율
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
  summary?: {
    totalRows: number;
    lastUpdated: string;
    dataRange: string;
  };
}

