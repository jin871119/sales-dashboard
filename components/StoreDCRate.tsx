"use client";

import { useState, useMemo } from "react";
import { Store, Search, ChevronDown, ChevronUp } from "lucide-react";

interface StoreDCRateData {
  area: string;
  stores: {
    storeName: string;
    realPrice?: number;      // 실판가
    tagPrice?: number;       // 택가
    dcRate?: number;         // DC율
    lastYearDcRate?: number; // 전년DC율
    difference?: number;     // 전년대비차이
  }[];
}

interface StoreDCRateProps {
  data: StoreDCRateData[];
}

export default function StoreDCRate({ data }: StoreDCRateProps) {
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<{ [area: string]: string }>({});

  // "도매"와 "면세+도매" 상권 필터링
  const filteredData = useMemo(() => {
    return data.filter(areaData => 
      areaData.area !== '도매' && areaData.area !== '면세+도매'
    );
  }, [data]);

  const toggleArea = (area: string) => {
    if (expandedAreas.includes(area)) {
      setExpandedAreas(expandedAreas.filter(a => a !== area));
    } else {
      setExpandedAreas([...expandedAreas, area]);
    }
  };

  const handleSearchChange = (area: string, query: string) => {
    setSearchQuery(prev => ({
      ...prev,
      [area]: query
    }));
  };

  const filteredStores = (area: string, stores: StoreDCRateData['stores']) => {
    const query = searchQuery[area]?.toLowerCase() || '';
    if (!query) return stores;
    return stores.filter(store =>
      store.storeName.toLowerCase().includes(query)
    );
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
        <div className="p-6 bg-gradient-to-r from-gray-100 to-gray-200">
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            매장별 DC율
          </h3>
          <p className="text-sm text-gray-600 mt-2">데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all">
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all"
        onClick={() => {
          if (expandedAreas.length === filteredData.length) {
            setExpandedAreas([]);
          } else {
            setExpandedAreas(filteredData.map(d => d.area));
          }
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="text-2xl font-black text-white drop-shadow-md">매장별 DC율</h3>
            <p className="text-sm text-white/90 font-medium mt-1">
              총 {filteredData.length}개 상권, {filteredData.reduce((sum, area) => sum + area.stores.length, 0)}개 매장
            </p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full p-2">
          {expandedAreas.length === filteredData.length ? (
            <ChevronUp className="w-6 h-6 text-white" />
          ) : (
            <ChevronDown className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* 상권별 섹션 */}
      {filteredData.map((areaData) => {
        const isExpanded = expandedAreas.includes(areaData.area);
        const filtered = filteredStores(areaData.area, areaData.stores);

        return (
          <div key={areaData.area} className="border-b border-gray-200 last:border-b-0">
            {/* 상권 헤더 */}
            <div
              className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all"
              onClick={() => toggleArea(areaData.area)}
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-bold text-gray-900">
                  {areaData.area}
                </h4>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {areaData.stores.length}개 매장
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isExpanded && (
                  <div className="text-sm text-gray-600">
                    검색 결과: {filtered.length}개
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>

            {/* 매장 리스트 */}
            {isExpanded && (
              <div className="p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                {/* 검색 바 */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`${areaData.area} 매장 검색...`}
                      value={searchQuery[areaData.area] || ''}
                      onChange={(e) => handleSearchChange(areaData.area, e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* 매장 테이블 */}
                {filtered.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-gray-800 border-r-2 border-blue-300 sticky left-0 bg-gradient-to-r from-blue-100 to-indigo-100 z-10">
                              순위
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-800 border-r border-blue-200 sticky left-[50px] sm:left-[60px] bg-white z-10">
                              매장명
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold text-gray-800 border-r border-blue-200 whitespace-nowrap">
                              실판가
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold text-gray-800 border-r border-blue-200 whitespace-nowrap">
                              택가
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold text-gray-800 border-r border-blue-200 whitespace-nowrap">
                              DC율 (%)
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold text-gray-800 border-r border-blue-200 whitespace-nowrap">
                              전년DC율 (%)
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap">
                              전년대비차이 (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filtered.map((store, idx) => (
                            <tr
                              key={store.storeName}
                              className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                            >
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-900 text-center border-r-2 border-blue-200 sticky left-0 bg-white z-10">
                                {idx + 1}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-blue-100 sticky left-[50px] sm:left-[60px] bg-white z-10">
                                {store.storeName}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-700 border-r border-blue-100 whitespace-nowrap">
                                {store.realPrice !== undefined && store.realPrice > 0 
                                  ? `₩${Math.round(store.realPrice).toLocaleString()}` 
                                  : '-'}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-700 border-r border-blue-100 whitespace-nowrap">
                                {store.tagPrice !== undefined && store.tagPrice > 0 
                                  ? `₩${Math.round(store.tagPrice).toLocaleString()}` 
                                  : '-'}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-700 border-r border-blue-100 whitespace-nowrap">
                                {store.dcRate !== undefined && !isNaN(store.dcRate) ? (
                                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                                    store.dcRate >= 20 ? 'bg-red-100 text-red-800' :
                                    store.dcRate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {store.dcRate.toFixed(1)}%
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-700 border-r border-blue-100 whitespace-nowrap">
                                {store.lastYearDcRate !== undefined && !isNaN(store.lastYearDcRate) ? (
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-100 text-gray-800">
                                    {store.lastYearDcRate.toFixed(1)}%
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-700 whitespace-nowrap">
                                {store.difference !== undefined && !isNaN(store.difference) ? (
                                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                                    store.difference > 0 ? 'bg-red-100 text-red-800' :
                                    store.difference < 0 ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {store.difference >= 0 ? '+' : ''}{store.difference.toFixed(1)}%
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border-2 border-gray-200">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">검색 결과가 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">다른 검색어를 시도해보세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

