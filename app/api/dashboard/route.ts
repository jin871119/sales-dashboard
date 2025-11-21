import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = 'force-dynamic';

// 엑셀 파일에서 데이터를 읽어옵니다
export async function GET() {
  try {
    const rootDir = process.cwd();
    
    // 1. JSON 파일 먼저 확인 (Vercel 배포용 - backdata.xlsx만)
    const backdataJsonPath = join(rootDir, 'public', 'backdata.json');
    let hasJsonFile = existsSync(backdataJsonPath);
    const endingFocastPath = join(rootDir, "ending focast.xlsx");
    const backdataPath = join(rootDir, "backdata.xlsx");
    
    // ending focast.xlsx는 항상 엑셀 파일로 읽기 (JSON 변환 없음)
    let monthlyData: any[] | undefined = undefined;
    let weeklyData: any[] | undefined = undefined;
    let storeByArea: any = {};
    
    // backdata.xlsx는 JSON 파일이 있으면 JSON에서 읽기, 없으면 엑셀 파일 읽기
    if (hasJsonFile) {
      console.log('📊 JSON 파일 발견, backdata.xlsx는 JSON에서 읽기:', backdataJsonPath);
      try {
        const jsonData = JSON.parse(readFileSync(backdataJsonPath, 'utf8'));
        
        // JSON 데이터에서 필요한 정보 추출
        monthlyData = parseMonthlyFromJson(jsonData);
        weeklyData = parseWeeklyFromJson(jsonData);
        storeByArea = parseStoreByAreaFromJson(jsonData);
        
        console.log('✅ JSON에서 backdata.xlsx 데이터 로드 완료');
      } catch (jsonError: any) {
        console.log('⚠️  JSON 파일 파싱 실패, 엑셀 파일 사용:', jsonError.message);
        // JSON 파싱 실패 시 엑셀 파일로 폴백
        hasJsonFile = false;
      }
    }
    
    // 2. ending focast.xlsx 항상 읽기 (엑셀 파일)
    if (!existsSync(endingFocastPath)) {
      console.log('⚠️  ending focast.xlsx 파일을 찾을 수 없습니다.');
      const defaultData = getDefaultData();
      return NextResponse.json({
        ...defaultData,
        summary: {
          totalRows: 3541,
          lastUpdated: new Date().toLocaleString('ko-KR'),
          dataRange: "샘플 데이터 (ending focast.xlsx 없음)"
        },
        _notice: "ending focast.xlsx 파일을 찾을 수 없습니다."
      });
    }
    
    // 3. backdata.xlsx는 JSON 파일이 없으면 엑셀 파일에서 읽기
    if (!hasJsonFile && !existsSync(backdataPath)) {
      console.log('⚠️  backdata.xlsx 파일 및 JSON 파일을 찾을 수 없습니다.');
      // backdata 없어도 ending focast.xlsx만으로 진행
    }
    
    // 4. ending focast.xlsx 및 backdata.xlsx 읽기 시도
    try {
      const { readExcelFile } = await import("@/lib/excelReader");
      const { readSummarySheet } = await import("@/lib/summaryReader");
      const { readMonthlyTargetSheet, readWeeklySalesSheet } = await import("@/lib/backDataReader");
      const { readNovemberPerformance, readStoreArea, groupPerformanceByArea } = await import("@/lib/storePerformanceReader");
      
      // 메인 데이터 읽기 (ending focast.xlsx)
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
      
      // backdata.xlsx의 "월별목표" 시트 읽기 (JSON 파일이 없으면)
      if (!hasJsonFile) {
        try {
          monthlyData = readMonthlyTargetSheet("backdata.xlsx");
          console.log('✅ backdata.xlsx "월별목표" 시트 로드 성공:', monthlyData?.length + '개월');
        } catch (monthlyError) {
          console.log('⚠️  "월별목표" 시트 로드 실패:', monthlyError);
        }
        
        // backdata.xlsx의 "주차별매출" 시트 읽기
        try {
          weeklyData = readWeeklySalesSheet("backdata.xlsx");
          console.log('✅ backdata.xlsx "주차별매출" 시트 로드 성공:', weeklyData?.length + '주차');
        } catch (weeklyError) {
          console.log('⚠️  "주차별매출" 시트 로드 실패:', weeklyError);
        }
        
        // backdata.xlsx의 "11월실적" 및 "상권구분" 시트 읽기
        try {
          const performances = readNovemberPerformance("backdata.xlsx");
          const storeAreaMap = readStoreArea("backdata.xlsx");
          storeByArea = groupPerformanceByArea(performances, storeAreaMap);
          console.log('✅ 상권별 매장 데이터 로드 성공:', Object.keys(storeByArea).length + '개 상권');
        } catch (storeError) {
          console.log('⚠️  상권별 매장 데이터 로드 실패:', storeError);
        }
      }
      
      const data = convertExcelToDashboard(rawData, sheetName, summaryData, monthlyData, weeklyData, storeByArea);
      return NextResponse.json(data);
      
    } catch (xlsxError: any) {
      // 엑셀 파일 읽기 실패 (예상치 못한 오류)
      console.log('⚠️  엑셀 파일 로드 실패:', xlsxError.message);
      console.log('💡 기본 데이터를 표시합니다.');
      
      // 기본 데이터 반환
      const defaultData = getDefaultData();
      return NextResponse.json({
        ...defaultData,
        summary: {
          totalRows: 0,
          lastUpdated: new Date().toLocaleString('ko-KR'),
          dataRange: "오류 발생 - 샘플 데이터"
        },
        _notice: "엑셀 파일을 읽는 중 오류가 발생했습니다. 샘플 데이터를 표시합니다."
      });
    }
    
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    const defaultData = getDefaultData();
    return NextResponse.json({
      ...defaultData,
      summary: {
        totalRows: 0,
        lastUpdated: new Date().toLocaleString('ko-KR'),
        dataRange: "오류 발생"
      }
    });
  }
}

