"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Store,
  Calendar,
  Package,
  Activity,
  BarChart3
} from "lucide-react";
import MetricCard from "../MetricCard";

interface WeeklySalesData {
  totalSales: number;
  totalQuantity: number;
  averagePrice: number;
  returnRate: number;
  dateRange: {
    start: string;
    end: string;
    dates: string[];
  };
  dailyTotals: {
    date: string;
    sales: number;
    quantity: number;
    transactions: number;
  }[];
  storeStats: any[];
  storeTypeStats: any[];
  departmentBrandStats: any[];
  regionStats: any[];
  onlineOfflineStats: any;
  itemStats: any[];
  seasonStats: any[];
  bestSellers: any[];
}

export default function WeeklySalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklySalesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "stores" | "products">("overview");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/weekly-sales?view=analytics");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '데이터 로드 실패');
        }
        
        const result = await response.json();
        setData(result);
      } catch (error: any) {
        console.error("데이터 로딩 실패:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 w-6 h-6 animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-700 font-medium">
            📊 일주월별 판매 데이터 로딩 중...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            192개 매장 데이터를 분석하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">데이터 로드 실패</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              💡 mw_일주월별_판매 엑셀 파일이 프로젝트 루트 폴더에 있는지 확인하세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📅 일주월별 판매 대시보드
            </h2>
            <p className="text-gray-600">
              기간: {data.dateRange.start} ~ {data.dateRange.end} ({data.dateRange.dates.length}일)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              총 {data.storeStats.length}개 매장의 판매 데이터 분석
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

      {/* 서브 탭 */}
      <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeSubTab === "overview"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          📊 전체 현황
        </button>
        <button
          onClick={() => setActiveSubTab("stores")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeSubTab === "stores"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          🏬 매장 분석
        </button>
        <button
          onClick={() => setActiveSubTab("products")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeSubTab === "products"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          📦 제품 분석
        </button>
      </div>

      {/* 전체 현황 */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="총 판매액"
              value={`₩${Math.round(data.totalSales / 1000000).toLocaleString()}M`}
              subtitle={`${data.totalSales.toLocaleString()}원`}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
            />
            <MetricCard
              title="총 판매수량"
              value={data.totalQuantity.toLocaleString()}
              subtitle="개"
              icon={<ShoppingCart className="w-6 h-6" />}
              color="green"
            />
            <MetricCard
              title="평균 객단가"
              value={`₩${Math.round(data.averagePrice / 1000).toLocaleString()}K`}
              subtitle={`${Math.round(data.averagePrice).toLocaleString()}원`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="purple"
            />
            <MetricCard
              title="반품률"
              value={`${data.returnRate.toFixed(2)}%`}
              subtitle="전체 판매 대비"
              icon={<Activity className="w-6 h-6" />}
              color="orange"
            />
          </div>

          {/* 일별 판매 추이 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              일별 판매 추이
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">거래건수</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.dailyTotals.slice().reverse().map((day, idx) => (
                    <tr key={day.date} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{day.date}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ₩{Math.round(day.sales / 1000).toLocaleString()}K
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {day.quantity.toLocaleString()}개
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {day.transactions.toLocaleString()}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 매장 유형별 성과 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-600" />
              매장 유형별 성과
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">매장수</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">매장평균</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.storeTypeStats.map((type, idx) => (
                    <tr key={type.type} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{type.typeLabel}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{type.storeCount}개</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ₩{Math.round(type.sales / 1000000).toLocaleString()}M
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {type.share.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ₩{Math.round(type.averagePerStore / 1000).toLocaleString()}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 백화점 브랜드 비교 */}
          {data.departmentBrandStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                백화점 브랜드 비교
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">브랜드</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">매장수</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.departmentBrandStats.map((brand, idx) => (
                      <tr key={brand.brand} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{brand.brand}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{brand.storeCount}개</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          ₩{Math.round(brand.sales / 1000000).toLocaleString()}M
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {brand.share.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 매장 분석 */}
      {activeSubTab === "stores" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              매장별 판매 순위 (Top 30)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">매장명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">유형</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.storeStats.slice(0, 30).map((store, idx) => (
                    <tr key={store.storeCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{store.rank}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {store.storeName}
                        {store.storeRegion && (
                          <span className="ml-2 text-xs text-gray-500">({store.storeRegion})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {store.storeType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                        ₩{Math.round(store.sales / 1000).toLocaleString()}K
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {store.quantity.toLocaleString()}개
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {store.share.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              전체 {data.storeStats.length}개 매장 중 상위 30개 매장 표시
            </p>
          </div>
        </div>
      )}

      {/* 제품 분석 */}
      {activeSubTab === "products" && (
        <div className="space-y-6">
          {/* 베스트셀러 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              베스트셀러 Top 20
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">시즌</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매수량</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.bestSellers.slice(0, 20).map((product, idx) => (
                    <tr key={product.productCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product.productName}
                        <div className="text-xs text-gray-500">{product.productCode}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {product.item}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {product.season}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                        {product.quantity.toLocaleString()}개
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ₩{Math.round(product.sales / 1000).toLocaleString()}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 아이템 카테고리별 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              아이템 카테고리별 판매 (Top 15)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.itemStats.slice(0, 15).map((item, idx) => (
                    <tr key={item.item} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ₩{Math.round(item.sales / 1000000).toLocaleString()}M
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {item.quantity.toLocaleString()}개
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          {item.share.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

