import { NextResponse } from 'next/server';
import { readWeeklySalesExcel, analyzeWeeklySales } from '@/lib/weeklyMonthlySalesReader';
import { readStoreArea } from '@/lib/storePerformanceReader';

// 빌드 시 정적 생성 방지 및 항상 최신 데이터 로드
export const dynamic = 'force-dynamic';

// 캐시 (메모리에 저장)
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 개발 중에는 캐시 무시 (디버깅용)
const FORCE_REFRESH = true;

export async function GET(request: Request) {
  try {
    console.log('🔍 API 호출됨: /api/weekly-sales');
    console.log('📂 현재 작업 디렉토리:', process.cwd());
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'analytics';
    const period = searchParams.get('period') || 'monthly';
    const storeType = searchParams.get('storeType');
    const brand = searchParams.get('brand');
    const region = searchParams.get('region');
    const onlineOnly = searchParams.get('onlineOnly');
    
    console.log(`📅 기간 필터: ${period}`);
    
    // 캐시 확인
    const now = Date.now();
    if (FORCE_REFRESH || !cachedData || (now - cacheTime) > CACHE_DURATION) {
      console.log('📊 일주월별 판매 데이터 읽는 중...');
      console.log('⏰ 캐시 시간 초과, 새로 읽기 시작');
      
      const records = readWeeklySalesExcel();
      console.log(`✅ ${records.length}개 레코드 읽음`);
      
      cachedData = analyzeWeeklySales(records, period as 'weekly' | 'monthly');
      cacheTime = now;
      console.log('✅ 데이터 캐시 완료');
    } else {
      console.log('⚡ 캐시된 데이터 사용');
      // period가 변경되면 재분석
      const currentPeriod = cachedData._period || 'monthly';
      if (currentPeriod !== period) {
        console.log(`⚡ 기간 변경 감지 (${currentPeriod} → ${period}), 재분석 시작`);
        const records = readWeeklySalesExcel();
        cachedData = analyzeWeeklySales(records, period as 'weekly' | 'monthly');
        cacheTime = now;
      }
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
        // 상권 데이터 읽기 (backdata.xlsx)
        let storeAreaMap = new Map<string, string>();
        try {
          storeAreaMap = readStoreArea("backdata.xlsx");
          console.log(`✅ 상권 데이터 매핑 준비 완료: ${storeAreaMap.size}개 매장`);
        } catch (e) {
          console.log('⚠️ 상권 데이터 로드 실패 (무시됨):', e);
        }

        // StoreDistributionDashboard가 기대하는 형식으로 변환
        const byRegion = (data.regionStats || []).map((r: any) => ({
          region: r.region,
          totalSales: r.sales,
          totalQuantity: r.quantity,
          storeCount: r.storeCount
        }));
        
        const stores = (data.storeStats || []).map((s: any) => {
          // 상권 정보 매핑
          const commercialArea = storeAreaMap.get(s.storeName) || '기타';
          
          return {
            storeCode: s.storeCode,
            storeName: s.storeName,
            region: s.storeRegion,
            commercialArea: commercialArea, // 상권 정보 추가
            storeType: s.storeType,
            brand: s.storeBrand,
            totalSales: s.sales,
            totalQuantity: s.quantity,
            totalTransactions: s.transactions || 0
          };
        });

        // 상권별 집계 생성
        const areaMap = new Map<string, { sales: number; quantity: number; count: number }>();
        stores.forEach((s: any) => {
          const area = s.commercialArea;
          if (!areaMap.has(area)) {
            areaMap.set(area, { sales: 0, quantity: 0, count: 0 });
          }
          const val = areaMap.get(area)!;
          val.sales += s.totalSales;
          val.quantity += s.totalQuantity;
          val.count += 1;
        });

        const byCommercialArea = Array.from(areaMap.entries())
          .map(([area, val]) => ({
            commercialArea: area,
            totalSales: val.sales,
            totalQuantity: val.quantity,
            storeCount: val.count
          }))
          .sort((a, b) => b.totalSales - a.totalSales); // 매출순 정렬
        
        return NextResponse.json({
          success: true,
          summary: {
            startDate: data.dateRange?.start || '',
            endDate: data.dateRange?.end || '',
            totalSales: data.totalSales || 0,
            totalQuantity: data.totalQuantity || 0,
            totalTransactions: data.storeStats?.reduce((sum: number, s: any) => sum + (s.transactions || 0), 0) || 0,
            storeCount: data.storeStats?.length || 0
          },
          stores: stores,
          byRegion: byRegion,
          byCommercialArea: byCommercialArea, // 상권별 데이터 추가
          dailyTotals: data.dailyTotals || [],
          itemStats: data.itemStats || [],
          seasonStats: data.seasonStats || [],
          bestSellers: data.bestSellers || [],
          storeTypeStats: data.storeTypeStats || [],
          departmentBrandStats: data.departmentBrandStats || [],
          onlineOfflineStats: data.onlineOfflineStats || {}
        });
    }
  } catch (error: any) {
    console.error('❌ API 오류:', error);
    console.error('📍 오류 스택:', error.stack);
    
    // 파일 시스템 정보 출력
    const fs = require('fs');
    const rootDir = process.cwd();
    console.error('📂 프로젝트 루트:', rootDir);
    
    try {
      const files = fs.readdirSync(rootDir);
      const xlsxFiles = files.filter((f: string) => f.endsWith('.xlsx'));
      console.error('📄 루트의 xlsx 파일들:', xlsxFiles);
    } catch (e) {
      console.error('❌ 디렉토리 읽기 실패:', e);
    }
    
    return NextResponse.json(
      { 
        error: '데이터 로드 실패', 
        message: error.message,
        stack: error.stack,
        cwd: process.cwd(),
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