/**
 * JSON 데이터에서 월별 데이터 파싱
 */
function parseMonthlyFromJson(jsonData: any): any[] {
  try {
    // JSON 구조 확인: jsonData.data["월별목표"] 또는 jsonData["월별목표"]
    let sheetData = null;
    let sheetName = null;
    
    // 먼저 jsonData.data 구조 확인
    if (jsonData.data) {
      sheetName = Object.keys(jsonData.data).find((name: string) => 
        name.includes('월별') || name.includes('목표') || name.includes('Monthly')
      );
      if (sheetName) {
        sheetData = jsonData.data[sheetName];
      }
    }
    
    // jsonData.data가 없으면 직접 확인
    if (!sheetData) {
      sheetName = Object.keys(jsonData).find((name: string) => 
        name.includes('월별') || name.includes('목표') || name.includes('Monthly')
      );
      if (sheetName) {
        sheetData = jsonData[sheetName];
      }
    }
    
    if (!sheetData) {
      console.log('⚠️  JSON에서 "월별목표" 시트를 찾을 수 없습니다.');
      return [];
    }
    
    console.log(`📊 JSON에서 "${sheetName}" 시트 발견`);
    
    // raw 데이터가 배열의 배열 형태인지 확인
    let rawData: any[][] = [];
    
    if (Array.isArray(sheetData)) {
      // 이미 배열 형태
      if (sheetData.length > 0 && Array.isArray(sheetData[0])) {
        rawData = sheetData as any[][];
      } else {
        // 객체 배열인 경우, 컬럼명으로 변환
        const columns = Object.keys(sheetData[0] || {});
        rawData = [columns]; // 헤더 행
        sheetData.forEach((row: any) => {
          rawData.push(columns.map(col => row[col]));
        });
      }
    } else if (sheetData.raw && Array.isArray(sheetData.raw)) {
      rawData = sheetData.raw;
    } else {
      console.log('⚠️  JSON 데이터 형식이 예상과 다릅니다.');
      return [];
    }
    
    // lib/backDataReader.ts의 parseMonthlyData 로직 재사용
    const { parseMonthlyData } = require("@/lib/backDataReader");
    
    // parseMonthlyData는 내부 함수이므로 직접 호출할 수 없음
    // 대신 readMonthlyTargetSheet를 통해 간접 호출하거나
    // 파싱 로직을 직접 구현
    
    // 직접 파싱 로직 구현 (lib/backDataReader.ts의 parseMonthlyData와 동일)
    return parseMonthlyDataFromRaw(rawData);
    
  } catch (error: any) {
    console.error('월별 데이터 파싱 실패:', error);
    console.error('에러 스택:', error.stack);
    return [];
  }
}

