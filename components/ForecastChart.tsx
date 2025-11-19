"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

interface ForecastData {
  period: string;
  actual?: number;
  forecast: number;
  upperBound?: number;
  lowerBound?: number;
}

interface ForecastChartProps {
  data: ForecastData[];
  title?: string;
}

export default function ForecastChart({ 
  data, 
  title = "실적 vs 예측" 
}: ForecastChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" stroke="#666" />
          <YAxis 
            stroke="#666"
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <Tooltip
            formatter={(value: number) => `₩${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          
          {/* 실적 라인 */}
          {data.some(d => d.actual !== undefined) && (
            <Line
              type="monotone"
              dataKey="actual"
              name="실적"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7 }}
            />
          )}
          
          {/* 예측 라인 */}
          <Line
            type="monotone"
            dataKey="forecast"
            name="예측"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "#8b5cf6", r: 4 }}
          />
          
          {/* 상한/하한 영역 */}
          {data.some(d => d.upperBound !== undefined) && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stackId="1"
              stroke="none"
              fill="url(#colorForecast)"
              fillOpacity={0.3}
              name="예측 범위 (상한)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}


