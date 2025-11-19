import { NextResponse } from "next/server";

// 엑셀 파일에서 데이터를 읽어옵니다
export async function GET() {
  try {
    // xlsx 패키지 동적 import 시도
    try {
      const { readExcelFile } = await import("@/lib/excelReader");
      const { readSummarySheet } = await import("@/lib/summaryReader");
      const { readMonthlyTargetSheet, readWeeklySalesSheet } = await import("@/lib/backDataReader");
      
      // 메인 데이터 읽기
      const excelData = readExcelFile("ending focast.xlsx");
      const sheetName = Object.keys(excelData)[0];
      const rawData = excelData[sheetName];
      
      console.log('✅ ending focast.xlsx 데이터 로드 성공:', {
        sheetName,
        rowCount: rawData.length,
        columns: rawData.length > 0 ? Object.keys(rawData[0]) : []
      });
      
      // "요약" 시트 읽기
      let summaryData = null;
      try {
        summaryData = readSummarySheet("ending focast.xlsx");
        console.log('✅ "요약" 시트 로드 성공');
      } catch (summaryError) {
        console.log('⚠️  "요약" 시트 로드 실패:', summaryError);
      }
      
      // backdata.xlsx의 "월별목표" 시트 읽기
      let monthlyData: any[] | undefined = undefined;
      try {
        monthlyData = readMonthlyTargetSheet("backdata.xlsx");
        console.log('✅ backdata.xlsx "월별목표" 시트 로드 성공:', monthlyData.length + '개월');
      } catch (monthlyError) {
        console.log('⚠️  "월별목표" 시트 로드 실패:', monthlyError);
      }
      
      // backdata.xlsx의 "주차별매출" 시트 읽기
      let weeklyData: any[] | undefined = undefined;
      try {
        weeklyData = readWeeklySalesSheet("backdata.xlsx");
        console.log('✅ backdata.xlsx "주차별매출" 시트 로드 성공:', weeklyData.length + '주차');
      } catch (weeklyError) {
        console.log('⚠️  "주차별매출" 시트 로드 실패:', weeklyError);
      }
      
      const data = convertExcelToDashboard(rawData, sheetName, summaryData, monthlyData, weeklyData);
      return NextResponse.json(data);
      
    } catch (xlsxError: any) {
      // xlsx 패키지가 없거나 파일이 없는 경우
      console.log('⚠️  엑셀 파일 로드 실패:', xlsxError.message);
      console.log('💡 해결방법: setup-excel.bat 파일을 실행하세요');
      
      return NextResponse.json({
        ...getDefaultData(),
        summary: {
          totalRows: 0,
          lastUpdated: "엑셀 연동 대기 중",
          dataRange: "N/A"
        },
        _notice: "xlsx 패키지를 설치하고 엑셀 파일을 분석하려면 setup-excel.bat를 실행하세요."
      });
    }
    
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    return NextResponse.json(getDefaultData());
  }
}

/**
 * ending focast.xlsx 데이터를 대시보드 형식으로 변환
 * 
 * 📋 3541행의 대용량 데이터를 효율적으로 처리합니다
 * 
 * ⚠️ 실제 엑셀 구조에 맞게 컬럼명을 수정하세요!
 *    npm run analyze 명령으로 실제 컬럼명을 확인할 수 있습니다.
 */
