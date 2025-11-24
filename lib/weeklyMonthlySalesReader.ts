import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createStoreInfo, getStoreTypeLabel, StoreInfo } from './storeUtils';

// 일주월별 판매 데이터 타입
export interface WeeklySalesRecord {
  storeCode: string;
  storeName: string;
  storeInfo: StoreInfo;
  item: string;
  season: string;
  productCode: string;
  productName: string;
  retailPrice: number;
  salesType: string;
  customerType: string;
  discountRate: string;
  totalQuantity: number;
  totalSales: number;
  totalTagPrice: number;
  normalQuantity: number;
  normalSales: number;
  normalTagPrice: number;
  returnQuantity: number;
  returnSales: number;
  returnTagPrice: number;
  dailySales: { [date: string]: number };
}

// 집계 데이터
export interface WeeklySalesAnalytics {
  // 캐시 비교용 (내부 사용)
  _period?: 'weekly' | 'monthly';
  
  // 전체 통계
  totalSales: number;
  totalQuantity: number;
  averagePrice: number;
  returnRate: number;
  
  // 날짜 정보
  dateRange: {
    start: string;
    end: string;
    dates: string[];
  };
  
  // 일별 집계
  dailyTotals: {
    date: string;
    sales: number;
    quantity: number;
    transactions: number;
  }[];
  
  // 매장 통계
  storeStats: {
    storeCode: string;
    storeName: string;
    storeType: string;
    storeBrand?: string;
    storeRegion?: string;
    sales: number;
    quantity: number;
    share: number;
    rank: number;
  }[];
  
  // 매장 유형별 집계
  storeTypeStats: {
    type: string;
    typeLabel: string;
    storeCount: number;
    sales: number;
    quantity: number;
    share: number;
    averagePerStore: number;
  }[];
  
  // 백화점 브랜드별 집계
  departmentBrandStats: {
    brand: string;
    storeCount: number;
    sales: number;
    quantity: number;
    share: number;
  }[];
  
  // 지역별 집계
  regionStats: {
    region: string;
    storeCount: number;
    sales: number;
    quantity: number;
    share: number;
  }[];
  
  // 온라인 vs 오프라인
  onlineOfflineStats: {
    online: {
      storeCount: number;
      sales: number;
      quantity: number;
      share: number;
    };
    offline: {
      storeCount: number;
      sales: number;
      quantity: number;
      share: number;
    };
  };
  
  // 아이템 통계
  itemStats: {
    item: string;
    sales: number;
    quantity: number;
    share: number;
  }[];
  
  // 시즌 통계
  seasonStats: {
    season: string;
    sales: number;
    quantity: number;
    share: number;
  }[];
  
  // 베스트셀러
  bestSellers: {
    productCode: string;
    productName: string;
    item: string;
    season: string;
    quantity: number;
    sales: number;
  }[];
  
  // 워스트 아이템
  worstSellers: {
    productCode: string;
    productName: string;
    item: string;
    season: string;
    quantity: number;
    sales: number;
    topStores?: Array<{ storeName: string; quantity: number; sales: number }>; // 매장 정보 추가
  }[];
  
  // 캐시 키 (내부 사용)
  _cacheKey?: string;
}

