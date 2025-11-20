"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie, Sector,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { 
  MapPin, Building2, TrendingUp, DollarSign, Package,
  Users, Globe, Filter, Download, RefreshCw
} from "lucide-react";

// Plotly를 동적으로 로드 (SSR 방지)
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[700px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700 font-medium">3D 그래프 로딩 중...</p>
      </div>
    </div>
  )
});

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
  // 등급 정보
  departmentGrade?: string;  // 백화점등급: S, A, B, C
  salesGrade?: string;        // 매출등급: A, B, C, D
  areaGrade?: string;         // 매장평수등급: A, B, C, D
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

// 매장별 등급 매핑 (샘플 데이터 - 나중에 API에서 가져오기)
const STORE_GRADES: { [key: string]: { dept: string; sales: string; area: string } } = {
  "신세계강남": { dept: "S", sales: "A", area: "B" },
  "신세계센텀": { dept: "A", sales: "A", area: "B" },
  "현대판교": { dept: "A", sales: "B", area: "A" },
  "롯데대구": { dept: "C", sales: "C", area: "B" },
  // 추가 매장은 자동 계산으로 처리
};

// 등급을 숫자로 변환
const gradeToNumber = (grade: string): number => {
  const map: { [key: string]: number } = { "S": 5, "A": 4, "B": 3, "C": 2, "D": 1 };
  return map[grade] || 0;
};

// 매출액 기반 자동 등급 계산
const calculateSalesGrade = (sales: number, maxSales: number): string => {
  const ratio = sales / maxSales;
  if (ratio >= 0.8) return "A";
  if (ratio >= 0.6) return "B";
  if (ratio >= 0.4) return "C";
  return "D";
};

// 백화점등급 자동 계산 (브랜드 기반)
const calculateDeptGrade = (storeName: string): string => {
  if (storeName.includes("신세계강남") || storeName.includes("현대본점")) return "S";
  if (storeName.includes("신세계") || storeName.includes("현대") || storeName.includes("롯데본점")) return "A";
  if (storeName.includes("갤러리아") || storeName.includes("AK")) return "B";
  return "C";
};

// 매장평수등급 자동 계산 (판매수량 기반)
const calculateAreaGrade = (quantity: number, maxQuantity: number): string => {
  const ratio = quantity / maxQuantity;
  if (ratio >= 0.8) return "A";
  if (ratio >= 0.6) return "B";
  if (ratio >= 0.4) return "C";
  return "D";
};

