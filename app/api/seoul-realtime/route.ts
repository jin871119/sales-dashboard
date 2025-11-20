import { NextResponse } from 'next/server';

// 서울시 실시간 도시데이터 API
const API_KEY = process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY || 'sample_key';
const BASE_URL = process.env.NEXT_PUBLIC_SEOUL_RTD_BASE_URL || 'http://openapi.seoul.go.kr:8088';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_SEOUL_DATA === 'true' || !process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY || process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY === 'sample_key';

// 캐시
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분 (실시간 데이터이므로 짧게 설정)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'congestion'; // population, commercial, congestion
    
    console.log(`🌆 서울시 실시간 데이터 요청: ${type}`);
    console.log(`🔑 API 키 값: ${API_KEY === 'sample_key' ? 'sample_key (기본값)' : API_KEY.substring(0, 10) + '...'}`);
    console.log(`🔑 API 키 존재: ${API_KEY !== 'sample_key'}`);
    console.log(`📦 목업 데이터 사용: ${USE_MOCK_DATA}`);
    console.log(`🌍 환경 변수 체크: NEXT_PUBLIC_SEOUL_RTD_API_KEY = ${process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY ? '설정됨' : '없음'}`);
    
    // 목업 데이터 모드
    if (USE_MOCK_DATA) {
      console.log('📦 목업 데이터 반환');
      return NextResponse.json(getMockData(type));
    }
    
    // 캐시 확인
    const now = Date.now();
    const cacheKey = `${type}_${Math.floor(now / CACHE_DURATION)}`;
    
    if (cachedData && cachedData.key === cacheKey) {
      console.log('⚡ 캐시된 서울시 실시간 데이터 사용');
      return NextResponse.json(cachedData.data);
    }
    
    console.log(`🌆 실제 API 호출 시작`);
    
    let apiUrl = '';
    
    switch (type) {
      case 'population':
      case 'congestion':
        // 서울시 주요 50곳 실시간 도시데이터 (CITYDATA)
        // 공식 문서: http://openapi.seoul.go.kr:8088/(인증키)/json/citydata/1/5/
        apiUrl = `${BASE_URL}/${API_KEY}/json/citydata/1/50/`;
        break;
        
      case 'commercial':
        // 실시간 상권 현황 API
        apiUrl = `${BASE_URL}/${API_KEY}/json/citydata_stts/1/20/`;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
    
    console.log(`📡 API 호출: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    
    const responseText = await response.text();
    console.log('📄 응답 본문 샘플:', responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('❌ JSON 파싱 오류:', parseError);
      console.error('응답 내용:', responseText.substring(0, 500));
      throw new Error(`API 응답이 JSON 형식이 아닙니다. API 키와 엔드포인트를 확인하세요.`);
    }
    
    // API 응답 구조 확인
    console.log('📊 API 응답 키:', Object.keys(data));
    
    // 캐시 저장
    cachedData = {
      key: cacheKey,
      data: {
        success: true,
        type,
        timestamp: new Date().toISOString(),
        raw: data,
        processed: processSeoulData(data, type)
      }
    };
    
    cacheTime = now;
    
    return NextResponse.json(cachedData.data);
    
  } catch (error: any) {
    console.error('❌ 서울시 실시간 데이터 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '서울시 실시간 데이터 로드 실패',
        message: error.message,
        hint: 'API 키가 올바른지 확인하세요. .env.local 파일의 NEXT_PUBLIC_SEOUL_RTD_API_KEY를 설정해야 합니다.'
      },
      { status: 500 }
    );
  }
}

// 데이터 가공 함수
function processSeoulData(raw: any, type: string) {
  try {
    switch (type) {
      case 'population':
      case 'congestion':
        // 서울시 CITYDATA API 응답 구조
        // CITYDATA.RESULT, CITYDATA.list_total_count, CITYDATA.row 등
        const cityData = raw.CITYDATA || raw.citydata;
        
        if (!cityData) {
          console.error('❌ CITYDATA 키를 찾을 수 없음. 응답 구조:', Object.keys(raw));
          return {
            areas: [],
            summary: {
              totalAreas: 0,
              avgCongestion: 0
            }
          };
        }
        
        // RESULT 코드 확인
        if (cityData.RESULT) {
          console.log('📊 API RESULT:', cityData.RESULT);
        }
        
        const rows = cityData.row || [];
        
        if (rows.length === 0) {
          console.warn('⚠️ 데이터 행이 비어있음');
          return {
            areas: [],
            summary: {
              totalAreas: 0,
              avgCongestion: 0
            }
          };
        }
        
        const areas = rows.map((item: any) => ({
          name: item.AREA_NM || item.area_nm || '알 수 없음',
          congestionLevel: item.AREA_CONGEST_LVL || item.area_congest_lvl || '보통',
          congestionMessage: item.AREA_CONGEST_MSG || item.area_congest_msg || '',
          population: parseInt(item.AREA_PPLTN_MIN || item.area_ppltn_min || '0'),
          populationMax: parseInt(item.AREA_PPLTN_MAX || item.area_ppltn_max || '0'),
          updateTime: item.PPLTN_TIME || item.ppltn_time || new Date().toISOString()
        }));
        
        return {
          areas,
          summary: {
            totalAreas: areas.length,
            avgCongestion: calculateAvgCongestion(areas)
          }
        };
        
      case 'commercial':
        const commercialData = raw.citydata_stts || raw.CITYDATA_STTS;
        
        if (!commercialData || !commercialData.row) {
          return {
            stores: [],
            summary: {
              totalStores: 0
            }
          };
        }
        
        const stores = commercialData.row.map((item: any) => ({
          name: item.STTS_NM || item.stts_nm || '알 수 없음',
          category: item.STTS_SE || item.stts_se || '',
          salesStatus: item.STTS_VALUE || item.stts_value || 0
        }));
        
        return {
          stores,
          summary: {
            totalStores: stores.length
          }
        };
        
      default:
        return {};
    }
  } catch (error) {
    console.error('데이터 가공 중 오류:', error);
    return {
      areas: [],
      summary: {
        totalAreas: 0,
        avgCongestion: 0
      }
    };
  }
}

function calculateAvgCongestion(areas: any[]): number {
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
}

// 목업 데이터 생성 함수
function getMockData(type: string) {
  const mockAreas = [
    { name: '강남역', congestionLevel: '붐빔', congestionMessage: '사람이 몰려있어요', population: 45000, populationMax: 50000 },
    { name: '홍대입구', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 35000, populationMax: 40000 },
    { name: '명동', congestionLevel: '붐빔', congestionMessage: '사람이 몰려있어요', population: 42000, populationMax: 48000 },
    { name: '신촌', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 25000, populationMax: 30000 },
    { name: '잠실', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 32000, populationMax: 38000 },
    { name: '여의도', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 22000, populationMax: 28000 },
    { name: '이태원', congestionLevel: '여유', congestionMessage: '사람이 붐비지 않아요', population: 15000, populationMax: 20000 },
    { name: '동대문', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 28000, populationMax: 35000 },
    { name: '서울역', congestionLevel: '붐빔', congestionMessage: '사람이 몰려있어요', population: 40000, populationMax: 45000 },
    { name: '건대입구', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 20000, populationMax: 25000 },
    { name: '가로수길', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 30000, populationMax: 35000 },
    { name: '성수', congestionLevel: '여유', congestionMessage: '사람이 붐비지 않아요', population: 18000, populationMax: 22000 },
    { name: '압구정', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 23000, populationMax: 28000 },
    { name: '종로', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 27000, populationMax: 32000 },
    { name: '광화문', congestionLevel: '붐빔', congestionMessage: '사람이 몰려있어요', population: 38000, populationMax: 43000 },
    { name: '삼성역', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 24000, populationMax: 29000 },
    { name: '코엑스', congestionLevel: '약간 붐빔', congestionMessage: '사람이 많아요', population: 31000, populationMax: 36000 },
    { name: '시청', congestionLevel: '보통', congestionMessage: '사람이 붐비지 않아요', population: 21000, populationMax: 26000 },
    { name: '용산', congestionLevel: '여유', congestionMessage: '사람이 붐비지 않아요', population: 16000, populationMax: 21000 },
    { name: '노원', congestionLevel: '여유', congestionMessage: '사람이 붐비지 않아요', population: 14000, populationMax: 19000 }
  ].map(area => ({
    ...area,
    updateTime: new Date().toISOString()
  }));

  return {
    success: true,
    type,
    timestamp: new Date().toISOString(),
    isMockData: true,
    processed: {
      areas: mockAreas,
      summary: {
        totalAreas: mockAreas.length,
        avgCongestion: calculateAvgCongestion(mockAreas)
      }
    },
    message: '⚠️ 목업 데이터입니다. 실제 API 키를 설정하면 실시간 데이터를 볼 수 있습니다.'
  };
}