// lib/backDataReader.ts의 parseMonthlyData 로직 재사용
function parseMonthlyDataFromRaw(rawData: any[][]): any[] {
  try {
    if (rawData.length === 0) {
      return [];
    }
    
    const monthRow = rawData[0] as any[];
    const targetRow = rawData[1] as any[];
    const salesRow = rawData[2] as any[];
    const lastYearRow = (rawData[4] || rawData[3]) as any[];
    
    if (!monthRow || !targetRow || !salesRow) {
      console.log('⚠️  필수 데이터 행을 찾을 수 없습니다.');
      return [];
    }
    
    const monthlyData: any[] = [];
    
    // 숫자 파싱 헬퍼
    const parseNumericCell = (cell: any): number => {
      if (cell == null || cell === '') return 0;
      if (typeof cell === 'number') return cell;
      const str = String(cell).replace(/[^0-9.-]/g, '');
      return parseFloat(str) || 0;
    };
    
    for (let col = 1; col < monthRow.length; col++) {
      const monthCell = monthRow[col];
      if (!monthCell || String(monthCell).trim() === '') continue;
      
      const monthStr = String(monthCell).trim();
      const numMatch = monthStr.match(/(\d{1,2})\s*월?/);
      let monthNumber = numMatch ? parseInt(numMatch[1]) : 0;
      
      if (monthNumber < 1 || monthNumber > 12) continue;
      
      const month = `${monthNumber}월`;
      const 목표 = parseNumericCell(targetRow[col]);
      const 매출 = parseNumericCell(salesRow[col]);
      const 작년실적 = lastYearRow ? parseNumericCell(lastYearRow[col]) : 0;
      const 신장율 = 작년실적 > 0 ? Math.round(((매출 - 작년실적) / 작년실적) * 100) : 0;
      
      monthlyData.push({
        month,
        매출: Math.round(매출),
        목표: Math.round(목표),
        작년실적: Math.round(작년실적),
        신장율
      });
    }
    
    // 월 순서대로 정렬
    monthlyData.sort((a, b) => {
      const aNum = parseInt(a.month.replace('월', ''));
      const bNum = parseInt(b.month.replace('월', ''));
      return aNum - bNum;
    });
    
    // 누락된 월 채우기
    const completeData: any[] = [];
    for (let i = 1; i <= 12; i++) {
      const monthName = `${i}월`;
      const existingData = monthlyData.find(item => item.month === monthName);
      completeData.push(existingData || {
        month: monthName,
        매출: 0,
        목표: 0,
        작년실적: 0,
        신장율: 0
      });
    }
    
    console.log(`✅ JSON에서 ${completeData.length}개월 데이터 파싱 완료`);
    return completeData;
    
  } catch (error: any) {
    console.error('월별 데이터 파싱 오류:', error);
    return [];
  }
}

/**
 * JSON 데이터에서 주차별 데이터 파싱
 */
function parseWeeklyFromJson(jsonData: any): any[] {
  try {
    const sheetName = Object.keys(jsonData.data || {}).find((name: string) => 
      name.includes('주차') || name.includes('Weekly') || name.includes('Week')
    );
    
    if (!sheetName || !jsonData.data[sheetName]) {
      return [];
    }
    
    // 임시로 빈 배열 반환
    return [];
  } catch (error) {
    console.error('주차별 데이터 파싱 실패:', error);
    return [];
  }
}

/**
 * JSON 데이터에서 상권별 매장 데이터 파싱
 */
function parseStoreByAreaFromJson(jsonData: any): any {
  try {
    const areaSheetName = Object.keys(jsonData.data || {}).find((name: string) => 
      name.includes('상권') || name.includes('Area')
    );
    
    const performanceSheetName = Object.keys(jsonData.data || {}).find((name: string) => 
      name.includes('11월') || name.includes('November') || name.includes('실적')
    );
    
    if (!areaSheetName || !performanceSheetName) {
      return {};
    }
    
    // 임시로 빈 객체 반환
    return {};
  } catch (error) {
    console.error('상권별 매장 데이터 파싱 실패:', error);
    return {};
  }
}

/**
 * JSON 데이터에서 요약 데이터 파싱
 */
function parseSummaryFromJson(jsonData: any): any {
  // 임시로 null 반환, 나중에 실제 파싱 로직 추가
  return null;
}

/**
 * ending focast.xlsx 데이터를 대시보드 형식으로 변환
 * 
 * 📋 3541행의 대용량 데이터를 효율적으로 처리합니다
 * 
 * ⚠️ 실제 엑셀 구조에 맞게 컬럼명을 수정하세요!
 *    npm run analyze 명령으로 실제 컬럼명을 확인할 수 있습니다.
 */
