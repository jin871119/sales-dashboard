"use client";

import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import type { WeeklyMeetingData } from "@/lib/weeklyMeetingReader";

interface WeeklyMeetingSectionProps {
  data: WeeklyMeetingData | null;
}

export default function WeeklyMeetingSection({ data }: WeeklyMeetingSectionProps) {
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          📋 주간회의 실적 요약
        </h3>
        <div className="text-center py-8 text-gray-500">
          주간회의 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString();
  };

  const formatPercent = (num: number | undefined) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(1)}%`;
  };

  const getGrowthColor = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return 'text-gray-600';
    return rate >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return null;
    return rate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          📋 주간회의 실적 요약
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {data.period}
        </span>
      </div>

      {/* 요약 카드 - 합계 강조 */}
      {data.categories[0] && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">25년 누계</div>
            <div className="text-2xl font-bold text-blue-900 mb-1">
              ₩{formatNumber(Math.round((data.categories[0].yearlyActual || 0) / 100))}억
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-600">달성률:</span>
              <span className={`font-bold ${getGrowthColor(data.categories[0].yearlyAchievementRate)}`}>
                {formatPercent(data.categories[0].yearlyAchievementRate)}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">11월 실적</div>
            <div className="text-2xl font-bold text-green-900 mb-1">
              ₩{formatNumber(Math.round((data.categories[0].monthlyActual || 0) / 100))}억
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-600">전년 대비:</span>
              <span className={`font-bold flex items-center gap-1 ${getGrowthColor(data.categories[0].monthlyGrowthRate)}`}>
                {getGrowthIcon(data.categories[0].monthlyGrowthRate)}
                {formatPercent(data.categories[0].monthlyGrowthRate)}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium mb-1">46주차</div>
            <div className="text-2xl font-bold text-purple-900 mb-1">
              ₩{formatNumber(Math.round((data.categories[0].weeklyActual || 0) / 100))}억
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-600">전년 대비:</span>
              <span className={`font-bold flex items-center gap-1 ${getGrowthColor(data.categories[0].weeklyGrowthRate)}`}>
                {getGrowthIcon(data.categories[0].weeklyGrowthRate)}
                {formatPercent(data.categories[0].weeklyGrowthRate)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 상세 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" rowSpan={2}>
                상권
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={3}>
                25년 누계
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={3}>
                11월
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={2}>
                46주차
              </th>
            </tr>
            <tr>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border-l">목표</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">실적</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">달성률</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border-l">목표</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">실적</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">성장률</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border-l">실적</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">성장률</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.categories.map((category, idx) => (
              <tr 
                key={category.name} 
                className={`${
                  category.name === '합계' 
                    ? 'bg-blue-50 font-bold' 
                    : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                
                {/* 25년 누계 */}
                <td className="px-3 py-3 text-sm text-center text-gray-700 border-l">
                  {formatNumber(category.yearlyTarget)}
                </td>
                <td className="px-3 py-3 text-sm text-center text-gray-900 font-medium">
                  {formatNumber(category.yearlyActual)}
                </td>
                <td className="px-3 py-3 text-sm text-center">
                  <span className={`font-bold ${getGrowthColor(category.yearlyAchievementRate)}`}>
                    {formatPercent(category.yearlyAchievementRate)}
                  </span>
                </td>
                
                {/* 11월 */}
                <td className="px-3 py-3 text-sm text-center text-gray-700 border-l">
                  {formatNumber(category.monthlyTarget)}
                </td>
                <td className="px-3 py-3 text-sm text-center text-gray-900 font-medium">
                  {formatNumber(category.monthlyActual)}
                </td>
                <td className="px-3 py-3 text-sm text-center">
                  <span className={`font-bold flex items-center justify-center gap-1 ${getGrowthColor(category.monthlyGrowthRate)}`}>
                    {getGrowthIcon(category.monthlyGrowthRate)}
                    {formatPercent(category.monthlyGrowthRate)}
                  </span>
                </td>
                
                {/* 46주차 */}
                <td className="px-3 py-3 text-sm text-center text-gray-900 font-medium border-l">
                  {formatNumber(category.weeklyActual)}
                </td>
                <td className="px-3 py-3 text-sm text-center">
                  <span className={`font-bold flex items-center justify-center gap-1 ${getGrowthColor(category.weeklyGrowthRate)}`}>
                    {getGrowthIcon(category.weeklyGrowthRate)}
                    {formatPercent(category.weeklyGrowthRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 참고 사항 */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>💡 <strong>참고:</strong> 금액 단위는 백만원이며, 성장률과 달성률은 전년 대비 및 목표 대비 비율입니다.</p>
      </div>
    </div>
  );
}