// 엑셀 날짜 시리얼 번호를 날짜로 변환
function excelDateToJSDate(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 일주월별 판매 엑셀 파일 읽기
export function readWeeklySalesExcel(): WeeklySalesRecord[] {
  try {
    const rootDir = process.cwd();
    
    // 1. JSON 파일 먼저 시도 (Vercel 배포용)
    const jsonPath = path.join(rootDir, 'public', 'weekly-sales-data.json');
    if (fs.existsSync(jsonPath)) {
      console.log('📊 JSON 파일 읽는 중:', jsonPath);
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(jsonData) as any[][];
      console.log(`✅ JSON에서 ${data.length.toLocaleString()}행 읽기 완료`);
      return parseWeeklySalesData(data);
    }
    
    // 2. 엑셀 파일 시도 (로컬 개발용)
    console.log('📊 JSON 파일 없음, 엑셀 파일 찾는 중...');
    
    // 프로덕션 환경에서는 엑셀 파일 접근 시도하지 않음
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.warn('⚠️  프로덕션 환경: JSON 파일이 필요합니다.');
      console.warn('⚠️  prepare-deploy.js를 실행하여 JSON 파일을 생성하세요.');
      throw new Error('프로덕션 환경에서는 JSON 파일이 필요합니다. public/weekly-sales-data.json 파일을 생성하세요.');
    }
    
    const files = fs.readdirSync(rootDir);
    const excelFile = files.find(f => 
      f.startsWith('mw_일주월별_판매') && 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$')
    );
    
    if (!excelFile) {
      console.error('프로젝트 루트:', rootDir);
      console.error('JSON 경로:', jsonPath);
      console.error('파일 목록:', files.filter(f => f.includes('일주월별')));
      throw new Error('mw_일주월별_판매 엑셀 파일을 찾을 수 없습니다. JSON 파일을 생성하거나 엑셀 파일을 프로젝트 루트에 배치하세요.');
    }
    
    const filePath = path.join(rootDir, excelFile);
    console.log(`📊 읽는 중: ${filePath}`);
    
    // 파일 접근 확인
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (e: any) {
      console.error('파일 접근 오류:', e.message);
      throw new Error(`파일에 접근할 수 없습니다. 엑셀에서 파일이 열려있으면 닫아주세요: ${filePath}`);
    }
    
    // 버퍼로 파일 읽기
    console.log('📖 파일을 버퍼로 읽는 중...');
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`✅ 버퍼 읽기 완료 (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // 워크북 파싱
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    return parseWeeklySalesData(data);
    
  } catch (error) {
    console.error('엑셀 파일 읽기 실패:', error);
    throw error;
  }
}

// 데이터 파싱 로직 분리
function parseWeeklySalesData(data: any[][]): WeeklySalesRecord[] {
  try {
    
    // 헤더는 2번째 행 (인덱스 1)
    const headers = data[1];
    
    console.log(`📊 총 헤더 수: ${headers.length}`);
    console.log(`📋 헤더 샘플 (20-40):`, headers.slice(20, 41).map((h: any, i: number) => `[${20+i}]=${h}(${typeof h})`));
    
    // 날짜 컬럼 찾기 - 전체 헤더에서 숫자(엑셀 날짜)인 것을 찾음
    const dateColumns: string[] = [];
    const dateColumnIndices: number[] = [];
    
    // V열(21)부터 AN열(39)까지 또는 전체에서 날짜 형식 찾기
    const tempDateData: { date: string; serial: number; index: number }[] = [];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      // 엑셀 날짜는 숫자 형식이거나 날짜 객체
      if (typeof header === 'number') {
        // 45000~46000 범위 (2023-2025년)
        if (header > 44900 && header < 46500) {
          const dateStr = excelDateToJSDate(header);
          tempDateData.push({ date: dateStr, serial: header, index: i });
          console.log(`  ✅ [${i}]: ${header} → ${dateStr}`);
        }
      } else if (header instanceof Date) {
        // Date 객체인 경우
        const dateStr = header.toISOString().split('T')[0];
        const year = header.getFullYear();
        const month = header.getMonth();
        const day = header.getDate();
        const serial = Math.floor((new Date(year, month, day).getTime() / 86400000) + 25569);
        tempDateData.push({ date: dateStr, serial, index: i });
        console.log(`  ✅ [${i}]: Date → ${dateStr}`);
      }
    }
    
    // 날짜로 정렬 (오름차순)
    tempDateData.sort((a, b) => a.date.localeCompare(b.date));
    
    // 11월 1일(2025-11-01) 이후만 필터링
    const filteredDates = tempDateData.filter(d => d.date >= '2025-11-01' && d.date <= '2025-11-30');
    
    console.log(`📅 필터링 전 날짜 수: ${tempDateData.length}`);
    console.log(`📅 필터링 후 (11월 1일~30일) 날짜 수: ${filteredDates.length}`);
    if (filteredDates.length > 0) {
      console.log(`📅 첫 날짜: ${filteredDates[0].date}, 마지막 날짜: ${filteredDates[filteredDates.length - 1].date}`);
      console.log(`📅 모든 날짜:`, filteredDates.map(d => d.date).join(', '));
      
      // 23일 데이터 확인
      const has23rd = filteredDates.some(d => d.date === '2025-11-23');
      console.log(`✅ 2025-11-23 데이터 포함: ${has23rd ? 'YES ✓' : 'NO ✗'}`);
    }
    
    filteredDates.forEach(d => {
      dateColumns.push(d.date);
      dateColumnIndices.push(d.index);
    });
    
    console.log(`📅 추출된 날짜 컬럼 수: ${dateColumns.length}`);
    if (dateColumns.length > 0) {
      console.log(`📅 날짜 컬럼 인덱스: ${dateColumnIndices[0]} ~ ${dateColumnIndices[dateColumnIndices.length - 1]}`);
      console.log(`📅 날짜 범위: ${dateColumns[0]} ~ ${dateColumns[dateColumns.length - 1]}`);
    } else {
      console.warn('⚠️ 날짜 컬럼을 찾을 수 없습니다!');
    }
    
    // 데이터 파싱 (3번째 행부터, 인덱스 2부터)
    const records: WeeklySalesRecord[] = [];
    
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      
      if (!row[1] || !row[2]) continue; // 매장 정보가 없으면 스킵
      
      const storeCode = String(row[1]);
      const storeName = String(row[2]);
      const storeInfo = createStoreInfo(storeCode, storeName);
      
      // 일별 판매 데이터 추출
      const dailySales: { [date: string]: number } = {};
      for (let j = 0; j < dateColumns.length; j++) {
        const columnIndex = dateColumnIndices[j];
        const qty = row[columnIndex];
        if (qty && typeof qty === 'number' && qty > 0) {
          dailySales[dateColumns[j]] = qty;
        }
      }
      
      records.push({
        storeCode,
        storeName,
        storeInfo,
        item: String(row[3] || ''),
        season: String(row[4] || ''),
        productCode: String(row[5] || ''),
        productName: String(row[6] || ''),
        retailPrice: typeof row[7] === 'number' ? row[7] : 0,
        salesType: String(row[8] || ''),
        customerType: String(row[9] || ''),
        discountRate: String(row[10] || ''),
        totalQuantity: typeof row[11] === 'number' ? row[11] : 0,  // L열 - 판매수량
        totalSales: typeof row[12] === 'number' ? row[12] : 0,  // M열 - 판매액
        totalTagPrice: typeof row[13] === 'number' ? row[13] : 0,  // N열 - 판매택가
        normalQuantity: typeof row[14] === 'number' ? row[14] : 0,  // O열 - 정상_판매수량
        normalSales: typeof row[15] === 'number' ? row[15] : 0,  // P열 - 정상_판매액
        normalTagPrice: typeof row[16] === 'number' ? row[16] : 0,
        returnQuantity: typeof row[17] === 'number' ? row[17] : 0,
        returnSales: typeof row[18] === 'number' ? row[18] : 0,
        returnTagPrice: typeof row[19] === 'number' ? row[19] : 0,
        dailySales
      });
    }
    
    console.log(`✅ ${records.length.toLocaleString()}개 레코드 파싱 완료`);
    return records;
    
  } catch (error) {
    console.error('데이터 파싱 실패:', error);
    throw error;
  }
}

// 분석 데이터 생성
export function analyzeWeeklySales(
  records: WeeklySalesRecord[], 
  period: 'weekly' | 'monthly' = 'monthly',
  channelFilter?: '국내' | '면세' | '도매' | 'RF', // 상권 필터 추가
  seasonFilter?: string // 시즌 필터 추가
): WeeklySalesAnalytics {
  console.log(`🔍 분석 시작: ${records.length}개 레코드, 기간: ${period}${channelFilter ? `, 상권: ${channelFilter}` : ''}${seasonFilter ? `, 시즌: ${seasonFilter}` : ''}`);
  
  // 상권 필터 적용 (backdata.xlsx의 "상권구분" 시트 사용)
  if (channelFilter) {
    const originalCount = records.length;
    const matchedStores = new Set<string>();
    
    // backdata.xlsx의 "상권구분" 시트에서 상권 정보 읽기
    let storeAreaMap: Map<string, string> = new Map();
    try {
      const { readStoreArea } = require('./storePerformanceReader');
      storeAreaMap = readStoreArea('backdata.xlsx');
      console.log(`📊 상권구분 시트에서 ${storeAreaMap.size}개 매장 정보 로드`);
    } catch (error: any) {
      console.log(`⚠️  상권구분 시트 읽기 실패, 키워드 기반 필터링 사용: ${error.message}`);
    }
    
    records = records.filter(r => {
      const storeName = r.storeName || '';
      let matches = false;
      
      // 먼저 상권구분 시트에서 상권 정보 확인
      if (storeAreaMap.size > 0) {
        const area = storeAreaMap.get(storeName);
        if (area) {
          // 상권구분 시트의 상권명과 필터 비교 (유연한 매칭)
          const normalizedArea = area.trim().toUpperCase();
          const normalizedFilter = channelFilter.toUpperCase();
          
          // 정확히 일치하거나 포함 관계 확인
          matches = normalizedArea === normalizedFilter || 
                   normalizedArea.includes(normalizedFilter) ||
                   normalizedFilter.includes(normalizedArea) ||
                   // 다양한 형식 지원
                   (normalizedFilter === '국내' && (normalizedArea.includes('국내') || normalizedArea.includes('내수'))) ||
                   (normalizedFilter === '면세' && normalizedArea.includes('면세')) ||
                   (normalizedFilter === '도매' && (normalizedArea.includes('도매') || normalizedArea.includes('대리'))) ||
                   (normalizedFilter === 'RF' && normalizedArea.includes('RF'));
        } else {
          // 상권구분 시트에 없는 매장은 키워드 기반 필터링 사용 (폴백)
          switch (channelFilter) {
            case "국내":
              matches = storeName.includes('(직)') || 
                       storeName.includes('롯데') || 
                       storeName.includes('현대') || 
                       storeName.includes('신세계') ||
                       storeName.includes('갤러리아') ||
                       storeName.includes('AK');
              break;
            case "면세":
              matches = storeName.includes('면세');
              break;
            case "도매":
              matches = storeName.includes('(대-위)') || 
                       storeName.includes('(대리)') ||
                       storeName.includes('(대)');
              break;
            case "RF":
              const upperStoreName = storeName.toUpperCase();
              matches = upperStoreName.includes('RF') || 
                       upperStoreName.includes('(RF)') ||
                       upperStoreName.includes('RF점') ||
                       upperStoreName.includes('RF매장');
              break;
          }
        }
      } else {
        // 상권구분 시트를 읽을 수 없으면 키워드 기반 필터링 사용
        switch (channelFilter) {
          case "국내":
            matches = storeName.includes('(직)') || 
                     storeName.includes('롯데') || 
                     storeName.includes('현대') || 
                     storeName.includes('신세계') ||
                     storeName.includes('갤러리아') ||
                     storeName.includes('AK');
            break;
          case "면세":
            matches = storeName.includes('면세');
            break;
          case "도매":
            matches = storeName.includes('(대-위)') || 
                     storeName.includes('(대리)') ||
                     storeName.includes('(대)');
            break;
          case "RF":
            const upperStoreName = storeName.toUpperCase();
            matches = upperStoreName.includes('RF') || 
                     upperStoreName.includes('(RF)') ||
                     upperStoreName.includes('RF점') ||
                     upperStoreName.includes('RF매장');
            break;
        }
      }
      
      if (matches && !matchedStores.has(storeName)) {
        matchedStores.add(storeName);
      }
      
      return matches;
    });
    
    console.log(`📊 상권 필터 적용 (${channelFilter}): ${originalCount}개 → ${records.length}개 레코드`);
    console.log(`   → 매칭된 매장 수: ${matchedStores.size}개`);
    if (matchedStores.size > 0 && matchedStores.size <= 10) {
      console.log(`   → 매장 목록: ${Array.from(matchedStores).join(', ')}`);
    }
  }
  
  // 시즌 필터 적용 (원본 데이터 레벨에서)
  if (seasonFilter) {
    const originalCount = records.length;
    records = records.filter(r => r.season === seasonFilter);
    console.log(`📦 시즌 필터 적용: ${originalCount}개 → ${records.length}개 레코드`);
  }
  
  // 날짜 추출 (먼저 날짜를 확인해서 주간 필터링에 사용)
  const allDates = new Set<string>();
  records.forEach(r => {
    Object.keys(r.dailySales).forEach(date => allDates.add(date));
  });
  let dates = Array.from(allDates).sort();
  
  // 주간 필터: 최근 7일만 사용
  if (period === 'weekly' && dates.length > 7) {
    const recentDates = dates.slice(-7); // 최근 7일
    console.log(`📅 주간 필터 적용: ${recentDates[0]} ~ ${recentDates[recentDates.length - 1]}`);
    
    // records를 필터링하여 최근 7일의 판매만 포함하도록 변환
    records = records.map(r => {
      const filteredDailySales: { [date: string]: number } = {};
      let filteredQuantity = 0;
      let filteredSales = 0;
      
      recentDates.forEach(date => {
        if (r.dailySales[date]) {
          filteredDailySales[date] = r.dailySales[date];
          filteredQuantity += r.dailySales[date];
        }
      });
      
      // 비율 계산하여 판매액 추정 (일별 수량을 기준으로)
      const totalDailyQuantity = Object.values(r.dailySales).reduce((sum, qty) => sum + qty, 0);
      if (totalDailyQuantity > 0) {
        filteredSales = (r.totalSales * filteredQuantity) / totalDailyQuantity;
      }
      
      return {
        ...r,
        dailySales: filteredDailySales,
        totalQuantity: filteredQuantity,
        totalSales: filteredSales
      };
    }).filter(r => r.totalQuantity > 0); // 해당 기간에 판매가 있는 레코드만
    
    dates = recentDates;
  }
  
  // 전체 통계 - M열(판매액), L열(판매수량) 사용
  const totalSales = records.reduce((sum, r) => sum + r.totalSales, 0);  // M열 = 판매액
  const totalQuantity = records.reduce((sum, r) => sum + r.totalQuantity, 0);  // L열 = 판매수량
  const totalReturns = records.reduce((sum, r) => sum + Math.abs(r.returnSales), 0);
  
  console.log(`📅 추출된 고유 날짜 수: ${dates.length}`);
  if (dates.length > 0) {
    console.log(`📅 날짜 범위: ${dates[0]} ~ ${dates[dates.length - 1]}`);
  } else {
    console.warn('⚠️ 날짜가 추출되지 않았습니다!');
    // 샘플 레코드 확인
    if (records.length > 0) {
      console.log('샘플 레코드의 dailySales:', records[0].dailySales);
      console.log('dailySales 키 수:', Object.keys(records[0].dailySales).length);
    }
  }
  
  // 일별 집계 - M열(판매액), L열(판매수량) 사용
  const dailyMap = new Map<string, { sales: number; quantity: number; transactions: number }>();
  records.forEach(r => {
    Object.entries(r.dailySales).forEach(([date, qty]) => {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { sales: 0, quantity: 0, transactions: 0 });
      }
      const daily = dailyMap.get(date)!;
      daily.quantity += qty;
      // M열(판매액)을 L열(판매수량)으로 비례 배분
      if (r.totalQuantity > 0) {  // L열 = 판매수량
        daily.sales += (r.totalSales / r.totalQuantity) * qty;  // M열 = 판매액
      }
      daily.transactions += 1;
    });
  });
  
  const dailyTotals = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // 매장별 집계
  const storeMap = new Map<string, {
    storeCode: string;
    storeName: string;
    storeInfo: StoreInfo;
    sales: number;
    quantity: number;
    transactions: number;
  }>();
  
  records.forEach(r => {
    const key = r.storeCode;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeCode: r.storeCode,
        storeName: r.storeName,
        storeInfo: r.storeInfo,
        sales: 0,
        quantity: 0,
        transactions: 0
      });
    }
    const store = storeMap.get(key)!;
    store.sales += r.totalSales;  // M열 = 판매액
    store.quantity += r.totalQuantity;  // L열 = 판매수량
    store.transactions += 1;  // 레코드 수 = 거래건수
  });
  
  const storeStats = Array.from(storeMap.values())
    .sort((a, b) => b.sales - a.sales)
    .map((store, index) => ({
      storeCode: store.storeCode,
      storeName: store.storeName,
      storeType: getStoreTypeLabel(store.storeInfo.type),
      storeBrand: store.storeInfo.brand,
      storeRegion: store.storeInfo.region,
      sales: store.sales,
      quantity: store.quantity,
      transactions: store.transactions,
      share: (store.sales / totalSales) * 100,
      rank: index + 1
    }));
  
  // 매장 유형별 집계
  const typeMap = new Map<string, { stores: Set<string>; sales: number; quantity: number }>();
  storeMap.forEach(store => {
    const type = store.storeInfo.type;
    if (!typeMap.has(type)) {
      typeMap.set(type, { stores: new Set(), sales: 0, quantity: 0 });
    }
    const typeData = typeMap.get(type)!;
    typeData.stores.add(store.storeCode);
    typeData.sales += store.sales;
    typeData.quantity += store.quantity;
  });
  
  const storeTypeStats = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      typeLabel: getStoreTypeLabel(type as StoreInfo['type']),
      storeCount: data.stores.size,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100,
      averagePerStore: data.sales / data.stores.size
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 백화점 브랜드별 집계
  const brandMap = new Map<string, { stores: Set<string>; sales: number; quantity: number }>();
  storeMap.forEach(store => {
    if (store.storeInfo.type === 'department' && store.storeInfo.brand) {
      const brand = store.storeInfo.brand;
      if (!brandMap.has(brand)) {
        brandMap.set(brand, { stores: new Set(), sales: 0, quantity: 0 });
      }
      const brandData = brandMap.get(brand)!;
      brandData.stores.add(store.storeCode);
      brandData.sales += store.sales;
      brandData.quantity += store.quantity;
    }
  });
  
  const departmentBrandStats = Array.from(brandMap.entries())
    .map(([brand, data]) => ({
      brand,
      storeCount: data.stores.size,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 지역별 집계
  const regionMap = new Map<string, { stores: Set<string>; sales: number; quantity: number }>();
  storeMap.forEach(store => {
    const region = store.storeInfo.region || '기타';
    if (!regionMap.has(region)) {
      regionMap.set(region, { stores: new Set(), sales: 0, quantity: 0 });
    }
    const regionData = regionMap.get(region)!;
    regionData.stores.add(store.storeCode);
    regionData.sales += store.sales;
    regionData.quantity += store.quantity;
  });
  
  const regionStats = Array.from(regionMap.entries())
    .map(([region, data]) => ({
      region,
      storeCount: data.stores.size,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 온라인 vs 오프라인
  let onlineStores = new Set<string>();
  let offlineStores = new Set<string>();
  let onlineSales = 0, offlineSales = 0;
  let onlineQty = 0, offlineQty = 0;
  
  storeMap.forEach(store => {
    if (store.storeInfo.isOnline) {
      onlineStores.add(store.storeCode);
      onlineSales += store.sales;
      onlineQty += store.quantity;
    } else {
      offlineStores.add(store.storeCode);
      offlineSales += store.sales;
      offlineQty += store.quantity;
    }
  });
  
  // 아이템별 집계
  const itemMap = new Map<string, { sales: number; quantity: number }>();
  records.forEach(r => {
    if (!itemMap.has(r.item)) {
      itemMap.set(r.item, { sales: 0, quantity: 0 });
    }
    const item = itemMap.get(r.item)!;
    item.sales += r.totalSales;  // M열 = 판매액
    item.quantity += r.totalQuantity;  // L열 = 판매수량
  });
  
  const itemStats = Array.from(itemMap.entries())
    .map(([item, data]) => ({
      item,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 시즌별 집계
  const seasonMap = new Map<string, { sales: number; quantity: number }>();
  records.forEach(r => {
    if (!seasonMap.has(r.season)) {
      seasonMap.set(r.season, { sales: 0, quantity: 0 });
    }
    const season = seasonMap.get(r.season)!;
    season.sales += r.totalSales;  // M열 = 판매액
    season.quantity += r.totalQuantity;  // L열 = 판매수량
  });
  
  const seasonStats = Array.from(seasonMap.entries())
    .map(([season, data]) => ({
      season,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 베스트셀러 (제품별) - 매장 정보 포함
  const productMap = new Map<string, {
    productName: string;
    item: string;
    season: string;
    sales: number;
    quantity: number;
    storeBreakdown: Map<string, { storeName: string; quantity: number; sales: number }>;
  }>();
  
  records.forEach(r => {
    if (!productMap.has(r.productCode)) {
      productMap.set(r.productCode, {
        productName: r.productName,
        item: r.item,
        season: r.season,
        sales: 0,
        quantity: 0,
        storeBreakdown: new Map()
      });
    }
    const product = productMap.get(r.productCode)!;
    product.sales += r.totalSales;  // M열 = 판매액
    product.quantity += r.totalQuantity;  // L열 = 판매수량
    
    // 매장별 판매 추가
    const storeKey = `${r.storeCode}|${r.storeName}`;
    if (!product.storeBreakdown.has(storeKey)) {
      product.storeBreakdown.set(storeKey, { storeName: r.storeName, quantity: 0, sales: 0 });
    }
    const storeData = product.storeBreakdown.get(storeKey)!;
    storeData.quantity += r.totalQuantity;  // L열 = 판매수량
    storeData.sales += r.totalSales;  // M열 = 판매액
  });
  
  const bestSellers = Array.from(productMap.entries())
    .map(([code, data]) => {
      // 매장별 Top 5
      const topStores = Array.from(data.storeBreakdown.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      return {
        productCode: code,
        productName: data.productName,
        item: data.item,
        season: data.season,
        quantity: data.quantity,
        sales: data.sales,
        topStores
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 50);

  // 워스트 아이템 (판매수량이 가장 적은 제품들) - 매장 정보 포함
  const worstSellers = Array.from(productMap.entries())
    .map(([code, data]) => {
      // 매장별 Top 5 (베스트셀러와 동일하게)
      const topStores = Array.from(data.storeBreakdown.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      return {
        productCode: code,
        productName: data.productName,
        item: data.item,
        season: data.season,
        quantity: data.quantity,
        sales: data.sales,
        topStores // 매장 정보 추가 (상권 필터용)
      };
    })
    .sort((a, b) => a.quantity - b.quantity) // 판매수량 오름차순 정렬
    .slice(0, 20); // 하위 20개

  return {
    _period: period, // 캐시 비교용
    totalSales,
    totalQuantity,
    averagePrice: totalSales / totalQuantity,
    returnRate: (totalReturns / totalSales) * 100,
    dateRange: {
      start: dates[0] || '',
      end: dates[dates.length - 1] || '',
      dates
    },
    dailyTotals,
    storeStats,
    storeTypeStats,
    departmentBrandStats,
    regionStats,
    onlineOfflineStats: {
      online: {
        storeCount: onlineStores.size,
        sales: onlineSales,
        quantity: onlineQty,
        share: (onlineSales / totalSales) * 100
      },
      offline: {
        storeCount: offlineStores.size,
        sales: offlineSales,
        quantity: offlineQty,
        share: (offlineSales / totalSales) * 100
      }
    },
    itemStats,
    seasonStats,
    bestSellers,
    worstSellers // 워스트 아이템 추가
  };
}