function convertExcelToDashboard(rawData: any[], sheetName: string, summaryData?: any, monthlyData?: any[], weeklyData?: any[], storeByArea?: any) {
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
    storeByArea: storeByArea || {},
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
 * 기본 데이터 (엑셀 읽기 실패 시 사용 - Vercel 환경)
 */
function getDefaultData() {
  return {
    kpis: {
      salesTarget: {
        value: "₩50,000,000,000",
        change: "95.0% 달성 예상",
        trend: "up" as const,
      },
      forecast: {
        value: "₩47,500,000,000",
        change: "95.0% 달성률",
        trend: "up" as const,
      },
      lastYear: {
        value: "₩45,000,000,000",
        change: "5.6% 신장",
        trend: "up" as const,
      },
      growthRate: {
        value: "5.6%",
        change: "전년 대비",
        trend: "up" as const,
      },
    },
    weeklySales: [
      { week: "1주차", 금년: 4200000000, 전년: 4000000000, 신장율: 5.0 },
      { week: "2주차", 금년: 4500000000, 전년: 4100000000, 신장율: 9.8 },
      { week: "3주차", 금년: 4300000000, 전년: 4200000000, 신장율: 2.4 },
      { week: "4주차", 금년: 4600000000, 전년: 4300000000, 신장율: 7.0 },
    ],
    monthlySales: [
      { month: "1월", 매출: 4200000000, 목표: 4000000000, 작년실적: 3800000000, 신장율: 10.5 },
      { month: "2월", 매출: 3800000000, 목표: 4000000000, 작년실적: 3600000000, 신장율: 5.6 },
      { month: "3월", 매출: 4500000000, 목표: 4200000000, 작년실적: 4300000000, 신장율: 4.7 },
      { month: "4월", 매출: 4100000000, 목표: 4000000000, 작년실적: 3900000000, 신장율: 5.1 },
      { month: "5월", 매출: 4300000000, 목표: 4200000000, 작년실적: 4100000000, 신장율: 4.9 },
      { month: "6월", 매출: 4600000000, 목표: 4500000000, 작년실적: 4400000000, 신장율: 4.5 },
      { month: "7월", 매출: 4400000000, 목표: 4300000000, 작년실적: 4200000000, 신장율: 4.8 },
      { month: "8월", 매출: 4700000000, 목표: 4500000000, 작년실적: 4500000000, 신장율: 4.4 },
      { month: "9월", 매출: 4200000000, 목표: 4200000000, 작년실적: 4000000000, 신장율: 5.0 },
      { month: "10월", 매출: 4500000000, 목표: 4400000000, 작년실적: 4300000000, 신장율: 4.7 },
      { month: "11월", 매출: 4750000000, 목표: 5000000000, 작년실적: 4500000000, 신장율: 5.6 },
    ],
    regionalTargets: [
      { 지역: "서울", 달성률: 95, 목표: 100 },
      { 지역: "경기", 달성률: 92, 목표: 100 },
      { 지역: "부산/경남", 달성률: 88, 목표: 100 },
      { 지역: "대구/경북", 달성률: 85, 목표: 100 },
      { 지역: "광주/전라", 달성률: 82, 목표: 100 },
      { 지역: "대전/충청", 달성률: 90, 목표: 100 },
    ],
    summarySheet: {
      byArea: [
        { area: "강남상권", sales: 8500000000, target: 9000000000, achievement: 94.4 },
        { area: "강북상권", sales: 6200000000, target: 6500000000, achievement: 95.4 },
        { area: "경기남부", sales: 5800000000, target: 6000000000, achievement: 96.7 },
      ],
      byTeam: [],
      byChannel: [],
      byPure: [],
      byGroup: [],
      salesTarget: [{ value: 50000000000 }],
      forecast: [{ value: 47500000000 }],
      lastYear: [{ value: 45000000000 }],
    },
    storeByArea: {
      "강남상권": [
        { storeName: "신세계강남", nov2025: 3500000000, nov2024: 3300000000, growthRate: 6.1, area: "강남상권" },
        { storeName: "현대판교", nov2025: 2800000000, nov2024: 2600000000, growthRate: 7.7, area: "강남상권" },
      ],
      "강북상권": [
        { storeName: "롯데본점", nov2025: 2500000000, nov2024: 2400000000, growthRate: 4.2, area: "강북상권" },
        { storeName: "신세계본점", nov2025: 2200000000, nov2024: 2100000000, growthRate: 4.8, area: "강북상권" },
      ],
    },
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

