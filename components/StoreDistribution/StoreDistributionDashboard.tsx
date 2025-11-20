"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie, Sector,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { 
  MapPin, Building2, TrendingUp, DollarSign, Package,
  Users, Globe, Filter, Download, RefreshCw
} from "lucide-react";

interface StoreData {
  storeCode: string;
  storeName: string;
  region: string;
  storeType: string;
  brand: string;
  totalSales: number;
  totalQuantity: number;
  totalTransactions: number;
  x?: number;  // 3D 좌표용
  y?: number;
  z?: number;
}

interface WeeklySalesData {
  summary: {
    startDate: string;
    endDate: string;
    totalSales: number;
    totalQuantity: number;
    totalTransactions: number;
    storeCount: number;
  };
  stores: StoreData[];
  byRegion: Array<{
    region: string;
    totalSales: number;
    totalQuantity: number;
    storeCount: number;
  }>;
}

export default function StoreDistributionDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklySalesData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("전체");
  const [viewMode, setViewMode] = useState<"3d" | "map" | "chart">("3d");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch("/api/weekly-sales");
        const result = await response.json();
        
        if (result.success) {
          // 3D 좌표 계산 (가상 좌표 - 실제로는 실제 위경도 데이터 필요)
          const storesWithCoords = result.stores.map((store: StoreData, idx: number) => ({
            ...store,
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            z: store.totalSales / 10000000, // 매출액을 높이로 표현
          }));
          
          setData({
            ...result,
            stores: storesWithCoords
          });
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700 font-medium">
            매장 분포 데이터 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const filteredStores = selectedRegion === "전체" 
    ? data.stores 
    : data.stores.filter(s => s.region === selectedRegion);

  // 상위 20개 매장
  const top20Stores = [...data.stores]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 20);

  // 지역별 색상
  const regionColors: { [key: string]: string } = {
    "서울": "#8b5cf6",
    "경기": "#3b82f6",
    "인천": "#06b6d4",
    "부산/경남": "#10b981",
    "대구/경북": "#f59e0b",
    "광주/전라": "#ef4444",
    "대전/충청": "#ec4899",
    "강원": "#6366f1",
    "제주": "#14b8a6",
    "기타": "#6b7280"
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-10 h-10" />
            <div>
              <h2 className="text-3xl font-bold">백화점 분포도</h2>
              <p className="text-purple-100 mt-1">
                전국 {data.summary.storeCount}개 매장 3D 시각화
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100">데이터 기간</p>
            <p className="text-lg font-semibold">
              {data.summary.startDate} ~ {data.summary.endDate}
            </p>
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold text-gray-700">총 매장 수</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.summary.storeCount}
            <span className="text-lg text-gray-500 ml-2">개</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-700">총 매출액</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(data.summary.totalSales / 100000000).toFixed(1)}
            <span className="text-lg text-gray-500 ml-2">억원</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-700">총 판매수량</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(data.summary.totalQuantity / 10000).toFixed(1)}
            <span className="text-lg text-gray-500 ml-2">만개</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-orange-600" />
            <h3 className="font-semibold text-gray-700">총 거래건수</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(data.summary.totalTransactions / 10000).toFixed(1)}
            <span className="text-lg text-gray-500 ml-2">만건</span>
          </p>
        </div>
      </div>

      {/* 필터 및 뷰 모드 선택 */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">지역 필터:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="전체">전체</option>
              {data.byRegion.map(r => (
                <option key={r.region} value={r.region}>
                  {r.region} ({r.storeCount}개)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "3d"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📊 3D 뷰
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "map"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🗺️ 지도 뷰
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "chart"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📈 차트 뷰
            </button>
          </div>
        </div>
      </div>

      {/* 3D 뷰 - 버블 차트 (3D 효과) */}
      {viewMode === "3d" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            매장별 매출 3D 분포도
            <span className="text-sm text-gray-500 font-normal ml-2">
              (버블 크기 = 매출액, 높이 = 판매수량)
            </span>
          </h3>
          
          <ResponsiveContainer width="100%" height={600}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X 좌표" 
                label={{ value: '지역 분포 (가상 좌표)', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y 좌표"
                label={{ value: '지역 내 위치 (가상 좌표)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis 
                type="number" 
                dataKey="totalSales" 
                range={[100, 2000]} 
                name="매출액" 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-bold text-gray-900 mb-2">{data.storeName}</p>
                        <p className="text-sm text-gray-600">지역: {data.region}</p>
                        <p className="text-sm text-gray-600">유형: {data.storeType}</p>
                        <p className="text-sm text-purple-600 font-semibold mt-2">
                          매출액: {(data.totalSales / 100000000).toFixed(2)}억원
                        </p>
                        <p className="text-sm text-blue-600">
                          판매수량: {data.totalQuantity.toLocaleString()}개
                        </p>
                        <p className="text-sm text-green-600">
                          거래건수: {data.totalTransactions.toLocaleString()}건
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {data.byRegion.map(region => {
                const regionStores = filteredStores.filter(s => s.region === region.region);
                return (
                  <Scatter
                    key={region.region}
                    name={region.region}
                    data={regionStores}
                    fill={regionColors[region.region] || "#6b7280"}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>3D 시각화 안내:</strong> 버블의 크기는 매출액을 나타내며, 
              각 지역별로 색상이 구분됩니다. 마우스를 올려 상세 정보를 확인하세요.
              향후 실제 지도 좌표 데이터가 추가되면 정확한 위치 기반 시각화가 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* 지도 뷰 */}
      {viewMode === "map" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            지역별 매장 지도 (개발 예정)
          </h3>
          
          <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                실제 지도 시각화 준비 중
              </p>
              <p className="text-gray-500">
                Kakao Map 또는 Naver Map API를 연동하여<br />
                실제 매장 위치를 지도에 표시할 예정입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 차트 뷰 */}
      {viewMode === "chart" && (
        <div className="space-y-6">
          {/* Top 20 매장 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Top 20 매출 매장
            </h3>
            
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={top20Stores}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="storeName" 
                  angle={-45}
                  textAnchor="end"
                  height={150}
                  interval={0}
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  label={{ value: '매출액 (억원)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => (value / 100000000).toFixed(2) + '억원'}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="totalSales" name="매출액">
                  {top20Stores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={regionColors[entry.region] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 지역별 분포 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">지역별 매출 분포</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={data.byRegion}
                    dataKey="totalSales"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.region} (${entry.storeCount}개)`}
                  >
                    {data.byRegion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={regionColors[entry.region] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => (value / 100000000).toFixed(2) + '억원'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {data.byRegion
                  .sort((a, b) => b.totalSales - a.totalSales)
                  .map((region, idx) => (
                    <div 
                      key={region.region}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: regionColors[region.region] }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{region.region}</p>
                          <p className="text-sm text-gray-500">{region.storeCount}개 매장</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {(region.totalSales / 100000000).toFixed(1)}억원
                        </p>
                        <p className="text-sm text-gray-500">
                          {region.totalQuantity.toLocaleString()}개
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