function convertExcelToDashboard(rawData: any[], sheetName: string, summaryData?: any, monthlyData?: any[], weeklyData?: any[]) {
  console.log(`\n🔄 데이터 변환 시작: ${rawData.length.toLocaleString()}행 처리 중...\n`);
  
  // 엑셀에서 읽은 데이터로 각 섹션 생성
  const startTime = Date.now();
  
  // 1️⃣ 월별 매출 데이터 변환 (backdata.xlsx의 "월별목표" 시트 사용)
  let monthlySales = [];
  
  if (monthlyData && monthlyData.length > 0) {
    // backdata.xlsx에서 읽은 월별 데이터 사용
    monthlySales = monthlyData;
    console.log('✅ backdata.xlsx의 월별목표 데이터 사용:', monthlySales.length + '개월');
    
    // 11월 데이터를 ending focast.xlsx의 예상마감 실적으로 업데이트
    if (summaryData?.forecast?.[0]?.value) {
      const novemberForecast = summaryData.forecast[0].value;
      const novemberIndex = monthlySales.findIndex(item => 
        item.month.includes('11') || 
        item.month.includes('November') || 
        item.month.includes('Nov') ||
        item.month === '11월'
      );
      
      if (novemberIndex !== -1) {
        monthlySales[novemberIndex].매출 = novemberForecast;
        console.log(`✅ 11월 실매출을 예상마감 실적으로 업데이트: ${novemberForecast.toLocaleString()}`);
      } else {
        // 11월 데이터가 없으면 추가
        monthlySales.push({
          month: '11월',
          매출: novemberForecast,
          목표: summaryData.salesTarget?.[0]?.value || 0
        });
        console.log(`✅ 11월 데이터 추가 (예상마감): ${novemberForecast.toLocaleString()}`);
      }
    }
  } else {
    // 기존 방식으로 폴백
    monthlySales = rawData
      .filter(row => row['월'] || row['Month'] || row['month'])
      .map(row => ({
        month: row['월'] || row['Month'] || row['month'] || '',
        매출: parseNumber(row['매출'] || row['Sales'] || row['sales'] || row['실적'] || 0),
        목표: parseNumber(row['목표'] || row['Target'] || row['target'] || row['계획'] || 0),
      }))
      .filter(item => item.month); // 월 정보가 있는 것만
    console.log('⚠️  backdata.xlsx를 찾을 수 없어 기존 데이터 사용');
  }
  
  // 2️⃣ 지역별 데이터 변환
  // 엑셀 컬럼명 예시: "지역", "달성률" 등
  const regionalData = rawData
    .filter(row => row['지역'] || row['Region'] || row['region'])
    .map(row => ({
      지역: row['지역'] || row['Region'] || row['region'] || '',
      달성률: parseNumber(row['달성률'] || row['Achievement'] || row['달성도'] || row['%'] || 0),
      목표: 100,
    }))
    .filter(item => item.지역);
  
  // 3️⃣ 최근 판매 데이터 변환
  // 엑셀 컬럼명 예시: "고객명", "상품", "금액", "상태", "날짜" 등
  const salesData = rawData
    .filter(row => row['고객명'] || row['Customer'] || row['customer'] || row['이름'])
    .map((row, index) => ({
      id: index + 1,
      customer: row['고객명'] || row['Customer'] || row['customer'] || row['이름'] || '',
      product: row['상품'] || row['Product'] || row['product'] || row['품목'] || '',
      amount: formatCurrency(parseNumber(row['금액'] || row['Amount'] || row['amount'] || row['매출'] || 0)),
      status: normalizeStatus(row['상태'] || row['Status'] || row['status'] || '완료'),
      date: formatDate(row['날짜'] || row['Date'] || row['date'] || new Date()),
    }))
    .filter(item => item.customer)
    .slice(0, 10); // 최근 10개만
  
  // 4️⃣ KPI 계산
  const totalSales = monthlySales.reduce((sum, item) => sum + item.매출, 0);
  const totalTarget = monthlySales.reduce((sum, item) => sum + item.목표, 0);
  const achievementRate = totalTarget > 0 ? (totalSales / totalTarget * 100).toFixed(1) : 0;
  const salesChange = calculateChange(monthlySales);
  
  // 5️⃣ Forecast 데이터 추출 (ending focast 파일의 주요 데이터)
  const forecastData = rawData
    .filter(row => {
      // 예측 관련 컬럼이 있는 행만 추출
      const hasForecast = row['Forecast'] || row['예측'] || row['forecast'] || 
                         row['Prediction'] || row['Plan'] || row['계획'];
      return hasForecast != null;
    })
    .map((row, index) => {
      // 기간 정보 추출
      const period = row['Period'] || row['기간'] || row['월'] || row['Month'] || 
                     row['Date'] || row['날짜'] || `데이터 ${index + 1}`;
      
      // 예측값 추출
      const forecast = parseNumber(
        row['Forecast'] || row['예측'] || row['forecast'] || 
        row['Prediction'] || row['Plan'] || row['계획'] || 0
      );
      
      // 실적값 추출
      const actual = parseNumber(
        row['Actual'] || row['실적'] || row['actual'] || 
        row['Result'] || row['결과'] || undefined
      );
      
      return {
        period: String(period),
        forecast,
        actual: actual || undefined,
        upperBound: forecast * 1.1, // 예측의 110%
        lowerBound: forecast * 0.9, // 예측의 90%
      };
    })
    .filter(item => item.forecast > 0)
    .slice(0, 50); // 최근 50개만

  const processingTime = Date.now() - startTime;
  
  console.log(`\n✅ 데이터 변환 완료! (${processingTime}ms)`);
  console.log(`   - 월별 매출: ${monthlySales.length}건`);
  console.log(`   - 지역별 데이터: ${regionalData.length}건`);
  console.log(`   - 판매 내역: ${salesData.length}건`);
  console.log(`   - 예측 데이터: ${forecastData.length}건`);
  
  if (summaryData) {
    console.log(`   - 요약 시트:`);
    if (summaryData.byArea?.length) console.log(`     • 상권별: ${summaryData.byArea.length}건`);
    if (summaryData.byTeam?.length) console.log(`     • Team별: ${summaryData.byTeam.length}건`);
    if (summaryData.byChannel?.length) console.log(`     • 유통별: ${summaryData.byChannel.length}건`);
    if (summaryData.byPure?.length) console.log(`     • 순수별: ${summaryData.byPure.length}건`);
    if (summaryData.byGroup?.length) console.log(`     • 단체별: ${summaryData.byGroup.length}건`);
  }
  console.log('');

  // 요약 시트의 H7, I7, K7 값 추출
  const salesTarget = summaryData?.salesTarget?.[0]?.value || 0;
  const forecast = summaryData?.forecast?.[0]?.value || 0;
  const lastYear = summaryData?.lastYear?.[0]?.value || 0;
  
  // 달성률 및 신장률 계산
  const forecastAchievementRate = salesTarget > 0 ? ((forecast / salesTarget) * 100).toFixed(1) : '0.0';
  const growthRate = lastYear > 0 ? (((forecast - lastYear) / lastYear) * 100).toFixed(1) : '0.0';
  
  const data = {
    kpis: {
      salesTarget: {
        value: formatCurrency(salesTarget),
        change: forecastAchievementRate + '% 달성 예상',
        trend: parseFloat(forecastAchievementRate) >= 100 ? "up" as const : "down" as const,
      },
      forecast: {
        value: formatCurrency(forecast),
        change: forecastAchievementRate + '% 달성률',
        trend: parseFloat(forecastAchievementRate) >= 100 ? "up" as const : "down" as const,
      },
      lastYear: {
        value: formatCurrency(lastYear),
        change: growthRate + '% 신장',
        trend: parseFloat(growthRate) >= 0 ? "up" as const : "down" as const,
      },
      growthRate: {
        value: growthRate + '%',
        change: '전년 대비',
        trend: parseFloat(growthRate) >= 0 ? "up" as const : "down" as const,
      },
    },
    monthlySales: monthlySales.length > 0 ? monthlySales : getDefaultData().monthlySales,
    weeklySales: weeklyData || [],
    regionalTargets: regionalData.length > 0 ? regionalData : getDefaultData().regionalTargets,
    recentSales: salesData.length > 0 ? salesData : getDefaultData().recentSales,
    forecast: forecastData.length > 0 ? forecastData : undefined,
    summarySheet: summaryData || undefined,
    summary: {
      totalRows: rawData.length,
      lastUpdated: new Date().toLocaleString('ko-KR'),
      dataRange: sheetName,
    },
  };

  return data;
}

