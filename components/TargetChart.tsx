"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RegionalTarget } from "@/types/dashboard";

interface TargetChartProps {
  data: RegionalTarget[];
}

export default function TargetChart({ data }: TargetChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">지역별 목표 달성률</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="지역" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            formatter={(value: number) => `${value}%`}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="달성률" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          <Bar dataKey="목표" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


