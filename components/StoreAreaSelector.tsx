"use client";

import { useState } from "react";
import { Store, TrendingUp, TrendingDown } from "lucide-react";
import type { StorePerformance } from "@/types/dashboard";

interface StoreAreaSelectorProps {
  storeByArea: { [area: string]: StorePerformance[] };
}

export default function StoreAreaSelector({ storeByArea }: StoreAreaSelectorProps) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  if (!storeByArea || Object.keys(storeByArea).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          상권별 매장 데이터를 로드 중입니다
        </h3>
        <p className="text-sm text-gray-500">
          backdata.xlsx의 &quot;11월실적&quot; 및 &quot;상권구분&quot; 시트를 확인하세요.
        </p>
      </div>
    );
  }

  const areas = Object.keys(storeByArea).sort();

  // 상권별 집계 계산
  const areaStats = areas.map(area => {
    const stores = storeByArea[area];
    const totalNov2025 = stores.reduce((sum, store) => sum + store.nov2025, 0);
    const totalNov2024 = stores.reduce((sum, store) => sum + store.nov2024, 0);
    const growthRate = totalNov2024 > 0 
      ? Math.round(((totalNov2025 - totalNov2024) / totalNov2024) * 100)
      : 0;

    return {
      area,
      storeCount: stores.length,
      totalNov2025,
      totalNov2024,
      growthRate,
      stores
    };
  });

  // 백만원 단위로 포맷
  const formatMillion = (value: number) => {
    return (value / 1000000).toFixed(0);
  };

  // 선택된 상권 데이터
  const selectedStats = selectedArea ? areaStats.find(s => s.area === selectedArea) : null;

  return (
    <div className="space-y-6">
      {/* 상권별 버튼 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏢 상권별 11월 실적</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {areaStats.map(({ area, storeCount, totalNov2025, growthRate }) => (
            <button
              key={area}
              onClick={() => setSelectedArea(selectedArea === area ? null : area)}
              className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                selectedArea === area
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:from-purple-100 hover:to-blue-100'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-semibold mb-2">{area}</div>
                <div className="text-xs opacity-80">{storeCount}개 매장</div>
                <div className="mt-2 text-lg font-bold">
                  {formatMillion(totalNov2025)}백만
                </div>
                <div className={`text-xs font-semibold mt-1 ${
                  growthRate >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {growthRate >= 0 ? '▲' : '▼'} {Math.abs(growthRate)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 상권의 매장 목록 */}
      {selectedStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedStats.area} 매장 상세
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                총 {selectedStats.storeCount}개 매장 • 25년 11월 {formatMillion(selectedStats.totalNov2025)}백만 • 
                {selectedStats.growthRate >= 0 ? ' 🔼' : ' 🔽'} {Math.abs(selectedStats.growthRate)}% 
                {selectedStats.growthRate >= 0 ? '성장' : '감소'}
              </p>
            </div>
            <button
              onClick={() => setSelectedArea(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-blue-100 border-b-2 border-purple-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">순위</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">매장명</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">25년 11월<br/>(백만원)</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">24년 11월<br/>(백만원)</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">전년 대비</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">증감액<br/>(백만원)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedStats.stores.map((store, index) => {
                  const diff = store.nov2025 - store.nov2024;
                  const isPositive = diff >= 0;

                  return (
                    <tr 
                      key={index}
                      className={`hover:bg-purple-50 transition-colors ${
                        index === 0 ? 'bg-yellow-50 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {index + 1}
                        {index === 0 && ' 🥇'}
                        {index === 1 && ' 🥈'}
                        {index === 2 && ' 🥉'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {store.storeName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-blue-700">
                        {formatMillion(store.nov2025)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {formatMillion(store.nov2024)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                          isPositive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {isPositive ? '+' : ''}{store.growthRate}%
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-center text-sm font-semibold ${
                        isPositive ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isPositive ? '+' : ''}{formatMillion(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 요약 통계 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-semibold">25년 11월 총 매출</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {formatMillion(selectedStats.totalNov2025)}백만원
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <div className="text-sm text-gray-700 font-semibold">24년 11월 총 매출</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatMillion(selectedStats.totalNov2024)}백만원
              </div>
            </div>
            <div className={`bg-gradient-to-br p-4 rounded-lg ${
              selectedStats.growthRate >= 0 
                ? 'from-green-50 to-green-100' 
                : 'from-red-50 to-red-100'
            }`}>
              <div className={`text-sm font-semibold ${
                selectedStats.growthRate >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                전년 대비 증감률
              </div>
              <div className={`text-2xl font-bold mt-1 ${
                selectedStats.growthRate >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {selectedStats.growthRate >= 0 ? '+' : ''}{selectedStats.growthRate}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

