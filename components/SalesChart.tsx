"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MonthlySales } from "@/types/dashboard";

interface SalesChartProps {
  data: MonthlySales[];
}

// 달성율을 포함한 데이터 변환
interface ChartData extends MonthlySales {
  달성율: number;
}

export default function SalesChart({ data }: SalesChartProps) {
  // 달성율 계산 추가
  const chartData: ChartData[] = data.map(item => ({
    ...item,
    달성율: item.목표 > 0 ? Math.round((item.매출 / item.목표) * 100) : 0,
    // 신장율은 이미 데이터에 포함되어 있음
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">월별 매출 추이</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">막대: 실매출 vs 목표 | 🔴 곡선: 달성율(%) | 🟣 곡선: 신장율(%)</span>
          <span className="sm:hidden">실매출 vs 목표 | 달성율 | 신장율</span>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="month" 
            stroke="#666"
            style={{ fontSize: '12px' }}
            className="text-[10px] sm:text-xs"
          />
          
          {/* 왼쪽 Y축: 매출액 */}
          <YAxis 
            yAxisId="left"
            stroke="#666"
            tickFormatter={(value) => `${(value / 100000000).toFixed(0)}억`}
            style={{ fontSize: '12px' }}
            className="text-[10px] sm:text-xs"
            width={60}
            label={{ value: '매출액 (억원)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          
          {/* 오른쪽 Y축: 달성율 */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#ef4444"
            tickFormatter={(value) => `${value}%`}
            style={{ fontSize: '12px' }}
            className="text-[10px] sm:text-xs"
            width={60}
            label={{ value: '달성율 (%)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
          />
          
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">{data.month}</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-green-600 font-medium">목표: </span>
                        <span className="text-gray-700">{(data.목표 / 100000000).toFixed(1)}억원</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-blue-600 font-medium">실매출: </span>
                        <span className="text-gray-700">{(data.매출 / 100000000).toFixed(1)}억원</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-red-600 font-medium">달성율: </span>
                        <span className={`font-semibold ${data.달성율 >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                          {data.달성율}%
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-purple-600 font-medium">신장율: </span>
                        <span className={`font-semibold ${data.신장율 >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {data.신장율 >= 0 ? '+' : ''}{data.신장율}%
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        목표 차이: {((data.매출 - data.목표) / 100000000).toFixed(1)}억원
                      </p>
                      <p className="text-xs text-gray-500">
                        작년 실적: {(data.작년실적 / 100000000).toFixed(1)}억원
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          
          {/* 막대 그래프: 목표 */}
          <Bar 
            yAxisId="left"
            dataKey="목표" 
            fill="url(#colorTarget)"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-target-${index}`} fill="#10b981" fillOpacity={0.6} />
            ))}
          </Bar>
          
          {/* 막대 그래프: 실매출 */}
          <Bar 
            yAxisId="left"
            dataKey="매출" 
            fill="url(#colorSales)"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-sales-${index}`} 
                fill={entry.달성율 >= 100 ? "#3b82f6" : "#f59e0b"} 
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          
          {/* 곡선 그래프: 달성율 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="달성율"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ 
              fill: "#ef4444", 
              r: 6,
              strokeWidth: 2,
              stroke: "#fff"
            }}
            activeDot={{ 
              r: 8,
              stroke: "#ef4444",
              strokeWidth: 2,
              fill: "#fff"
            }}
          />
          
          {/* 곡선 그래프: 신장율 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="신장율"
            stroke="#a855f7"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ 
              fill: "#a855f7", 
              r: 6,
              strokeWidth: 2,
              stroke: "#fff"
            }}
            activeDot={{ 
              r: 8,
              stroke: "#a855f7",
              strokeWidth: 2,
              fill: "#fff"
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 범례 설명 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 opacity-60 rounded"></div>
            <span>목표</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 opacity-80 rounded"></div>
            <span>실매출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>달성율</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full border-2 border-dashed border-purple-500"></div>
            <span>신장율</span>
          </div>
        </div>
      </div>
    </div>
  );
}

