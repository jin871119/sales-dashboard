"use client";

import { useState, useEffect } from "react";
import KPICard from "./KPICard";
import SalesChart from "./SalesChart";
import TargetChart from "./TargetChart";
import RecentSales from "./RecentSales";
import { TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // API에서 실시간 데이터 가져오기
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">영업 대시보드</h1>
        <p className="text-gray-600">2025년 상반기 실적 현황</p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="총 매출"
          value={data.kpis.totalSales.value}
          change={data.kpis.totalSales.change}
          trend={data.kpis.totalSales.trend}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="목표 달성률"
          value={data.kpis.targetRate.value}
          change={data.kpis.targetRate.change}
          trend={data.kpis.targetRate.trend}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="신규 고객"
          value={data.kpis.newCustomers.value}
          change={data.kpis.newCustomers.change}
          trend={data.kpis.newCustomers.trend}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="주문 건수"
          value={data.kpis.orders.value}
          change={data.kpis.orders.change}
          trend={data.kpis.orders.trend}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart data={data.monthlySales} />
        <TargetChart data={data.regionalTargets} />
      </div>

      {/* 최근 판매 내역 */}
      <RecentSales sales={data.recentSales} />
    </div>
  );
}

