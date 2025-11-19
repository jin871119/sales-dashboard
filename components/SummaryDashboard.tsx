"use client";

import { useState } from "react";
import CategoryChart from "./CategoryChart";
import DataTable from "./DataTable";
import { Store, Users, Package, Award, Building2 } from "lucide-react";

interface SummaryData {
  byArea?: any[];      // 상권별
  byTeam?: any[];      // team별
  byChannel?: any[];   // 유통별
  byPure?: any[];      // 순수별
  byGroup?: any[];     // 단체별
  salesTarget?: any[]; // H열: 매출목표
  forecast?: any[];    // I열: 예상마감
  lastYear?: any[];    // K열: 작년실적
  rawData?: any[];     // 원본 데이터
}

interface SummaryDashboardProps {
  data: SummaryData;
}

export default function SummaryDashboard({ data }: SummaryDashboardProps) {
  const [activeView, setActiveView] = useState<"charts" | "table">("charts");

  const categories = [
    {
      id: 'byArea',
      title: '상권별 분석',
      icon: <Store className="w-5 h-5" />,
      data: data.byArea,
      color: '#3b82f6'
    },
    {
      id: 'byTeam',
      title: 'Team별 분석',
      icon: <Users className="w-5 h-5" />,
      data: data.byTeam,
      color: '#8b5cf6'
    },
    {
      id: 'byChannel',
      title: '유통별 분석',
      icon: <Package className="w-5 h-5" />,
      data: data.byChannel,
      color: '#ec4899'
    },
    {
      id: 'byPure',
      title: '순수별 분석',
      icon: <Award className="w-5 h-5" />,
      data: data.byPure,
      color: '#10b981'
    },
    {
      id: 'byGroup',
      title: '단체별 분석',
      icon: <Building2 className="w-5 h-5" />,
      data: data.byGroup,
      color: '#f59e0b'
    },
    {
      id: 'salesTarget',
      title: '매출목표 (H7)',
      icon: <Award className="w-5 h-5" />,
      data: data.salesTarget,
      color: '#06b6d4'
    },
    {
      id: 'forecast',
      title: '예상마감 (I7)',
      icon: <Package className="w-5 h-5" />,
      data: data.forecast,
      color: '#f43f5e'
    },
    {
      id: 'lastYear',
      title: '작년실적 (K7)',
      icon: <Store className="w-5 h-5" />,
      data: data.lastYear,
      color: '#6366f1'
    },
  ];

  const availableCategories = categories.filter(cat => cat.data && cat.data.length > 0);

  if (availableCategories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Store className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            &quot;요약&quot; 시트 데이터를 준비 중입니다
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            analyze-summary.bat 파일을 실행하여 데이터 구조를 분석하세요.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.open('/api/dashboard', '_blank')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            API 응답 확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 요약 시트 분석</h2>
          <p className="text-gray-600 mt-1">
            {availableCategories.length}개 카테고리 데이터
          </p>
        </div>
        
        {/* 뷰 전환 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
          <button
            onClick={() => setActiveView("charts")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeView === "charts"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📊 차트
          </button>
          <button
            onClick={() => setActiveView("table")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeView === "table"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 테이블
          </button>
        </div>
      </div>

      {/* 카테고리 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {availableCategories.map((category) => {
          const total = category.data?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0;
          return (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                  <div style={{ color: category.color }}>
                    {category.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600">{category.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {category.data?.length}개 항목
              </p>
            </div>
          );
        })}
      </div>

      {/* 차트 뷰 */}
      {activeView === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {availableCategories.map((category) => (
            <CategoryChart
              key={category.id}
              title={category.title}
              data={category.data || []}
              type="bar"
              color={category.color}
            />
          ))}
        </div>
      )}

      {/* 테이블 뷰 */}
      {activeView === "table" && data.rawData && data.rawData.length > 0 && (
        <DataTable
          title="요약 시트 전체 데이터"
          columns={Object.keys(data.rawData[0] || {}).map(key => ({
            key,
            label: key,
            format: (value: any) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }
          }))}
          data={data.rawData}
          pageSize={20}
        />
      )}
    </div>
  );
}