export default function StoreDistributionDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklySalesData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("전체");
  const [viewMode, setViewMode] = useState<"3d" | "map" | "chart">("chart");
  const [plotlyError, setPlotlyError] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch("/api/weekly-sales");
        const result = await response.json();
        
        if (result.success) {
          // 최대값 계산
          const maxSales = Math.max(...result.stores.map((s: StoreData) => s.totalSales));
          const maxQuantity = Math.max(...result.stores.map((s: StoreData) => s.totalQuantity));
          
          // 등급 계산 및 3D 좌표 설정
          const storesWithGrades = result.stores.map((store: StoreData) => {
            // 매장명에서 간단한 키 추출
            const storeKey = Object.keys(STORE_GRADES).find(key => 
              store.storeName.includes(key)
            );
            
            let departmentGrade, salesGrade, areaGrade;
            
            if (storeKey && STORE_GRADES[storeKey]) {
              // 샘플 데이터 사용
              departmentGrade = STORE_GRADES[storeKey].dept;
              salesGrade = STORE_GRADES[storeKey].sales;
              areaGrade = STORE_GRADES[storeKey].area;
            } else {
              // 자동 계산
              departmentGrade = calculateDeptGrade(store.storeName);
              salesGrade = calculateSalesGrade(store.totalSales, maxSales);
              areaGrade = calculateAreaGrade(store.totalQuantity, maxQuantity);
            }
            
            return {
              ...store,
              departmentGrade,
              salesGrade,
              areaGrade,
              x: gradeToNumber(departmentGrade),  // 백화점등급
              y: gradeToNumber(salesGrade),        // 매출등급
              z: gradeToNumber(areaGrade) * 200    // 매장평수등급 (버블 크기)
            };
          });
          
          setData({
            ...result,
            stores: storesWithGrades
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

      {/* 3D 뷰 - 진짜 3D Scatter Plot */}
      {viewMode === "3d" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Globe className="w-6 h-6 text-purple-600" />
              매장 3차원 등급 분포도 (실제 3D)
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>X축: 백화점등급 (S=5, A=4, B=3, C=2, D=1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Y축: 매출등급 (A=4, B=3, C=2, D=1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Z축: 매장평수등급 (A=4, B=3, C=2, D=1)</span>
              </div>
            </div>
            <p className="text-sm text-purple-600 mt-2">
              🖱️ 마우스로 3D 그래프를 회전하고 확대/축소할 수 있습니다!
            </p>
          </div>
          
          {/* Plotly 3D Scatter */}
          <div style={{ width: '100%', height: '700px' }}>
            <Plot
              data={data.byRegion.map(region => {
                const regionStores = filteredStores.filter(s => s.region === region.region);
                return {
                  type: 'scatter3d',
                  mode: 'markers',
                  name: region.region,
                  x: regionStores.map(s => s.x),
                  y: regionStores.map(s => s.y),
                  z: regionStores.map(s => gradeToNumber(s.areaGrade || 'C')),
                  text: regionStores.map(s => 
                    `${s.storeName}<br>` +
                    `백화점등급: ${s.departmentGrade}<br>` +
                    `매출등급: ${s.salesGrade}<br>` +
                    `매장평수등급: ${s.areaGrade}<br>` +
                    `매출액: ${(s.totalSales / 100000000).toFixed(2)}억원<br>` +
                    `판매수량: ${s.totalQuantity.toLocaleString()}개`
                  ),
                  marker: {
                    size: regionStores.map(s => gradeToNumber(s.areaGrade || 'C') * 3),
                    color: regionColors[region.region] || '#6b7280',
                    opacity: 0.8,
                    line: {
                      color: 'white',
                      width: 0.5
                    }
                  },
                  hovertemplate: '<b>%{text}</b><extra></extra>'
                } as any;
              })}
              layout={{
                autosize: true,
                scene: {
                  xaxis: {
                    title: { text: '백화점등급 (Department Grade)' },
                    ticktext: ['D', 'C', 'B', 'A', 'S'],
                    tickvals: [1, 2, 3, 4, 5],
                    range: [0, 6]
                  },
                  yaxis: {
                    title: { text: '매출등급 (Sales Grade)' },
                    ticktext: ['D', 'C', 'B', 'A'],
                    tickvals: [1, 2, 3, 4],
                    range: [0, 5]
                  },
                  zaxis: {
                    title: { text: '매장평수등급 (Area Grade)' },
                    ticktext: ['D', 'C', 'B', 'A'],
                    tickvals: [1, 2, 3, 4],
                    range: [0, 5]
                  },
                  camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.3 }
                  }
                },
                showlegend: true,
                legend: {
                  x: 1.02,
                  y: 1
                },
                margin: {
                  l: 0,
                  r: 0,
                  b: 0,
                  t: 40
                },
                title: {
                  text: '매장별 3차원 등급 분석',
                  font: { size: 18 }
                }
              } as any}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['toImage'],
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* 범례 및 설명 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">🏢 백화점 등급 (X축)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>S:</strong> 신세계강남 등 초프리미엄</p>
                <p><strong>A:</strong> 신세계센텀, 현대판교 등</p>
                <p><strong>B:</strong> 갤러리아, AK 등</p>
                <p><strong>C:</strong> 롯데대구 등</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">💰 매출 등급 (Y축)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>A:</strong> 최상위 80% 이상</p>
                <p><strong>B:</strong> 상위 60-80%</p>
                <p><strong>C:</strong> 중위 40-60%</p>
                <p><strong>D:</strong> 40% 미만</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">📏 매장평수 등급 (버블 크기)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>A:</strong> 대형 매장 (큰 버블)</p>
                <p><strong>B:</strong> 중형 매장 (중간 버블)</p>
                <p><strong>C:</strong> 소형 매장 (작은 버블)</p>
                <p className="text-gray-500 italic mt-2">* 판매수량 기준 추정</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>샘플 매장 확인:</strong> 
              <span className="font-semibold"> 신세계강남(S-A-B)</span>, 
              <span className="font-semibold"> 신세계센텀(A-A-B)</span>, 
              <span className="font-semibold"> 현대판교(A-B-A)</span>, 
              <span className="font-semibold"> 롯데대구(C-C-B)</span> 
              매장을 클릭해서 등급을 확인해보세요!
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

