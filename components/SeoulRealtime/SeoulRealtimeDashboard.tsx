"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  MapPin, 
  TrendingUp,
  Activity,
  Store,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import MetricCard from "../MetricCard";

interface SeoulAreaData {
  name: string;
  congestionLevel: string;
  congestionMessage: string;
  population: number;
  populationMax: number;
  updateTime: string;
}

interface SeoulRealtimeData {
  success: boolean;
  type: string;
  timestamp: string;
  isMockData?: boolean;
  message?: string;
  processed: {
    areas: SeoulAreaData[];
    summary: {
      totalAreas: number;
      avgCongestion: number;
    };
  };
}

export default function SeoulRealtimeDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SeoulRealtimeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataType, setDataType] = useState<'population' | 'congestion' | 'commercial'>('congestion');
  const [selectedArea, setSelectedArea] = useState<SeoulAreaData | null>(null);

  // 클라이언트에서는 서버 API를 통해 데이터를 가져옵니다 (보안)

  // 서울시 주요 지역 코드 및 이름 매핑 (제공된 코드 기반)
  const seoulPlaces = [
    { code: 'PO001', name: '광화문·덕수궁' },
    { code: 'PO002', name: '강남역' },
    { code: 'PO003', name: '명동' },
    { code: 'PO004', name: '홍대' },
    { code: 'PO005', name: '잠실' },
    { code: 'PO006', name: '이태원' },
    { code: 'PO007', name: '서울역' },
    { code: 'PO008', name: '가로수길' },
    { code: 'PO009', name: '삼청동' },
    { code: 'PO010', name: '성수' },
    { code: 'PO011', name: '신촌' },
    { code: 'PO012', name: '건대입구' },
    { code: 'PO013', name: '합정' },
    { code: 'PO014', name: '종로' },
    { code: 'PO015', name: '동대문' },
    { code: 'PO016', name: '인사동' },
    { code: 'PO017', name: '청계천' },
    { code: 'PO018', name: '코엑스' },
    { code: 'PO019', name: '삼성역' },
    { code: 'PO020', name: '여의도' },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 여러 지역을 순차적으로 호출 (서버 API를 통해)
      const allAreas: SeoulAreaData[] = [];
      
      // 테스트를 위해 처음 10개만 호출 (API 호출 제한 고려)
      const placesToFetch = seoulPlaces.slice(0, 10);
      
      for (let i = 0; i < placesToFetch.length; i++) {
        const place = placesToFetch[i];
        
        try {
          console.log(`📡 [${i + 1}/${placesToFetch.length}] /api/seoul-realtime 호출 중... (Code: ${place.code})`);
          
          // 🚨 서울시 API 주소가 아니라 내가 만든 API Route 주소를 호출합니다!
          const response = await fetch(`/api/seoul-realtime?code=${place.code}`, {
            method: 'GET',
            cache: 'no-store',
          });
          
          if (!response.ok) {
            // API Route에서 에러를 받은 경우 (400, 500 등)
            const errorData = await response.json().catch(() => ({}));
            console.error(`API Route 오류 (${place.name}):`, errorData);
            console.warn(`⚠️ ${place.name} 호출 실패: ${response.status} - ${errorData.error || '알 수 없는 오류'}`);
            continue; // 실패한 지역은 스킵하고 다음 지역 호출
          }
          
          const jsonData = await response.json();
          
          // 서울시 데이터 구조에 맞춰 인구 수 추출 (제공된 코드 구조)
          if (jsonData.CITYDATA && jsonData.CITYDATA.LIVE_PPLTN_STTS) {
            const liveData = jsonData.CITYDATA.LIVE_PPLTN_STTS;
            
            // 데이터 추출 (제공된 코드 방식)
            const maxPopulation = liveData.AREA_PPLTN_MAX || '0';
            const minPopulation = liveData.AREA_PPLTN_MIN || '0';
            const congestionLevel = liveData.AREA_CONGEST_LVL || '보통';
            const congestionMessage = liveData.AREA_CONGEST_MSG || '';
            const updateTime = liveData.PPLTN_TIME || new Date().toISOString();
            
            console.log(`✅ ${place.name} 데이터 로드 성공: 최대인구 ${maxPopulation}명`);
            
            allAreas.push({
              name: place.name,
              congestionLevel: congestionLevel,
              congestionMessage: congestionMessage,
              population: parseInt(String(minPopulation).replace(/,/g, '')) || 0,
              populationMax: parseInt(String(maxPopulation).replace(/,/g, '')) || 0,
              updateTime: updateTime
            });
          } else {
            console.warn(`⚠️ ${place.name}: LIVE_PPLTN_STTS 데이터를 찾을 수 없습니다.`);
          }
          
          // API 호출 제한을 고려한 딜레이 (초당 1회 제한)
          if (i < placesToFetch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1100));
          }
        } catch (error: any) {
          // 네트워크 또는 클라이언트 오류
          console.error(`네트워크 또는 클라이언트 오류 (${place.name}):`, error);
          console.warn(`⚠️ ${place.name} 호출 중 오류:`, error.message);
          continue; // 오류 발생 시 다음 지역으로 계속
        }
      }
      
      // 데이터가 없으면 에러 표시
      if (allAreas.length === 0) {
        throw new Error('수집된 데이터가 없습니다. API 키를 확인하세요.');
      }
      
      // 수집된 데이터를 표준 형식으로 변환
      const result: SeoulRealtimeData = {
        success: true,
        type: dataType,
        timestamp: new Date().toISOString(),
        isMockData: false,
        processed: {
          areas: allAreas,
          summary: {
            totalAreas: allAreas.length,
            avgCongestion: calculateAvgCongestion(allAreas)
          }
        }
      };
      
      setData(result);
      console.log('🌆 서울시 실시간 데이터 로드됨:', result);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (error: any) {
      console.error("서울시 데이터 로딩 실패:", error);
      setError(error.message || '데이터 로드 실패 (콘솔 확인)');
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  // 혼잡도 평균 계산
  const calculateAvgCongestion = (areas: SeoulAreaData[]): number => {
    if (areas.length === 0) return 0;
    
    const congestionLevels: { [key: string]: number } = {
      '여유': 1,
      '보통': 2,
      '약간 붐빔': 3,
      '붐빔': 4
    };
    
    const sum = areas.reduce((acc, area) => {
      return acc + (congestionLevels[area.congestionLevel] || 2);
    }, 0);
    
    return sum / areas.length;
  };

  useEffect(() => {
    fetchData(); // 컴포넌트 로드 시 즉시 호출
    
    // 5분(300000ms)마다 자동 업데이트
    const intervalId = setInterval(fetchData, 300000);
    
    // 클린업 함수 (컴포넌트가 사라질 때 타이머 해제 - 매우 중요)
    return () => clearInterval(intervalId);
  }, [fetchData]); // fetchData가 변경될 때마다 재설정

  // 혼잡도에 따른 색상 반환
  const getCongestionColor = (level: string) => {
    switch (level) {
      case '여유': return 'text-green-600 bg-green-100';
      case '보통': return 'text-blue-600 bg-blue-100';
      case '약간 붐빔': return 'text-yellow-600 bg-yellow-100';
      case '붐빔': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 혼잡도 레벨을 숫자로 변환
  const getCongestionValue = (level: string): number => {
    switch (level) {
      case '여유': return 1;
      case '보통': return 2;
      case '약간 붐빔': return 3;
      case '붐빔': return 4;
      default: return 2;
    }
  };

  // 지역 클릭 핸들러
  const handleAreaClick = (area: SeoulAreaData) => {
    setSelectedArea(area);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 w-6 h-6 animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-700 font-medium">
            🌆 서울시 실시간 데이터 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-yellow-800">API 키 설정이 필요합니다</h3>
            <p className="mt-2 text-sm text-yellow-700">{error}</p>
            <div className="mt-4 text-sm text-yellow-800 bg-yellow-100 p-4 rounded">
              <p className="font-semibold mb-2">📋 설정 방법:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><a href="https://data.seoul.go.kr/SeoulRtd/list" target="_blank" rel="noopener noreferrer" className="underline">서울시 실시간 도시데이터 사이트</a>에서 API 키 신청</li>
                <li>프로젝트 루트에 <code className="bg-yellow-200 px-1 rounded">.env.local</code> 파일 생성</li>
                <li><code className="bg-yellow-200 px-1 rounded">NEXT_PUBLIC_SEOUL_RTD_API_KEY=발급받은_키</code> 추가</li>
                <li>개발 서버 재시작</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.processed || !data.processed.areas) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">데이터가 없습니다.</p>
      </div>
    );
  }

  const areas = data.processed.areas;
  const summary = data.processed.summary;

  // 혼잡도별 지역 수 계산
  const congestionStats = areas.reduce((acc, area) => {
    const level = area.congestionLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // 가장 붐비는 지역 Top 5
  const topCongested = [...areas]
    .sort((a, b) => getCongestionValue(b.congestionLevel) - getCongestionValue(a.congestionLevel) || b.population - a.population)
    .slice(0, 5);

  // 가장 한산한 지역 Top 5
  const leastCongested = [...areas]
    .sort((a, b) => getCongestionValue(a.congestionLevel) - getCongestionValue(b.congestionLevel) || a.population - b.population)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              🌆 서울시 실시간 도시데이터
            </h2>
            <p className="text-gray-600">
              마지막 업데이트: {lastUpdate}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              총 {summary.totalAreas}개 지역 실시간 모니터링
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
        
        {/* 목업 데이터 안내 */}
        {data?.isMockData && data?.message && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              {data.message}
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              💡 Vercel 환경 변수에 <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SEOUL_RTD_API_KEY</code> = <code className="bg-yellow-100 px-1 rounded">667a56454b6a696e39395570517a74</code>를 설정하세요.
            </p>
          </div>
        )}
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="모니터링 지역"
          value={summary.totalAreas.toString()}
          subtitle="개 지역"
          icon={<MapPin className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="여유 지역"
          value={(congestionStats['여유'] || 0).toString()}
          subtitle="개 지역"
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="붐비는 지역"
          value={((congestionStats['약간 붐빔'] || 0) + (congestionStats['붐빔'] || 0)).toString()}
          subtitle="개 지역"
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
        />
        <MetricCard
          title="평균 혼잡도"
          value={summary.avgCongestion.toFixed(1)}
          subtitle="/ 4.0"
          icon={<Activity className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* 가장 붐비는 지역 Top 5 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🔥 실시간 혼잡 지역 Top 5
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역명</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">혼잡도</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">실시간 인구</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태 메시지</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상세</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCongested.map((area, idx) => (
                <tr 
                  key={area.name} 
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                  onClick={() => handleAreaClick(area)}
                >
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{area.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCongestionColor(area.congestionLevel)}`}>
                      {area.congestionLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                    {area.population > 0 ? `${area.population.toLocaleString()}명` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {area.congestionMessage || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      상세보기 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 여유로운 지역 Top 5 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ✨ 여유로운 지역 Top 5
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역명</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">혼잡도</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">실시간 인구</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태 메시지</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leastCongested.map((area, idx) => (
                <tr key={area.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{area.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCongestionColor(area.congestionLevel)}`}>
                      {area.congestionLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                    {area.population > 0 ? `${area.population.toLocaleString()}명` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {area.congestionMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 전체 지역 현황 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-purple-600" />
          전체 지역 실시간 현황 ({areas.length}개)
        </h3>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역명</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">혼잡도</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">인구(최소)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">인구(최대)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {areas.map((area, idx) => (
                <tr 
                  key={area.name} 
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                  onClick={() => handleAreaClick(area)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{area.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCongestionColor(area.congestionLevel)}`}>
                      {area.congestionLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {area.population > 0 ? area.population.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {area.populationMax > 0 ? area.populationMax.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {area.congestionMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 데이터 출처 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📊 데이터 출처: <a href="https://data.seoul.go.kr/SeoulRtd/list" target="_blank" rel="noopener noreferrer" className="underline font-medium">서울시 실시간 도시데이터</a>
          {data.isMockData && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              ⚠️ 목업 데이터 (API 키 설정 필요)
            </span>
          )}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          * 10분마다 자동 업데이트됩니다. 지역을 클릭하면 상세 상권 정보를 볼 수 있습니다.
        </p>
      </div>

      {/* 상세 상권 정보 모달 */}
      {selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArea(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    {selectedArea.name} 실시간 상권 정보
                  </h3>
                  <p className="text-blue-50 text-sm font-medium">
                    실시간 혼잡도 및 상권 현황
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* 현재 혼잡도 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">현재 혼잡도</div>
                  <div className={`text-2xl font-bold inline-block px-4 py-2 rounded-lg ${getCongestionColor(selectedArea.congestionLevel)}`}>
                    {selectedArea.congestionLevel}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">실시간 인구 (최소)</div>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedArea.population.toLocaleString()}명
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="text-sm text-purple-600 font-medium mb-1">실시간 인구 (최대)</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {selectedArea.populationMax.toLocaleString()}명
                  </div>
                </div>
              </div>

              {/* 상태 메시지 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-medium">
                  💬 {selectedArea.congestionMessage}
                </p>
              </div>

              {/* 상권 현황 (샘플 데이터) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 업종별 현황 */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5 text-orange-600" />
                    주요 업종
                  </h4>
                  <div className="space-y-3">
                    {getMockBusinessData(selectedArea.name).map((business, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{business.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{business.category}</div>
                            <div className="text-xs text-gray-500">{business.count}개 매장</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">{business.sales}</div>
                          <div className="text-xs text-gray-500">{business.trend}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 시간대별 유동인구 */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    시간대별 유동인구
                  </h4>
                  <div className="space-y-3">
                    {getMockTimeData(selectedArea.congestionLevel).map((time, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{time.period}</span>
                          <span className="font-medium text-gray-900">{time.population}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${time.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 추천 정보 */}
              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {selectedArea.name} 방문 팁
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>주말 오후 2-5시가 가장 붐빕니다. 평일 오전 방문을 추천합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>인근 주차장은 {selectedArea.congestionLevel === '붐빔' ? '매우 혼잡' : '여유'}합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>대중교통 이용 시 평균 도보 5-10분 소요됩니다.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <p className="text-sm text-gray-600">
                💡 업데이트: {new Date().toLocaleTimeString('ko-KR')}
              </p>
              <button
                onClick={() => setSelectedArea(null)}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 목업 상권 데이터 생성
function getMockBusinessData(areaName: string) {
  const businesses = [
    { icon: '🍽️', category: '음식점', count: 156, sales: '활발', trend: '↑ 12%' },
    { icon: '☕', category: '카페', count: 89, sales: '보통', trend: '→ 0%' },
    { icon: '🛍️', category: '소매점', count: 234, sales: '활발', trend: '↑ 8%' },
    { icon: '💇', category: '서비스업', count: 67, sales: '저조', trend: '↓ 3%' },
  ];
  return businesses;
}

// 목업 시간대별 데이터 생성
function getMockTimeData(congestionLevel: string) {
  const basePopulation = congestionLevel === '붐빔' ? 40000 : 
                        congestionLevel === '약간 붐빔' ? 30000 : 
                        congestionLevel === '보통' ? 20000 : 15000;
  
  return [
    { period: '06:00-09:00', population: `${Math.round(basePopulation * 0.5).toLocaleString()}명`, percentage: 50 },
    { period: '09:00-12:00', population: `${Math.round(basePopulation * 0.7).toLocaleString()}명`, percentage: 70 },
    { period: '12:00-15:00', population: `${Math.round(basePopulation * 1.0).toLocaleString()}명`, percentage: 100 },
    { period: '15:00-18:00', population: `${Math.round(basePopulation * 0.9).toLocaleString()}명`, percentage: 90 },
    { period: '18:00-21:00', population: `${Math.round(basePopulation * 0.8).toLocaleString()}명`, percentage: 80 },
    { period: '21:00-24:00', population: `${Math.round(basePopulation * 0.6).toLocaleString()}명`, percentage: 60 },
  ];
}

