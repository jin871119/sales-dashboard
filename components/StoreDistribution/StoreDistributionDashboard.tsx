"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie, Sector,
  ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
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
  commercialArea?: string; // 상권 정보 추가
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
  byCommercialArea?: Array<{
    commercialArea: string;
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
  const [selectedCommercialArea, setSelectedCommercialArea] = useState<string>("전체"); // 상권 필터 추가
  const [viewMode, setViewMode] = useState<"3d" | "map" | "chart">("chart");
  const [plotlyError, setPlotlyError] = useState<boolean>(false);
  const [hiddenStores, setHiddenStores] = useState<Set<string>>(new Set());
  const [storePositions, setStorePositions] = useState<Map<string, { x: number; y: number; z: number; opacity: number }>>(new Map());
  const [selectedStore1, setSelectedStore1] = useState<string | null>(null); // 주 매장
  const [selectedStore2, setSelectedStore2] = useState<string | null>(null); // 비교군 매장
  const plotRef = useRef<any>(null);

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

  // 테스트용 매장 10개 생성 (항상 표시)
  const testStores: StoreData[] = [
    { storeCode: 'TEST1', storeName: '테스트 매장 1 (S-A-A)', region: '서울', storeType: '백화점', brand: '신세계', totalSales: 150000000, totalQuantity: 15000, totalTransactions: 1500, departmentGrade: 'S', salesGrade: 'A', areaGrade: 'A', x: 5, y: 4, z: 4 },
    { storeCode: 'TEST2', storeName: '테스트 매장 2 (A-A-B)', region: '서울', storeType: '백화점', brand: '현대', totalSales: 120000000, totalQuantity: 12000, totalTransactions: 1200, departmentGrade: 'A', salesGrade: 'A', areaGrade: 'B', x: 4, y: 4, z: 3 },
    { storeCode: 'TEST3', storeName: '테스트 매장 3 (A-B-A)', region: '경기', storeType: '백화점', brand: '롯데', totalSales: 100000000, totalQuantity: 10000, totalTransactions: 1000, departmentGrade: 'A', salesGrade: 'B', areaGrade: 'A', x: 4, y: 3, z: 4 },
    { storeCode: 'TEST4', storeName: '테스트 매장 4 (B-B-B)', region: '경기', storeType: '백화점', brand: '갤러리아', totalSales: 80000000, totalQuantity: 8000, totalTransactions: 800, departmentGrade: 'B', salesGrade: 'B', areaGrade: 'B', x: 3, y: 3, z: 3 },
    { storeCode: 'TEST5', storeName: '테스트 매장 5 (B-C-C)', region: '부산', storeType: '백화점', brand: 'AK', totalSales: 60000000, totalQuantity: 6000, totalTransactions: 600, departmentGrade: 'B', salesGrade: 'C', areaGrade: 'C', x: 3, y: 2, z: 2 },
    { storeCode: 'TEST6', storeName: '테스트 매장 6 (C-C-C)', region: '대구', storeType: '백화점', brand: '롯데', totalSales: 50000000, totalQuantity: 5000, totalTransactions: 500, departmentGrade: 'C', salesGrade: 'C', areaGrade: 'C', x: 2, y: 2, z: 2 },
    { storeCode: 'TEST7', storeName: '테스트 매장 7 (C-C-D)', region: '광주', storeType: '백화점', brand: '신세계', totalSales: 40000000, totalQuantity: 4000, totalTransactions: 400, departmentGrade: 'C', salesGrade: 'C', areaGrade: 'D', x: 2, y: 2, z: 1 },
    { storeCode: 'TEST8', storeName: '테스트 매장 8 (C-D-D)', region: '대전', storeType: '백화점', brand: '현대', totalSales: 30000000, totalQuantity: 3000, totalTransactions: 300, departmentGrade: 'C', salesGrade: 'D', areaGrade: 'D', x: 2, y: 1, z: 1 },
    { storeCode: 'TEST9', storeName: '테스트 매장 9 (D-D-D)', region: '인천', storeType: '백화점', brand: '롯데', totalSales: 20000000, totalQuantity: 2000, totalTransactions: 200, departmentGrade: 'D', salesGrade: 'D', areaGrade: 'D', x: 1, y: 1, z: 1 },
    { storeCode: 'TEST10', storeName: '테스트 매장 10 (D-D-D)', region: '강원', storeType: '백화점', brand: '갤러리아', totalSales: 10000000, totalQuantity: 1000, totalTransactions: 100, departmentGrade: 'D', salesGrade: 'D', areaGrade: 'D', x: 1, y: 1, z: 1 }
  ];

  // 테스트 모드: 항상 테스트 데이터 사용
  const useTestData = true;
  
  if (!data && !useTestData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 필터링 로직 수정 (테스트 모드: 항상 테스트 데이터 사용)
  const storesToUse = useTestData ? testStores : (data?.stores || []);
  
  const filteredStores = storesToUse.filter(s => {
    const matchRegion = selectedRegion === "전체" || s.region === selectedRegion;
    const matchArea = selectedCommercialArea === "전체" || s.commercialArea === selectedCommercialArea;
    return matchRegion && matchArea;
  });

  // 상위 20개 매장
  const top20Stores = [...filteredStores] // 필터링된 매장 기준으로 Top 20 다시 계산
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
                {useTestData ? '테스트 모드: 10개 매장' : (data ? `전국 ${data.summary.storeCount}개 매장` : '10개 매장')} 3D 시각화
              </p>
              {useTestData && (
                <p className="text-yellow-200 mt-2 text-sm">
                  🧪 테스트 모드: 하위 3개 매장(8, 9, 10번)이 제거됩니다
                </p>
              )}
            </div>
          </div>
          {!useTestData && data && (
            <div className="text-right">
              <p className="text-sm text-purple-100">데이터 기간</p>
              <p className="text-lg font-semibold">
                {data.summary.startDate} ~ {data.summary.endDate}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPI 카드 */}
      {!useTestData && data && (
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
      )}

      {/* 필터 및 뷰 모드 선택 */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            
            {/* 지역 필터 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-gray-700 text-sm">지역:</span>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  // 지역이 바뀌면 상권은 '전체'로 초기화하는 것이 자연스러움 (선택 사항)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="전체">전체</option>
                {(useTestData ? [{ region: '테스트', storeCount: 10 }] : (data?.byRegion || [])).map(r => (
                  <option key={r.region} value={r.region}>
                    {r.region} ({r.storeCount})
                  </option>
                ))}
              </select>
            </div>

            {/* 상권 필터 (새로 추가) */}
            {!useTestData && data?.byCommercialArea && data.byCommercialArea.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ml-2">
                <span className="font-semibold text-gray-700 text-sm">상권:</span>
                <select
                  value={selectedCommercialArea}
                  onChange={(e) => setSelectedCommercialArea(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="전체">전체</option>
                  {data.byCommercialArea.map(a => (
                    <option key={a.commercialArea} value={a.commercialArea}>
                      {a.commercialArea} ({a.storeCount})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              🖱️ 마우스로 3D 그래프를 회전하고 확대/축소할 수 있습니다! 더블클릭으로 특정 매장을 제거할 수 있습니다!
            </p>
            <div className="mt-3">
              <button
                onClick={() => {
                  // 등급 점수 계산 (낮을수록 하위)
                  const storesWithScore = filteredStores
                    .filter(s => !hiddenStores.has(s.storeCode))
                    .map(store => {
                      const deptScore = gradeToNumber(store.departmentGrade || 'C');
                      const salesScore = gradeToNumber(store.salesGrade || 'C');
                      const areaScore = gradeToNumber(store.areaGrade || 'C');
                      const totalScore = deptScore + salesScore + areaScore; // 낮을수록 하위
                      return { store, totalScore };
                    })
                    .sort((a, b) => a.totalScore - b.totalScore); // 오름차순 정렬
                  
                  // 하위 3개 선택
                  const bottom3 = storesWithScore.slice(0, 3);
                  
                  if (bottom3.length === 0) return;
                  
                  // 애니메이션을 위한 위치 저장
                  const newPositions = new Map(storePositions);
                  bottom3.forEach(({ store }) => {
                    const currentX = store.x || gradeToNumber(store.departmentGrade || 'C');
                    const currentY = store.y || gradeToNumber(store.salesGrade || 'C');
                    const currentZ = store.z || gradeToNumber(store.areaGrade || 'C');
                    newPositions.set(store.storeCode, {
                      x: currentX,
                      y: currentY,
                      z: currentZ,
                      opacity: 1
                    });
                  });
                  setStorePositions(newPositions);
                  
                  // 애니메이션: 오른쪽으로 천천히 이동하면서 사라지기
                  bottom3.forEach(({ store }, index) => {
                    const startX = store.x || gradeToNumber(store.departmentGrade || 'C');
                    const startY = store.y || gradeToNumber(store.salesGrade || 'C');
                    const startZ = store.z || gradeToNumber(store.areaGrade || 'C');
                    // 그래프 범위 내에서만 이동 (X축 최대값 6을 넘지 않도록)
                    const maxX = 6;
                    const targetX = Math.min(maxX, startX + 5); // 오른쪽으로 이동하되 범위 내에서만
                    const duration = 4000; // 4초로 천천히
                    const startTime = Date.now() + (index * 300); // 순차적으로 시작 (300ms 간격)
                    
                    const animate = () => {
                      const now = Date.now();
                      const elapsed = now - startTime;
                      
                      if (elapsed < 0) {
                        requestAnimationFrame(animate);
                        return;
                      }
                      
                      if (elapsed >= duration) {
                        // 애니메이션 완료
                        setHiddenStores(prev => {
                          const newSet = new Set(prev);
                          newSet.add(store.storeCode);
                          return newSet;
                        });
                        setStorePositions(prev => {
                          const newMap = new Map(prev);
                          newMap.delete(store.storeCode);
                          return newMap;
                        });
                        return;
                      }
                      
                      // 진행률 계산 (0 ~ 1)
                      const progress = elapsed / duration;
                      // 더 부드러운 ease-out 효과
                      const easeProgress = 1 - Math.pow(1 - progress, 2); // ease-out quadratic
                      
                      // 현재 위치 계산 (범위 내에서만)
                      const currentX = Math.min(maxX, startX + (targetX - startX) * easeProgress);
                      // 투명도는 더 빠르게 감소 (0.7 진행 시 완전히 투명)
                      const opacityProgress = Math.min(1, progress / 0.7);
                      const currentOpacity = Math.max(0, 1 - opacityProgress);
                      
                      // 위치 업데이트
                      setStorePositions(prev => {
                        const newMap = new Map(prev);
                        newMap.set(store.storeCode, {
                          x: currentX,
                          y: startY,
                          z: startZ,
                          opacity: currentOpacity
                        });
                        return newMap;
                      });
                      
                      requestAnimationFrame(animate);
                    };
                    
                    animate();
                  });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
              >
                하위 3개 매장 제거 (등급 기준)
              </button>
            </div>
          </div>
          
          {/* Plotly 3D Scatter */}
          <div style={{ width: '100%', height: '700px' }}>
            <Plot
              data={useTestData ? (() => {
                // 테스트 모드: 모든 매장을 하나의 trace로 표시
                const visibleStores = filteredStores.filter(s => !hiddenStores.has(s.storeCode));
                const storesWithAnimation = visibleStores.map(s => {
                  const animPos = storePositions.get(s.storeCode);
                  if (animPos) {
                    return {
                      ...s,
                      x: animPos.x,
                      y: animPos.y,
                      z: animPos.z,
                      opacity: animPos.opacity
                    };
                  }
                  return s;
                });
                
                return [{
                  type: 'scatter3d',
                  mode: 'markers',
                  name: '테스트 매장',
                  x: storesWithAnimation.map(s => s.x || gradeToNumber(s.departmentGrade || 'C')),
                  y: storesWithAnimation.map(s => s.y || gradeToNumber(s.salesGrade || 'C')),
                  z: storesWithAnimation.map(s => s.z || gradeToNumber(s.areaGrade || 'C')),
                  text: storesWithAnimation.map(s => 
                    `${s.storeName}<br>` +
                    `백화점등급: ${s.departmentGrade}<br>` +
                    `매출등급: ${s.salesGrade}<br>` +
                    `매장평수등급: ${s.areaGrade}<br>` +
                    `매출액: ${(s.totalSales / 100000000).toFixed(2)}억원<br>` +
                    `판매수량: ${s.totalQuantity.toLocaleString()}개`
                  ),
                  marker: {
                    size: storesWithAnimation.map(s => gradeToNumber(s.areaGrade || 'C') * 3),
                    color: storesWithAnimation.map(s => regionColors[s.region] || '#8b5cf6'),
                    opacity: storesWithAnimation.map(s => {
                      const animPos = storePositions.get(s.storeCode);
                      return animPos ? animPos.opacity : 0.8;
                    }),
                    line: {
                      color: 'white',
                      width: 0.5
                    }
                  },
                  hovertemplate: '<b>%{text}</b><extra></extra>',
                  customdata: storesWithAnimation.map(s => s.storeCode)
                } as any];
              })() : (data?.byRegion || []).map(region => {
                const regionStores = filteredStores
                  .filter(s => s.region === region.region && !hiddenStores.has(s.storeCode));
                
                // 애니메이션 중인 매장의 위치 업데이트
                const storesWithAnimation = regionStores.map(s => {
                  const animPos = storePositions.get(s.storeCode);
                  if (animPos) {
                    return {
                      ...s,
                      x: animPos.x,
                      y: animPos.y,
                      z: animPos.z,
                      opacity: animPos.opacity
                    };
                  }
                  return s;
                });
                
                return {
                  type: 'scatter3d',
                  mode: 'markers',
                  name: region.region,
                  x: storesWithAnimation.map(s => s.x || gradeToNumber(s.departmentGrade || 'C')),
                  y: storesWithAnimation.map(s => s.y || gradeToNumber(s.salesGrade || 'C')),
                  z: storesWithAnimation.map(s => s.z || gradeToNumber(s.areaGrade || 'C')),
                  text: storesWithAnimation.map(s => 
                    `${s.storeName}<br>` +
                    `백화점등급: ${s.departmentGrade}<br>` +
                    `매출등급: ${s.salesGrade}<br>` +
                    `매장평수등급: ${s.areaGrade}<br>` +
                    `매출액: ${(s.totalSales / 100000000).toFixed(2)}억원<br>` +
                    `판매수량: ${s.totalQuantity.toLocaleString()}개`
                  ),
                  marker: {
                    size: storesWithAnimation.map(s => gradeToNumber(s.areaGrade || 'C') * 3),
                    color: regionColors[region.region] || '#6b7280',
                    opacity: storesWithAnimation.map(s => {
                      const animPos = storePositions.get(s.storeCode);
                      return animPos ? animPos.opacity : 0.8;
                    }),
                    line: {
                      color: 'white',
                      width: 0.5
                    }
                  },
                  hovertemplate: '<b>%{text}</b><extra></extra>',
                  customdata: storesWithAnimation.map(s => s.storeCode) // 매장 코드 저장
                } as any;
              })}
              onUpdate={(figure: any) => {
                plotRef.current = figure;
              }}
              layout={{
                autosize: true,
                scene: {
                  xaxis: {
                    title: { text: '백화점등급 (Department Grade)' },
                    ticktext: ['D', 'C', 'B', 'A', 'S'],
                    tickvals: [1, 2, 3, 4, 5],
                    range: [0, 6],
                    autorange: false // 자동 범위 조정 비활성화 (그래프가 늘어나지 않도록)
                  },
                  yaxis: {
                    title: { text: '매출등급 (Sales Grade)' },
                    ticktext: ['D', 'C', 'B', 'A'],
                    tickvals: [1, 2, 3, 4],
                    range: [0, 5],
                    autorange: false // 자동 범위 조정 비활성화
                  },
                  zaxis: {
                    title: { text: '매장평수등급 (Area Grade)' },
                    ticktext: ['D', 'C', 'B', 'A'],
                    tickvals: [1, 2, 3, 4],
                    range: [0, 5],
                    autorange: false // 자동 범위 조정 비활성화
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
              onClick={(eventData: any) => {
                // 더블클릭 감지를 위한 타이머
                if (!eventData || !eventData.points || eventData.points.length === 0) return;
                
                const clickedPoint = eventData.points[0];
                const storeCode = clickedPoint.customdata;
                
                if (!storeCode) return;
                
                // 더블클릭 감지 (간단한 방법: 짧은 시간 내 두 번 클릭)
                const now = Date.now();
                const lastClickTime = (window as any).lastPlotlyClickTime || 0;
                const lastClickedStore = (window as any).lastClickedStore || null;
                
                if (now - lastClickTime < 300 && lastClickedStore === storeCode) {
                  // 더블클릭 감지
                  setHiddenStores(prev => {
                    const newSet = new Set(prev);
                    newSet.add(storeCode);
                    return newSet;
                  });
                  (window as any).lastPlotlyClickTime = 0;
                  (window as any).lastClickedStore = null;
                } else {
                  // 첫 클릭 저장
                  (window as any).lastPlotlyClickTime = now;
                  (window as any).lastClickedStore = storeCode;
                }
              }}
            />
          </div>
          
          {/* 숨겨진 매장 복원 버튼 */}
          {hiddenStores.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ {hiddenStores.size}개 매장이 숨겨져 있습니다.
              </p>
              <button
                onClick={() => setHiddenStores(new Set())}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
              >
                모두 복원
              </button>
            </div>
          )}

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

      {/* 매장별 6각형 레이더 차트 */}
      {viewMode === "3d" && (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              매장별 6각형 레이더 차트
            </h3>
            <p className="text-sm text-gray-600">
              매장을 선택하여 6가지 지표를 한눈에 비교해보세요
            </p>
          </div>

          {/* 매장 선택 드롭다운 */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                주 매장:
              </label>
              <select
                value={selectedStore1 || ""}
                onChange={(e) => setSelectedStore1(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">매장을 선택하세요</option>
                {filteredStores
                  .filter(s => s.storeCode !== selectedStore2) // 비교군과 중복 방지
                  .sort((a, b) => b.totalSales - a.totalSales)
                  .slice(0, 30)
                  .map((store) => (
                    <option key={store.storeCode} value={store.storeCode}>
                      {store.storeName} ({store.region})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비교군 매장 (선택사항):
              </label>
              <select
                value={selectedStore2 || ""}
                onChange={(e) => setSelectedStore2(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">비교군 매장 선택 (선택사항)</option>
                {filteredStores
                  .filter(s => s.storeCode !== selectedStore1) // 주 매장과 중복 방지
                  .sort((a, b) => b.totalSales - a.totalSales)
                  .slice(0, 30)
                  .map((store) => (
                    <option key={store.storeCode} value={store.storeCode}>
                      {store.storeName} ({store.region})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 레이더 차트 */}
          {selectedStore1 ? (() => {
            const store1 = filteredStores.find(s => s.storeCode === selectedStore1);
            const store2 = selectedStore2 ? filteredStores.find(s => s.storeCode === selectedStore2) : null;
            
            if (!store1) return null;

            // 최대값 계산 (정규화용)
            const maxSales = Math.max(...filteredStores.map(s => s.totalSales));
            const maxQuantity = Math.max(...filteredStores.map(s => s.totalQuantity));
            const maxTransactions = Math.max(...filteredStores.map(s => s.totalTransactions));

            // 레이더 차트 데이터 생성 함수
            const createRadarData = (store: StoreData) => [
              {
                subject: '백화점등급',
                value: gradeToNumber(store.departmentGrade || 'C') * 20, // S=100, A=80, B=60, C=40, D=20
                fullMark: 100
              },
              {
                subject: '매출등급',
                value: gradeToNumber(store.salesGrade || 'C') * 25, // A=100, B=75, C=50, D=25
                fullMark: 100
              },
              {
                subject: '매장평수등급',
                value: gradeToNumber(store.areaGrade || 'C') * 25, // A=100, B=75, C=50, D=25
                fullMark: 100
              },
              {
                subject: '매출액',
                value: Math.min(100, (store.totalSales / maxSales) * 100), // 정규화
                fullMark: 100
              },
              {
                subject: '판매수량',
                value: Math.min(100, (store.totalQuantity / maxQuantity) * 100), // 정규화
                fullMark: 100
              },
              {
                subject: '거래건수',
                value: Math.min(100, (store.totalTransactions / maxTransactions) * 100), // 정규화
                fullMark: 100
              }
            ];

            const radarData1 = createRadarData(store1);
            const radarData2 = store2 ? createRadarData(store2) : null;

            // 두 매장의 데이터를 합쳐서 하나의 차트에 표시
            const combinedRadarData = radarData1.map((item, index) => ({
              subject: item.subject,
              value1: item.value,
              value2: radarData2 ? radarData2[index].value : 0,
              fullMark: 100
            }));

            return (
              <div className="space-y-6">
                {/* 매장 정보 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 주 매장 정보 */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-indigo-200 mb-1">주 매장</div>
                        <h4 className="text-2xl font-bold mb-2">{store1.storeName}</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-indigo-200">지역:</span>
                            <span className="ml-2 font-semibold">{store1.region}</span>
                          </div>
                          {store1.commercialArea && (
                            <div>
                              <span className="text-indigo-200">상권:</span>
                              <span className="ml-2 font-semibold">{store1.commercialArea}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-indigo-200">브랜드:</span>
                            <span className="ml-2 font-semibold">{store1.brand}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-indigo-200 mb-1">등급</div>
                        <div className="text-lg font-bold">
                          {store1.departmentGrade}-{store1.salesGrade}-{store1.areaGrade}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 비교군 매장 정보 */}
                  {store2 ? (
                    <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-pink-200 mb-1">비교군 매장</div>
                          <h4 className="text-2xl font-bold mb-2">{store2.storeName}</h4>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-pink-200">지역:</span>
                              <span className="ml-2 font-semibold">{store2.region}</span>
                            </div>
                            {store2.commercialArea && (
                              <div>
                                <span className="text-pink-200">상권:</span>
                                <span className="ml-2 font-semibold">{store2.commercialArea}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-pink-200">브랜드:</span>
                              <span className="ml-2 font-semibold">{store2.brand}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-pink-200 mb-1">등급</div>
                          <div className="text-lg font-bold">
                            {store2.departmentGrade}-{store2.salesGrade}-{store2.areaGrade}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl p-6 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm">비교군 매장을 선택하면<br />여기에 표시됩니다</p>
                    </div>
                  )}
                </div>

                {/* 레이더 차트 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <ResponsiveContainer width="100%" height={500}>
                    <RadarChart data={combinedRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#374151', fontSize: 14, fontWeight: 'bold' }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickCount={6}
                      />
                      {/* 주 매장 레이더 */}
                      <Radar
                        name={store1.storeName}
                        dataKey="value1"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      {/* 비교군 매장 레이더 (있는 경우) */}
                      {store2 && (
                        <Radar
                          name={store2.storeName}
                          dataKey="value2"
                          stroke="#ec4899"
                          fill="#ec4899"
                          fillOpacity={0.6}
                          strokeWidth={2}
                        />
                      )}
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}점`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 지표 상세 정보 - 비교 테이블 */}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">지표 상세 비교</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">지표</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-indigo-600 border-b">
                            {store1.storeName}
                          </th>
                          {store2 && (
                            <th className="px-4 py-3 text-center text-sm font-bold text-pink-600 border-b">
                              {store2.storeName}
                            </th>
                          )}
                          {store2 && (
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-b">차이</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">백화점등급</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-2xl font-bold text-indigo-600">{store1.departmentGrade || 'C'}</span>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <span className="text-2xl font-bold text-pink-600">{store2.departmentGrade || 'C'}</span>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {gradeToNumber(store1.departmentGrade || 'C') - gradeToNumber(store2.departmentGrade || 'C') > 0 ? '+' : ''}
                              {gradeToNumber(store1.departmentGrade || 'C') - gradeToNumber(store2.departmentGrade || 'C')}
                            </td>
                          )}
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">매출등급</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-2xl font-bold text-blue-600">{store1.salesGrade || 'C'}</span>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <span className="text-2xl font-bold text-pink-600">{store2.salesGrade || 'C'}</span>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {gradeToNumber(store1.salesGrade || 'C') - gradeToNumber(store2.salesGrade || 'C') > 0 ? '+' : ''}
                              {gradeToNumber(store1.salesGrade || 'C') - gradeToNumber(store2.salesGrade || 'C')}
                            </td>
                          )}
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">매장평수등급</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-2xl font-bold text-green-600">{store1.areaGrade || 'C'}</span>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <span className="text-2xl font-bold text-pink-600">{store2.areaGrade || 'C'}</span>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {gradeToNumber(store1.areaGrade || 'C') - gradeToNumber(store2.areaGrade || 'C') > 0 ? '+' : ''}
                              {gradeToNumber(store1.areaGrade || 'C') - gradeToNumber(store2.areaGrade || 'C')}
                            </td>
                          )}
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">매출액</td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {(store1.totalSales / 100000000).toFixed(1)}억원
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.min(100, (store1.totalSales / maxSales) * 100).toFixed(0)}점
                            </div>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className="text-lg font-bold text-pink-600">
                                {(store2.totalSales / 100000000).toFixed(1)}억원
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.min(100, (store2.totalSales / maxSales) * 100).toFixed(0)}점
                              </div>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className={`text-sm font-semibold ${
                                store1.totalSales > store2.totalSales ? 'text-green-600' : 
                                store1.totalSales < store2.totalSales ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {store1.totalSales > store2.totalSales ? '+' : ''}
                                {((store1.totalSales - store2.totalSales) / 100000000).toFixed(1)}억원
                              </div>
                            </td>
                          )}
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">판매수량</td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {store1.totalQuantity.toLocaleString()}개
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.min(100, (store1.totalQuantity / maxQuantity) * 100).toFixed(0)}점
                            </div>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className="text-lg font-bold text-pink-600">
                                {store2.totalQuantity.toLocaleString()}개
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.min(100, (store2.totalQuantity / maxQuantity) * 100).toFixed(0)}점
                              </div>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className={`text-sm font-semibold ${
                                store1.totalQuantity > store2.totalQuantity ? 'text-green-600' : 
                                store1.totalQuantity < store2.totalQuantity ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {store1.totalQuantity > store2.totalQuantity ? '+' : ''}
                                {(store1.totalQuantity - store2.totalQuantity).toLocaleString()}개
                              </div>
                            </td>
                          )}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">거래건수</td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-lg font-bold text-pink-600">
                              {store1.totalTransactions.toLocaleString()}건
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.min(100, (store1.totalTransactions / maxTransactions) * 100).toFixed(0)}점
                            </div>
                          </td>
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className="text-lg font-bold text-pink-600">
                                {store2.totalTransactions.toLocaleString()}건
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.min(100, (store2.totalTransactions / maxTransactions) * 100).toFixed(0)}점
                              </div>
                            </td>
                          )}
                          {store2 && (
                            <td className="px-4 py-3 text-center">
                              <div className={`text-sm font-semibold ${
                                store1.totalTransactions > store2.totalTransactions ? 'text-green-600' : 
                                store1.totalTransactions < store2.totalTransactions ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {store1.totalTransactions > store2.totalTransactions ? '+' : ''}
                                {(store1.totalTransactions - store2.totalTransactions).toLocaleString()}건
                              </div>
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                주 매장을 선택해주세요
              </p>
              <p className="text-sm text-gray-500">
                위의 드롭다운에서 주 매장을 선택하면<br />
                6가지 지표를 레이더 차트로 확인할 수 있습니다.<br />
                비교군 매장도 선택하면 두 매장을 비교할 수 있습니다.
              </p>
            </div>
          )}
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
          {useTestData ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">지역별 매출 분포</h3>
              <div className="text-center py-12">
                <p className="text-gray-600">테스트 모드에서는 지역별 분포 차트를 사용할 수 없습니다.</p>
              </div>
            </div>
          ) : data && data.byRegion ? (
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
          ) : null}
        </div>
      )}
    </div>
  );
}

