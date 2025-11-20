import { NextResponse } from 'next/server';
import { readWeeklySalesExcel, analyzeWeeklySales } from '@/lib/weeklyMonthlySalesReader';

// 캐시 (메모리에 저장)
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'analytics';
    const storeType = searchParams.get('storeType');
    const brand = searchParams.get('brand');
    const region = searchParams.get('region');
    const onlineOnly = searchParams.get('onlineOnly');
    
    // 캐시 확인
    const now = Date.now();
    if (!cachedData || (now - cacheTime) > CACHE_DURATION) {
      console.log('📊 일주월별 판매 데이터 읽는 중...');
      const records = readWeeklySalesExcel();
      cachedData = analyzeWeeklySales(records);
      cacheTime = now;
      console.log('✅ 데이터 캐시 완료');
    }
    
    let data = { ...cachedData };
    
    // 필터링 적용
    if (storeType || brand || region || onlineOnly) {
      data.storeStats = data.storeStats.filter((store: any) => {
        if (storeType && store.storeType !== storeType) return false;
        if (brand && store.storeBrand !== brand) return false;
        if (region && store.storeRegion !== region) return false;
        if (onlineOnly === 'true' && !store.storeName.includes('(제휴몰)') && !store.storeName.includes('온라인')) return false;
        if (onlineOnly === 'false' && (store.storeName.includes('(제휴몰)') || store.storeName.includes('온라인'))) return false;
        return true;
      });
    }
    
    // 뷰에 따른 데이터 반환
    switch (view) {
      case 'summary':
        return NextResponse.json({
          totalSales: data.totalSales,
          totalQuantity: data.totalQuantity,
          averagePrice: data.averagePrice,
          returnRate: data.returnRate,
          dateRange: data.dateRange,
          storeCount: data.storeStats.length
        });
      
      case 'stores':
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '30');
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return NextResponse.json({
          stores: data.storeStats.slice(start, end),
          total: data.storeStats.length,
          page,
          pageSize,
          totalPages: Math.ceil(data.storeStats.length / pageSize)
        });
      
      case 'daily':
        return NextResponse.json({
          dailyTotals: data.dailyTotals,
          dateRange: data.dateRange
        });
      
      case 'types':
        return NextResponse.json({
          storeTypeStats: data.storeTypeStats,
          departmentBrandStats: data.departmentBrandStats,
          regionStats: data.regionStats,
          onlineOfflineStats: data.onlineOfflineStats
        });
      
      case 'products':
        return NextResponse.json({
          itemStats: data.itemStats,
          seasonStats: data.seasonStats,
          bestSellers: data.bestSellers.slice(0, 20)
        });
      
      case 'analytics':
      default:
        return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { 
        error: '데이터 로드 실패', 
        message: error.message,
        hint: 'mw_일주월별_판매 엑셀 파일이 프로젝트 루트에 있는지 확인하세요.'
      },
      { status: 500 }
    );
  }
}

// 캐시 강제 새로고침
export async function POST() {
  cachedData = null;
  cacheTime = 0;
  return NextResponse.json({ message: '캐시가 초기화되었습니다.' });
}