// ========================================
// 유틸리티 함수들
// ========================================

/**
 * 문자열/숫자를 숫자로 변환
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 쉼표, 공백, 화폐 기호 제거
    const cleaned = value.replace(/[,\s₩$€¥]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * 숫자를 통화 형식으로 변환
 */
function formatCurrency(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`;
}

/**
 * 날짜 형식 변환
 */
function formatDate(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  
  // 엑셀 날짜는 1900년 1월 1일부터의 일수로 저장됨
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  if (typeof value === 'string') {
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    
    // 다른 형식이면 Date로 변환 시도
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

/**
 * 상태 정규화
 */
function normalizeStatus(status: any): "완료" | "처리중" | "대기" {
  const str = String(status).toLowerCase().trim();
  
  if (str.includes('완료') || str.includes('complete') || str.includes('done')) {
    return '완료';
  }
  if (str.includes('처리') || str.includes('progress') || str.includes('processing')) {
    return '처리중';
  }
  return '대기';
}

/**
 * 전월 대비 증감률 계산
 */
function calculateChange(monthlySales: any[]): { change: string; trend: "up" | "down" } {
  if (monthlySales.length < 2) {
    return { change: "+0%", trend: "up" as const };
  }
  
  const lastMonth = monthlySales[monthlySales.length - 1]?.매출 || 0;
  const prevMonth = monthlySales[monthlySales.length - 2]?.매출 || 1;
  
  if (prevMonth === 0) {
    return { change: "+0%", trend: "up" as const };
  }
  
  const changePercent = ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1);
  const trend = parseFloat(changePercent) >= 0 ? "up" as const : "down" as const;
  const sign = parseFloat(changePercent) >= 0 ? "+" : "";
  
  return {
    change: `${sign}${changePercent}%`,
    trend,
  };
}

/**
 * 기본 데이터 (엑셀 읽기 실패 시 사용)
 */
function getDefaultData() {
  return {
    kpis: {
      salesTarget: {
        value: "₩0",
        change: "0.0% 달성 예상",
        trend: "up" as const,
      },
      forecast: {
        value: "₩0",
        change: "0.0% 달성률",
        trend: "up" as const,
      },
      lastYear: {
        value: "₩0",
        change: "0.0% 신장",
        trend: "up" as const,
      },
      growthRate: {
        value: "0.0%",
        change: "전년 대비",
        trend: "up" as const,
      },
    },
    weeklySales: [],
    monthlySales: [
      { month: "1월", 매출: 85000000, 목표: 80000000, 작년실적: 75000000, 신장율: 13 },
      { month: "2월", 매출: 92000000, 목표: 85000000, 작년실적: 80000000, 신장율: 15 },
      { month: "3월", 매출: 78000000, 목표: 90000000, 작년실적: 85000000, 신장율: -8 },
      { month: "4월", 매출: 105000000, 목표: 95000000, 작년실적: 90000000, 신장율: 17 },
      { month: "5월", 매출: 98000000, 목표: 100000000, 작년실적: 95000000, 신장율: 3 },
      { month: "6월", 매출: 120000000, 목표: 110000000, 작년실적: 100000000, 신장율: 20 },
    ],
    regionalTargets: [
      { 지역: "서울", 달성률: 95, 목표: 100 },
      { 지역: "부산", 달성률: 87, 목표: 100 },
      { 지역: "대구", 달성률: 82, 목표: 100 },
      { 지역: "인천", 달성률: 91, 목표: 100 },
      { 지역: "광주", 달성률: 78, 목표: 100 },
      { 지역: "대전", 달성률: 88, 목표: 100 },
    ],
    recentSales: [
      {
        id: 1,
        customer: "김철수",
        product: "프리미엄 패키지",
        amount: "₩15,000,000",
        status: "완료" as const,
        date: "2025-01-15",
      },
      {
        id: 2,
        customer: "이영희",
        product: "스탠다드 플랜",
        amount: "₩8,500,000",
        status: "완료" as const,
        date: "2025-01-14",
      },
      {
        id: 3,
        customer: "박민수",
        product: "엔터프라이즈 솔루션",
        amount: "₩32,000,000",
        status: "처리중" as const,
        date: "2025-01-13",
      },
      {
        id: 4,
        customer: "정수진",
        product: "베이직 서비스",
        amount: "₩5,200,000",
        status: "완료" as const,
        date: "2025-01-12",
      },
      {
        id: 5,
        customer: "최동욱",
        product: "커스텀 패키지",
        amount: "₩18,700,000",
        status: "대기" as const,
        date: "2025-01-11",
      },
    ],
  };
}

