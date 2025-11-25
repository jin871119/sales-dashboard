"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MetricCard from "./MetricCard";
import SalesChart from "./SalesChart";
import WeeklySalesChart from "./WeeklySalesChart";
import SummaryTable from "./SummaryTable";
import StoreAreaSelector from "./StoreAreaSelector";
import StoreDCRate from "./StoreDCRate";
import WeeklySalesDashboard from "./WeeklySales/WeeklySalesDashboard";
import SummaryDashboard from "./SummaryDashboard";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Target,
  Activity,
  Calendar,
  MapPin,
  Sparkles
} from "lucide-react";
import type { DashboardData } from "@/types/dashboard";
import type { WeeklyMeetingData } from "@/lib/weeklyMeetingReader";

// Plotly를 사용하는 컴포넌트는 동적으로 로드 (SSR 방지)
const StoreDistributionDashboard = dynamic(
  () => import("./StoreDistribution/StoreDistributionDashboard"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">3D 시각화 로딩 중...</p>
        </div>
      </div>
    )
  }
);

export default function EnhancedDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyMeetingData, setWeeklyMeetingData] = useState<WeeklyMeetingData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "weekly-sales" | "store-distribution" | "category">("overview");
  const [showKpiInsight, setShowKpiInsight] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        console.log("📊 대시보드 데이터 로딩 시작...");
        const response = await fetch("/api/dashboard");
        
        if (!response.ok) {
          throw new Error(`API 응답 오류: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("✅ 대시보드 데이터 로딩 완료:", result);
        console.log("📊 KPI 데이터 상세:", {
          salesTarget: result.kpis?.salesTarget,
          periodPerformance: result.kpis?.periodPerformance,
          lastYearPeriod: result.kpis?.lastYearPeriod,
          periodGrowthRate: result.kpis?.periodGrowthRate,
          forecast: result.kpis?.forecast,
          forecastAchievementRate: result.kpis?.forecastAchievementRate,
        });
        console.log("📊 summarySheet 데이터:", {
          hasSummarySheet: !!result.summarySheet,
          salesTarget: result.summarySheet?.salesTarget?.[0]?.value,
          forecast: result.summarySheet?.forecast?.[0]?.value,
          periodPerformance: result.summarySheet?.periodPerformance?.[0]?.value,
          lastYearPeriod: result.summarySheet?.lastYearPeriod?.[0]?.value,
          periodGrowthRate: result.summarySheet?.periodGrowthRate?.[0]?.value,
          forecastAchievementRate: result.summarySheet?.forecastAchievementRate?.[0]?.value,
        });
        
        // 데이터 검증
        if (!result || !result.kpis) {
          console.warn("⚠️ 데이터 구조가 올바르지 않습니다. 기본 데이터 사용.");
          setData(getDefaultDashboardData());
        } else {
          setData(result);
        }
      } catch (error) {
        console.error("❌ 데이터 로딩 실패:", error);
        // 에러 발생 시 기본 데이터 표시
        setData(getDefaultDashboardData());
      } finally {
        setLoading(false);
      }
    }

    async function fetchWeeklyMeetingData() {
      try {
        const response = await fetch("/api/weekly-meeting");
        if (response.ok) {
          const result = await response.json();
          setWeeklyMeetingData(result);
        }
      } catch (error) {
        console.error("주간회의 데이터 로딩 실패:", error);
      }
    }

    fetchDashboardData();
    fetchWeeklyMeetingData();
    
    // 5분마다 자동 새로고침
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchWeeklyMeetingData();
    }, 5 * 60 * 1000);
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              📊 Sales Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              <span className="hidden sm:inline">2025 Sales Performance & Forecast Analysis</span>
              <span className="sm:hidden">2025 Sales Dashboard</span>
              {data.summary && (
                <span className="ml-2 sm:ml-4 text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full">
                  📊 {data.summary.totalRows?.toLocaleString()} Records
                </span>
              )}
            </p>
          </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">새로고침</span>
              <span className="sm:hidden">🔄</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
          <div className="inline-flex min-w-full sm:min-w-0 flex-wrap sm:flex-nowrap gap-1 sm:gap-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 개요
          </button>
          <button
            onClick={() => setActiveTab("weekly-sales")}
            className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === "weekly-sales"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📅 판매
          </button>
          <button
            onClick={() => setActiveTab("store-distribution")}
            className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === "store-distribution"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏢 백화점 분포도
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === "category"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 카테고리
          </button>
          </div>
        </div>

        {/* 개요 탭 */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8 relative">
              <MetricCard
                title="매출목표"
                value={data.kpis.salesTarget.value}
                icon={<Target className="w-6 h-6" />}
                color="blue"
                trend={{
                  value: data.kpis.salesTarget.change,
                  isPositive: data.kpis.salesTarget.trend === "up"
                }}
              />
              <MetricCard
                title="실적"
                value={data.kpis.periodPerformance?.value || "0.0억원"}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                trend={{
                  value: data.kpis.periodPerformance?.change || "실적",
                  isPositive: data.kpis.periodPerformance?.trend === "up"
                }}
              />
              <MetricCard
                title="전년실적"
                value={data.kpis.lastYearPeriod?.value || "0.0억원"}
                icon={<Calendar className="w-6 h-6" />}
                color="purple"
                trend={{
                  value: data.kpis.lastYearPeriod?.change || "전년실적",
                  isPositive: true
                }}
              />
              <MetricCard
                title="전년비"
                value={data.kpis.periodGrowthRate?.value || "0.0%"}
                icon={<Activity className="w-6 h-6" />}
                color="orange"
                trend={{
                  value: data.kpis.periodGrowthRate?.change || "전년비",
                  isPositive: data.kpis.periodGrowthRate?.trend === "up"
                }}
              />
              <MetricCard
                title="예상마감"
                value={data.kpis.forecast.value}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                trend={{
                  value: data.kpis.forecast.change,
                  isPositive: data.kpis.forecast.trend === "up"
                }}
              />
              {/* 예상달성율 카드 - AI 버튼 포함 */}
              <div className="relative">
                {/* AI 버튼 - 카드 위에 작게 배치 */}
                <button
                  onClick={() => setShowKpiInsight(!showKpiInsight)}
                  className={`absolute -top-2 -right-2 z-10 p-1.5 rounded-full shadow-lg transition-all ${
                    showKpiInsight
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white text-purple-600 hover:bg-purple-50'
                  }`}
                  title="AI 인사이트"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <MetricCard
                  title="예상달성율"
                  value={data.kpis.forecastAchievementRate?.value || "0.0%"}
                  icon={<Activity className="w-6 h-6" />}
                  color="orange"
                  trend={{
                    value: data.kpis.forecastAchievementRate?.change || "예상달성율",
                    isPositive: data.kpis.forecastAchievementRate?.trend === "up"
                  }}
                />
              </div>
            </div>

            {/* KPI AI 인사이트 */}
            {showKpiInsight && data && (
              <div className="mb-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-yellow-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl p-3 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🤖 KPI AI 인사이트
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">메인 KPI 데이터 기반 분석 및 권장사항</p>
                    <div className="space-y-3">
                      {generateKpiInsights(data.kpis).map((insight, idx) => (
                        <div 
                          key={idx}
                          className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow"
                        >
                          <p className="text-sm text-gray-800 leading-relaxed font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 주차별 매출 추이 */}
            <div className="mb-8">
              <WeeklySalesChart data={data.weeklySales || []} />
            </div>

            {/* 월별 매출 추이 */}
            <div className="mb-8">
              <SalesChart data={data.monthlySales} />
            </div>

            {/* 영업 실적 요약 표 (주간회의 포함) */}
            {data.summarySheet && (
              <div className="mb-8">
                <SummaryTable data={data.summarySheet} weeklyMeetingData={weeklyMeetingData} />
              </div>
            )}

            {/* 상권별 매장 실적 */}
            {data.storeByArea && Object.keys(data.storeByArea).length > 0 && (
              <div className="mb-8">
                <StoreAreaSelector storeByArea={data.storeByArea} />
              </div>
            )}

            {/* 매장별 DC율 */}
            <div className="mb-8">
              <StoreDCRate data={data.storeDCRate || []} />
            </div>
          </div>
        )}


        {/* 일주월별 판매 탭 */}
        {activeTab === "weekly-sales" && (
          <WeeklySalesDashboard />
        )}

        {/* 백화점 분포도 탭 */}
        {activeTab === "store-distribution" && (
          <StoreDistributionDashboard />
        )}

        {/* 카테고리 탭 */}
        {activeTab === "category" && (
          <SummaryDashboard data={data.summarySheet || {}} />
        )}
      </div>
    </div>
  );
}

/**
 * KPI 데이터를 기반으로 AI 인사이트 생성
 */
function generateKpiInsights(kpis: DashboardData['kpis']): string[] {
  const insights: string[] = [];
  
  if (!kpis) return insights;
  
  // 값 추출 (억원 단위에서 숫자만 추출)
  const parseBillion = (value: string): number => {
    if (!value) return 0;
    const numStr = value.replace(/[억원,]/g, '').trim();
    return parseFloat(numStr) || 0;
  };
  
  const parsePercent = (value: string): number => {
    if (!value) return 0;
    const numStr = value.replace(/[%,]/g, '').trim();
    return parseFloat(numStr) || 0;
  };
  
  const salesTarget = parseBillion(kpis.salesTarget.value) * 100000000; // 억원을 원으로 변환
  const periodPerformance = parseBillion(kpis.periodPerformance?.value || "0") * 100000000;
  const lastYearPeriod = parseBillion(kpis.lastYearPeriod?.value || "0") * 100000000;
  const forecast = parseBillion(kpis.forecast.value) * 100000000;
  const forecastAchievementRate = parsePercent(kpis.forecastAchievementRate?.value || "0");
  const periodGrowthRate = parsePercent(kpis.periodGrowthRate?.value || "0");
  
  // 진도율 계산 (실적 / 목표)
  const progressRate = salesTarget > 0 ? (periodPerformance / salesTarget) * 100 : 0;
  
  // 1. 예상달성율 분석
  if (forecastAchievementRate >= 110) {
    insights.push(`🚀 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표를 크게 초과 달성할 전망입니다! 탁월한 성과입니다.`);
  } else if (forecastAchievementRate >= 105) {
    insights.push(`✨ 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표를 초과 달성할 전망입니다. 현재 추세를 유지하세요!`);
  } else if (forecastAchievementRate >= 100) {
    insights.push(`✅ 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표 달성이 예상됩니다. 마지막까지 집중하세요!`);
  } else if (forecastAchievementRate >= 95) {
    insights.push(`💡 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표에 근접할 전망입니다. 추가 노력으로 목표 달성이 가능합니다.`);
  } else if (forecastAchievementRate >= 90) {
    insights.push(`⚠️ 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표 미달이 우려됩니다. 전략 재검토가 필요합니다.`);
  } else {
    insights.push(`🔴 예상달성율 ${forecastAchievementRate.toFixed(1)}%로 목표 달성이 어려울 전망입니다. 즉각적인 대응이 필요합니다.`);
  }
  
  // 2. 전년비 분석
  if (periodGrowthRate >= 15) {
    insights.push(`📈 전년비 ${periodGrowthRate >= 0 ? '+' : ''}${periodGrowthRate.toFixed(1)}%로 매우 강력한 성장세를 보이고 있습니다.`);
  } else if (periodGrowthRate >= 10) {
    insights.push(`📊 전년비 ${periodGrowthRate >= 0 ? '+' : ''}${periodGrowthRate.toFixed(1)}%로 강력한 성장세입니다.`);
  } else if (periodGrowthRate >= 5) {
    insights.push(`📈 전년비 ${periodGrowthRate >= 0 ? '+' : ''}${periodGrowthRate.toFixed(1)}%로 안정적인 성장세를 유지하고 있습니다.`);
  } else if (periodGrowthRate >= 0) {
    insights.push(`📊 전년비 ${periodGrowthRate >= 0 ? '+' : ''}${periodGrowthRate.toFixed(1)}%로 소폭 성장하고 있습니다.`);
  } else if (periodGrowthRate >= -5) {
    insights.push(`📉 전년비 ${periodGrowthRate.toFixed(1)}%로 소폭 감소했습니다. 시장 상황 점검이 필요합니다.`);
  } else {
    insights.push(`⚠️ 전년비 ${periodGrowthRate.toFixed(1)}%로 큰 폭 감소했습니다. 즉각적인 대응이 필요합니다.`);
  }
  
  // 3. 진도율 분석
  if (progressRate >= 90) {
    insights.push(`🎯 현재 진도율 ${progressRate.toFixed(1)}%로 목표 달성이 거의 확실합니다!`);
  } else if (progressRate >= 75) {
    insights.push(`✅ 현재 진도율 ${progressRate.toFixed(1)}%로 양호한 진행 상황입니다.`);
  } else if (progressRate >= 60) {
    insights.push(`💡 현재 진도율 ${progressRate.toFixed(1)}%로 보통 수준입니다. 목표 달성을 위해 추가 노력이 필요합니다.`);
  } else if (progressRate >= 50) {
    insights.push(`⚠️ 현재 진도율 ${progressRate.toFixed(1)}%로 목표 달성을 위해 더 많은 노력이 필요합니다.`);
  } else {
    insights.push(`🔴 현재 진도율이 ${progressRate.toFixed(1)}%로 저조합니다. 즉각적인 대응이 필요합니다.`);
  }
  
  // 4. 예상마감 vs 목표 비교
  const gap = forecast - salesTarget;
  const gapBillion = Math.abs(gap) / 100000000;
  if (gap > 0) {
    insights.push(`💰 예상마감이 목표보다 ${gapBillion.toFixed(1)}억원 많아 초과 달성이 예상됩니다.`);
  } else if (gap < 0) {
    insights.push(`💡 목표 달성을 위해 예상보다 ${gapBillion.toFixed(1)}억원의 추가 매출이 필요합니다.`);
  } else {
    insights.push(`🎯 예상마감이 목표와 거의 일치합니다. 정확한 예측입니다!`);
  }
  
  // 5. 실적 vs 전년실적 비교
  const performanceGap = periodPerformance - lastYearPeriod;
  const performanceGapBillion = Math.abs(performanceGap) / 100000000;
  if (performanceGap > 0) {
    insights.push(`📈 현재 실적이 전년 대비 ${performanceGapBillion.toFixed(1)}억원 증가했습니다.`);
  } else if (performanceGap < 0) {
    insights.push(`📉 현재 실적이 전년 대비 ${performanceGapBillion.toFixed(1)}억원 감소했습니다.`);
  }
  
  // 6. 권장사항
  if (forecastAchievementRate >= 100 && periodGrowthRate >= 5) {
    insights.push(`🎉 축하합니다! 목표 달성과 성장을 동시에 이루고 있습니다. 현재 추세를 유지하세요!`);
  } else if (forecastAchievementRate >= 100) {
    insights.push(`✅ 목표 달성은 예상되지만, 전년 대비 성장률을 높이기 위한 전략이 필요합니다.`);
  } else if (forecastAchievementRate >= 95) {
    insights.push(`💡 목표 달성을 위해 마지막 스퍼트가 필요합니다. 집중 마케팅과 영업 활동을 강화하세요.`);
  } else {
    insights.push(`⚠️ 목표 달성을 위해 전략 재검토가 필요합니다. 시장 상황 분석과 대응 방안을 수립하세요.`);
  }
  
  return insights;
}

// 기본 대시보드 데이터 (API 실패 시 사용)
function getDefaultDashboardData(): DashboardData {
  return {
    kpis: {
      salesTarget: {
        value: "₩50,000,000,000",
        change: "95.0% 달성 예상",
        trend: "up" as const,
      },
      forecast: {
        value: "₩47,500,000,000",
        change: "95.0% 달성률",
        trend: "up" as const,
      },
      lastYear: {
        value: "₩45,000,000,000",
        change: "5.6% 신장",
        trend: "up" as const,
      },
      growthRate: {
        value: "5.6%",
        change: "전년 대비",
        trend: "up" as const,
      },
    },
    monthlySales: [
      { month: "1월", 매출: 4200000000, 목표: 4000000000, 작년실적: 3800000000, 신장율: 10.5 },
      { month: "2월", 매출: 3800000000, 목표: 4000000000, 작년실적: 3600000000, 신장율: 5.6 },
      { month: "3월", 매출: 4500000000, 목표: 4200000000, 작년실적: 4300000000, 신장율: 4.7 },
      { month: "4월", 매출: 4100000000, 목표: 4000000000, 작년실적: 3900000000, 신장율: 5.1 },
      { month: "5월", 매출: 4300000000, 목표: 4200000000, 작년실적: 4100000000, 신장율: 4.9 },
      { month: "6월", 매출: 4600000000, 목표: 4500000000, 작년실적: 4400000000, 신장율: 4.5 },
      { month: "7월", 매출: 4400000000, 목표: 4300000000, 작년실적: 4200000000, 신장율: 4.8 },
      { month: "8월", 매출: 4700000000, 목표: 4500000000, 작년실적: 4500000000, 신장율: 4.4 },
      { month: "9월", 매출: 4200000000, 목표: 4200000000, 작년실적: 4000000000, 신장율: 5.0 },
      { month: "10월", 매출: 4500000000, 목표: 4400000000, 작년실적: 4300000000, 신장율: 4.7 },
      { month: "11월", 매출: 4750000000, 목표: 5000000000, 작년실적: 4500000000, 신장율: 5.6 },
    ],
    weeklySales: [],
    regionalTargets: [
      { 지역: "서울", 달성률: 95, 목표: 100 },
      { 지역: "경기", 달성률: 92, 목표: 100 },
      { 지역: "부산/경남", 달성률: 88, 목표: 100 },
      { 지역: "대구/경북", 달성률: 85, 목표: 100 },
      { 지역: "광주/전라", 달성률: 82, 목표: 100 },
      { 지역: "대전/충청", 달성률: 90, 목표: 100 },
    ],
    recentSales: [],
    summary: {
      totalRows: 0,
      lastUpdated: new Date().toLocaleString('ko-KR'),
      dataRange: "샘플 데이터",
    },
  };
}

