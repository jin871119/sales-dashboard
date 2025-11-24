import { NextResponse } from 'next/server';

// 동적 렌더링 강제 (request.url 사용)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 서울시 실시간 도시데이터 API
const API_KEY = process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY || 'sample_key';
const BASE_URL = process.env.NEXT_PUBLIC_SEOUL_RTD_BASE_URL || 'http://openapi.seoul.go.kr:8088';
const USE_MOCK_DATA = API_KEY === 'sample_key' || !API_KEY; // API 키가 없으면 목업 데이터 사용

// 캐시
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분 (실시간 데이터이므로 짧게 설정)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'congestion'; // population, commercial, congestion
  
  try {
    
    console.log(`🌆 서울시 실시간 데이터 요청: ${type}`);
    console.log(`🔑 API 키 값: ${API_KEY === 'sample_key' ? 'sample_key (기본값)' : API_KEY.substring(0, 10) + '...'}`);
    console.log(`🔑 API 키 존재: ${API_KEY !== 'sample_key'}`);
    console.log(`📦 목업 데이터 사용: ${USE_MOCK_DATA}`);
    console.log(`🌍 환경 변수 체크: NEXT_PUBLIC_SEOUL_RTD_API_KEY = ${process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY ? '설정됨' : '없음'}`);
    
    // 목업 데이터 모드 (API 키가 없거나 sample_key인 경우)
    if (USE_MOCK_DATA) {
      console.log('📦 목업 데이터 반환 (API 키가 설정되지 않음)');
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
    
    // 서울시 주요 상권 50곳 목록
    const seoulAreas = [
      '광화문·덕수궁', '명동', '홍대', '강남역', '잠실', 
      '이태원', '서울역', '가로수길', '삼청동', '북촌한옥마을',
      '성수', '해방촌', '경리단길', '신촌', '이화여대',
      '건대입구', '합정', '망원', '상수', '종로',
      '동대문', '남대문시장', '명동성당', '광장시장', '낙원상가',
      '인사동', '익선동', '을지로', '청계천', 'DDP',
      '코엑스', '삼성역', '선릉역', '역삼역', '논현역',
      '신사역', '압구정로데오', '청담동', '한남동', '이촌한강공원',
      '여의도', '마포', '상암DMC', '연남동', '대학로',
      '혜화역', '성신여대', '한성대입구', '녹사평', '용산'
    ];
    
    let allData: any[] = [];
    
    let apiUrl = '';
    
    switch (type) {
    case 'population':
    case 'congestion':
      // PowerShell에서 성공한 엔드포인트 사용 (지역을 지정하지 않으면 여러 지역 반환)
      apiUrl = `${BASE_URL}/${API_KEY}/json/CITYDATA/1/5/`;
      break;
      
    case 'commercial':
      // 상권 현황 - 목업 데이터 반환 (API 미지원)
      console.warn('⚠️ 상권 현황 API는 현재 지원하지 않습니다. 목업 데이터로 반환합니다.');
      return NextResponse.json(getMockData(type));
        
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
        'Accept': 'application/json, application/xml',
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
    
    // XML 응답 처리
    if (responseText.trim().startsWith('<')) {
      console.log('📄 XML 응답 감지 - 파싱 시작');
      data = parseXmlResponse(responseText, type);
    } else {
      // JSON 응답 처리
      try {
        data = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('❌ JSON 파싱 오류:', parseError);
        console.error('응답 내용:', responseText.substring(0, 500));
        throw new Error(`API 응답 파싱 실패. 응답 내용을 확인하세요.`);
      }
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
    console.log('📦 API 오류 발생, 목업 데이터로 폴백');
    
    // API 오류 시 목업 데이터 반환 (사용자 경험 개선)
    // type 변수는 함수 상단에서 선언되어 있으므로 접근 가능
    return NextResponse.json(getMockData(type));
  }
}

// XML 응답 파싱
function parseXmlResponse(xmlText: string, type: string): any {
  console.log('🔍 XML 파싱 시작');
  
  try {
    // 간단한 XML 파싱 (정규식 사용)
    const areas: any[] = [];
    
    // <CITYDATA> 태그로 각 지역 데이터 분리
    const citydataMatches = xmlText.match(/<CITYDATA>[\s\S]*?<\/CITYDATA>/g);
    
    if (!citydataMatches) {
      console.log('⚠️ CITYDATA 태그를 찾을 수 없음');
      return { CITYDATA: [] };
    }
    
    console.log(`📊 발견된 지역 수: ${citydataMatches.length}`);
    
    citydataMatches.forEach((citydata, index) => {
      try {
        const area: any = {
          AREA_NM: extractValue(citydata, 'AREA_NM'),
          AREA_CD: extractValue(citydata, 'AREA_CD'),
        };
        
        // 실시간 인구 데이터
        const liveData = citydata.match(/<LIVE_PPLTN_STTS>([\s\S]*?)<\/LIVE_PPLTN_STTS>/);
        if (liveData) {
          const liveContent = liveData[1];
          area.AREA_CONGEST_LVL = extractValue(liveContent, 'AREA_CONGEST_LVL');
          area.AREA_CONGEST_MSG = extractValue(liveContent, 'AREA_CONGEST_MSG');
          area.AREA_PPLTN_MIN = extractValue(liveContent, 'AREA_PPLTN_MIN');
          area.AREA_PPLTN_MAX = extractValue(liveContent, 'AREA_PPLTN_MAX');
          area.MALE_PPLTN_RATE = extractValue(liveContent, 'MALE_PPLTN_RATE');
          area.FEMALE_PPLTN_RATE = extractValue(liveContent, 'FEMALE_PPLTN_RATE');
          area.PPLTN_RATE_0 = extractValue(liveContent, 'PPLTN_RATE_0');
          area.PPLTN_RATE_10 = extractValue(liveContent, 'PPLTN_RATE_10');
          area.PPLTN_RATE_20 = extractValue(liveContent, 'PPLTN_RATE_20');
          area.PPLTN_RATE_30 = extractValue(liveContent, 'PPLTN_RATE_30');
          area.PPLTN_RATE_40 = extractValue(liveContent, 'PPLTN_RATE_40');
          area.PPLTN_RATE_50 = extractValue(liveContent, 'PPLTN_RATE_50');
          area.PPLTN_RATE_60 = extractValue(liveContent, 'PPLTN_RATE_60');
          area.PPLTN_RATE_70 = extractValue(liveContent, 'PPLTN_RATE_70');
          area.PPLTN_TIME = extractValue(liveContent, 'PPLTN_TIME');
        }
        
        // 도로 교통 데이터
        const roadData = citydata.match(/<AVG_ROAD_DATA>([\s\S]*?)<\/AVG_ROAD_DATA>/);
        if (roadData) {
          const roadContent = roadData[1];
          area.ROAD_TRAFFIC_IDX = extractValue(roadContent, 'ROAD_TRAFFIC_IDX');
          area.ROAD_TRAFFIC_SPD = extractValue(roadContent, 'ROAD_TRAFFIC_SPD');
        }
        
        areas.push(area);
        console.log(`✅ 지역 ${index + 1} 파싱 완료: ${area.AREA_NM}`);
      } catch (err) {
        console.error(`❌ 지역 ${index + 1} 파싱 오류:`, err);
      }
    });
    
    console.log(`✅ 총 ${areas.length}개 지역 파싱 완료`);
    
    return {
      CITYDATA: areas
    };
    
  } catch (error: any) {
    console.error('❌ XML 파싱 실패:', error);
    throw new Error(`XML 파싱 실패: ${error.message}`);
  }
}

// XML 태그에서 값 추출
function extractValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>|<${tagName}>([\\s\\S]*?)</${tagName}>`);
  const match = xml.match(regex);
  if (match) {
    return (match[1] || match[2] || '').trim();
  }
  return '';
}

// 데이터 가공 함수
function processSeoulData(raw: any, type: string) {
  try {
    switch (type) {
      case 'population':
      case 'congestion':
        // 서울시 CITYDATA API 응답 구조
        // XML 파싱 결과: CITYDATA 배열 또는 JSON 구조
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
        
        // RESULT 코드 확인 (JSON 응답인 경우)
        if (cityData.RESULT) {
          console.log('📊 API RESULT:', cityData.RESULT);
        }
        
        // XML 파싱 결과는 배열, JSON 응답은 cityData.row
        const rows = Array.isArray(cityData) ? cityData : (cityData.row || []);
        
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
        
        console.log(`✅ 처리할 지역 데이터: ${rows.length}개`);
        
        const areas = rows.map((item: any) => ({
          name: item.AREA_NM || item.area_nm || '알 수 없음',
          congestionLevel: item.AREA_CONGEST_LVL || item.area_congest_lvl || '보통',
          congestionMessage: item.AREA_CONGEST_MSG || item.area_congest_msg || '',
          population: parseInt(item.AREA_PPLTN_MIN || item.area_ppltn_min || '0'),
          populationMax: parseInt(item.AREA_PPLTN_MAX || item.area_ppltn_max || '0'),
          updateTime: item.PPLTN_TIME || item.ppltn_time || new Date().toISOString()
        }));
        
        console.log(`✅ 가공 완료: ${areas.length}개 지역`);
        
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

