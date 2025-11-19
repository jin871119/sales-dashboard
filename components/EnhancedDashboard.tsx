"use client";

import { useState, useEffect } from "react";
import KPICard from "./KPICard";
import MetricCard from "./MetricCard";
import SalesChart from "./SalesChart";
import WeeklySalesChart from "./WeeklySalesChart";
import SummaryTable from "./SummaryTable";
import ForecastChart from "./ForecastChart";
import DataTable from "./DataTable";
import SummaryDashboard from "./SummaryDashboard";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Target,
  Activity,
  Calendar,
  FileText,
  PieChart as PieChartIcon
} from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

export default function EnhancedDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "summary" | "forecast" | "details">("overview");

  useEffect(() => {
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
    
    // 5분마다 자동 새로고침
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto"></div>
            <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 w-8 h-8 animate-pulse" />
          </div>
            <p className="mt-6 text-lg text-gray-700 font-medium">
              📊 Loading sales data...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {data?.summary?.totalRows ? `Processing ${data.summary.totalRows.toLocaleString()} records` : 'Please wait...'}
            </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📊 Sales Dashboard
            </h1>
            <p className="text-gray-600">
              2025 Sales Performance & Forecast Analysis
              {data.summary && (
                <span className="ml-4 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  📊 {data.summary.totalRows?.toLocaleString()} Records
                </span>
              )}
            </p>
          </div>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-1 inline-flex flex-wrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 개요
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "summary"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📈 요약 (상권/팀/유통)
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "forecast"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🔮 예측
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "details"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 상세
          </button>
        </div>

        {/* 개요 탭 */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="매출목표"
                value={data.kpis.salesTarget.value}
                subtitle="H7 (목표)"
                icon={<Target className="w-6 h-6" />}
                color="blue"
                trend={{
                  value: data.kpis.salesTarget.change,
                  isPositive: data.kpis.salesTarget.trend === "up"
                }}
              />
              <MetricCard
                title="예상마감"
                value={data.kpis.forecast.value}
                subtitle="I7 (예상마감달성율)"
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                trend={{
                  value: data.kpis.forecast.change,
                  isPositive: data.kpis.forecast.trend === "up"
                }}
              />
              <MetricCard
                title="전년실적"
                value={data.kpis.lastYear.value}
                subtitle="K7 (작년)"
                icon={<Calendar className="w-6 h-6" />}
                color="purple"
                trend={{
                  value: data.kpis.lastYear.change,
                  isPositive: data.kpis.lastYear.trend === "up"
                }}
              />
              <MetricCard
                title="신장율"
                value={data.kpis.growthRate.value}
                subtitle="전년 대비 성장률"
                icon={<Activity className="w-6 h-6" />}
                color="orange"
                trend={{
                  value: data.kpis.growthRate.change,
                  isPositive: data.kpis.growthRate.trend === "up"
                }}
              />
            </div>

            {/* 주차별 매출 추이 */}
            {data.weeklySales && data.weeklySales.length > 0 && (
              <div className="mb-8">
                <WeeklySalesChart data={data.weeklySales} />
              </div>
            )}

            {/* 월별 매출 추이 */}
            <div className="mb-8">
              <SalesChart data={data.monthlySales} />
            </div>

            {/* 영업 실적 요약 표 */}
            {data.summarySheet && (
              <div className="mb-8">
                <SummaryTable data={data.summarySheet} />
              </div>
            )}
          </div>
        )}

        {/* 요약 탭 (상권별, team별, 유통별, 순수별, 단체별) */}
        {activeTab === "summary" && data.summarySheet && (
          <SummaryDashboard data={data.summarySheet} />
        )}

        {activeTab === "summary" && !data.summarySheet && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <PieChartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              요약 시트 데이터를 분석 중입니다
            </h3>
            <p className="text-gray-500 mb-6">
              analyze-summary.bat를 실행하여 &quot;요약&quot; 시트를 분석하세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        )}

        {/* 예측 탭 */}
        {activeTab === "forecast" && (
          <>
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">
                💡 이 섹션은 ending focast.xlsx 파일의 실제 예측 데이터를 표시합니다.
              </p>
              <p className="text-blue-600 text-sm mt-1">
                엑셀 파일을 분석한 후 데이터 구조에 맞게 자동으로 업데이트됩니다.
              </p>
            </div>

            {data.forecast && data.forecast.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <ForecastChart 
                    data={data.forecast} 
                    title="월별 실적 vs 예측"
                  />
                </div>
                
                <DataTable
                  title="예측 데이터 상세"
                  columns={[
                    { key: "period", label: "기간" },
                    { 
                      key: "forecast", 
                      label: "예측값",
                      format: (v) => `₩${v?.toLocaleString() || 0}`
                    },
                    { 
                      key: "actual", 
                      label: "실적",
                      format: (v) => v ? `₩${v.toLocaleString()}` : "-"
                    },
                  ]}
                  data={data.forecast}
                  pageSize={15}
                />
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  예측 데이터를 준비 중입니다
                </h3>
                <p className="text-gray-500 mb-6">
                  setup-excel.bat를 실행하여 엑셀 파일을 분석하세요.
                </p>
                <button
                  onClick={() => window.open('/api/test-excel', '_blank')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  엑셀 분석 상태 확인
                </button>
              </div>
            )}
          </>
        )}

        {/* 상세 탭 */}
        {activeTab === "details" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">데이터 기간</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {data.summary?.dataRange || "2025년"}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">총 데이터</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {data.summary?.totalRows?.toLocaleString() || "N/A"}
                  <span className="text-sm text-gray-500 ml-2">건</span>
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">마지막 업데이트</h3>
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  {data.summary?.lastUpdated || "실시간"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

