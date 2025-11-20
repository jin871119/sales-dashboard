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
    // 프로젝트 루트 경로
    const rootDir = process.cwd();
    
    // 엑셀 파일 찾기
    const files = fs.readdirSync(rootDir);
    const excelFile = files.find(f => 
      f.startsWith('mw_일주월별_판매') && 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$') // 임시 파일 제외
    );
    
    if (!excelFile) {
      console.error('프로젝트 루트:', rootDir);
      console.error('파일 목록:', files.filter(f => f.includes('일주월별')));
      throw new Error('mw_일주월별_판매 엑셀 파일을 찾을 수 없습니다.');
    }
    
    const filePath = path.join(rootDir, excelFile);
    console.log(`📊 읽는 중: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    // 헤더는 2번째 행 (인덱스 1)
    const headers = data[1];
    
    // 날짜 컬럼 추출 (20번째 컬럼부터)
    const dateColumns: string[] = [];
    for (let i = 20; i < headers.length; i++) {
      if (typeof headers[i] === 'number') {
        dateColumns.push(excelDateToJSDate(headers[i]));
      }
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
        const qty = row[20 + j];
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
        totalQuantity: typeof row[11] === 'number' ? row[11] : 0,
        totalSales: typeof row[12] === 'number' ? row[12] : 0,
        totalTagPrice: typeof row[13] === 'number' ? row[13] : 0,
        normalQuantity: typeof row[14] === 'number' ? row[14] : 0,
        normalSales: typeof row[15] === 'number' ? row[15] : 0,
        normalTagPrice: typeof row[16] === 'number' ? row[16] : 0,
        returnQuantity: typeof row[17] === 'number' ? row[17] : 0,
        returnSales: typeof row[18] === 'number' ? row[18] : 0,
        returnTagPrice: typeof row[19] === 'number' ? row[19] : 0,
        dailySales
      });
    }
    
    console.log(`✅ ${records.length.toLocaleString()}개 레코드 읽기 완료`);
    return records;
    
  } catch (error) {
    console.error('엑셀 파일 읽기 실패:', error);
    throw error;
  }
}

// 분석 데이터 생성
export function analyzeWeeklySales(records: WeeklySalesRecord[]): WeeklySalesAnalytics {
  // 전체 통계
  const totalSales = records.reduce((sum, r) => sum + r.totalSales, 0);
  const totalQuantity = records.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalReturns = records.reduce((sum, r) => sum + Math.abs(r.returnSales), 0);
  
  // 날짜 추출
  const allDates = new Set<string>();
  records.forEach(r => {
    Object.keys(r.dailySales).forEach(date => allDates.add(date));
  });
  const dates = Array.from(allDates).sort();
  
  // 일별 집계
  const dailyMap = new Map<string, { sales: number; quantity: number; transactions: number }>();
  records.forEach(r => {
    Object.entries(r.dailySales).forEach(([date, qty]) => {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { sales: 0, quantity: 0, transactions: 0 });
      }
      const daily = dailyMap.get(date)!;
      daily.quantity += qty;
      daily.sales += (r.totalSales / r.totalQuantity) * qty; // 비례 배분
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
  }>();
  
  records.forEach(r => {
    const key = r.storeCode;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeCode: r.storeCode,
        storeName: r.storeName,
        storeInfo: r.storeInfo,
        sales: 0,
        quantity: 0
      });
    }
    const store = storeMap.get(key)!;
    store.sales += r.totalSales;
    store.quantity += r.totalQuantity;
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
    item.sales += r.totalSales;
    item.quantity += r.totalQuantity;
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
    season.sales += r.totalSales;
    season.quantity += r.totalQuantity;
  });
  
  const seasonStats = Array.from(seasonMap.entries())
    .map(([season, data]) => ({
      season,
      sales: data.sales,
      quantity: data.quantity,
      share: (data.sales / totalSales) * 100
    }))
    .sort((a, b) => b.sales - a.sales);
  
  // 베스트셀러 (제품별)
  const productMap = new Map<string, {
    productName: string;
    item: string;
    season: string;
    sales: number;
    quantity: number;
  }>();
  
  records.forEach(r => {
    if (!productMap.has(r.productCode)) {
      productMap.set(r.productCode, {
        productName: r.productName,
        item: r.item,
        season: r.season,
        sales: 0,
        quantity: 0
      });
    }
    const product = productMap.get(r.productCode)!;
    product.sales += r.totalSales;
    product.quantity += r.totalQuantity;
  });
  
  const bestSellers = Array.from(productMap.entries())
    .map(([code, data]) => ({
      productCode: code,
      productName: data.productName,
      item: data.item,
      season: data.season,
      quantity: data.quantity,
      sales: data.sales
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 50);
  
  return {
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
    bestSellers
  };
}

