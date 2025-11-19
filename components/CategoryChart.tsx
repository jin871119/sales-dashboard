"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

interface CategoryChartProps {
  title: string;
  data: CategoryData[];
  type?: "bar" | "pie";
  color?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#6366f1', // indigo
];

export default function CategoryChart({
  title,
  data,
  type = "bar",
  color = "#8b5cf6"
}: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      
      {type === "bar" ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              stroke="#666"
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value: number) => value.toLocaleString()}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[8, 8, 0, 0]}
              name="값"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => value.toLocaleString()}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* 데이터 요약 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">총 카테고리:</span>
            <span className="ml-2 font-semibold text-gray-900">{data.length}개</span>
          </div>
          <div>
            <span className="text-gray-600">총 합계:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


