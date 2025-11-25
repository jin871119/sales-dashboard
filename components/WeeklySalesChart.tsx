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
} from "recharts";

interface WeeklyData {
  week: string;
  금년: number;
  전년: number;
  신장율: number;
}

interface WeeklySalesChartProps {
  data: WeeklyData[];
}

export default function WeeklySalesChart({ data }: WeeklySalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">주차별 매출 추이</h2>
        <p className="text-gray-500 text-center py-8">주차별 데이터를 로드하는 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">주차별 매출 추이</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">막대: 금년 vs 전년 매출 | 🟣 곡선: 신장율(%)</span>
          <span className="sm:hidden">금년 vs 전년 | 신장율</span>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="week" 
            stroke="#666"
            style={{ fontSize: '10px' }}
            className="text-[8px] sm:text-[10px]"
            interval={3}
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
          
          {/* 오른쪽 Y축: 신장율 */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#a855f7"
            tickFormatter={(value) => `${value}%`}
            style={{ fontSize: '12px' }}
            className="text-[10px] sm:text-xs"
            width={60}
            label={{ value: '신장율 (%)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
          />
          
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">{data.week}</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-blue-600 font-medium">금년: </span>
                        <span className="text-gray-700">{(data.금년 / 100000000).toFixed(1)}억원</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600 font-medium">전년: </span>
                        <span className="text-gray-700">{(data.전년 / 100000000).toFixed(1)}억원</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-purple-600 font-medium">신장율: </span>
                        <span className={`font-semibold ${data.신장율 >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {data.신장율 >= 0 ? '+' : ''}{data.신장율}%
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        차이: {((data.금년 - data.전년) / 100000000).toFixed(1)}억원
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
          
          {/* 막대 그래프: 금년 */}
          <Bar 
            yAxisId="left"
            dataKey="금년" 
            fill="url(#colorThisYear)"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
            name="금년"
          />
          
          {/* 막대 그래프: 전년 */}
          <Bar 
            yAxisId="left"
            dataKey="전년" 
            fill="url(#colorLastYear)"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
            name="전년"
          />
          
          {/* 곡선 그래프: 신장율 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="신장율"
            stroke="#a855f7"
            strokeWidth={3}
            dot={{ 
              fill: "#a855f7", 
              r: 4,
              strokeWidth: 2,
              stroke: "#fff"
            }}
            activeDot={{ 
              r: 6,
              stroke: "#a855f7",
              strokeWidth: 2,
              fill: "#fff"
            }}
            name="신장율"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 범례 설명 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 opacity-80 rounded"></div>
            <span>금년</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-500 opacity-80 rounded"></div>
            <span>전년</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>신장율</span>
          </div>
        </div>
      </div>
    </div>
  );
}


