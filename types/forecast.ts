export interface ForecastData {
  period: string;
  actual?: number;
  forecast: number;
  upperBound?: number;
  lowerBound?: number;
  accuracy?: number;
}

export interface ForecastSummary {
  totalForecast: number;
  totalActual: number;
  accuracy: number;
  variance: number;
  trend: "up" | "down";
}

export interface ProductForecast {
  product: string;
  category?: string;
  currentMonth: number;
  nextMonth: number;
  growth: number;
  confidence: number;
}

export interface RegionalForecast {
  region: string;
  forecast: number;
  actual?: number;
  achievement?: number;
  growth: number;
}


