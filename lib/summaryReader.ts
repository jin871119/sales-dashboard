import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface SummaryData {
  byArea?: any[];      // 상권별 (TARGET, 기간실적, FCST, LY 포함)
  byTeam?: any[];      // team별 (TARGET, 기간실적, FCST, LY 포함)
  byChannel?: any[];   // 유통별 (TARGET, 기간실적, FCST, LY 포함)
  byPure?: any[];      // 순수별
  byGroup?: any[];     // 단체별
  salesTarget?: any[]; // H열: 매출목표
  forecast?: any[];    // I열: 예상마감
  lastYear?: any[];    // K열: 작년실적
  periodPerformance?: any[]; // Q열: 올해 기간실적
  lastYearPeriod?: any[];    // R열: 전년 기간실적
  periodGrowthRate?: any[];  // S열: 기간실적 전년비
  forecastGrowthRate?: any[]; // L열: 예상 전년비
  forecastAchievementRate?: any[]; // J열: 예상달성율
  rawData?: any[];     // 원본 데이터
  sheetName?: string;
}

/**
 * "요약" 시트 데이터 읽기 및 변환
 */
export function readSummarySheet(filename: string): SummaryData {
  try {
    const filePath = join(process.cwd(), filename);
    const file = readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // "요약" 시트 찾기
    const summarySheetNames = ['요약', 'Summary', 'summary', '總結'];
    let summarySheetName = workbook.SheetNames.find(name => 
      summarySheetNames.includes(name) || 
      name.includes('요약') || 
      name.includes('Summary')
    );

    if (!summarySheetName) {
      console.log('⚠️  "요약" 시트를 찾을 수 없습니다. 첫 번째 시트를 사용합니다.');
      summarySheetName = workbook.SheetNames[0];
    }

    const worksheet = workbook.Sheets[summarySheetName];
    const sheetJson = XLSX.utils.sheet_to_json(worksheet) as any[];

    return parseSummarySheet(summarySheetName, sheetJson);

  } catch (error) {
    console.error('요약 시트 읽기 오류:', error);
    throw error;
  }
}

/**
 * JSON raw 데이터를 사용하여 요약 데이터 파싱
 */
export function readSummaryFromRaw(rawData: any[][], sheetName = '요약'): SummaryData {
  if (!rawData || rawData.length === 0) {
    console.log('⚠️  요약 raw 데이터가 비어있습니다.');
    return { rawData: [] };
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rawData);
  const sheetJson = XLSX.utils.sheet_to_json(worksheet) as any[];

  return parseSummarySheet(sheetName, sheetJson);
}

/**
 * 공통 요약 데이터 파싱 로직
 */
function parseSummarySheet(summarySheetName: string, sheetJson: any[]): SummaryData {
  console.log(`📊 "${summarySheetName}" 시트 로드: ${sheetJson.length}행`);

  if (sheetJson.length === 0) {
    return { rawData: [] };
  }

  // 컬럼명 분석
  const columns = Object.keys(sheetJson[0] || {});
  console.log(`📋 컬럼: ${columns.join(', ')}`);
  
  // 디버깅: 처음 10행의 데이터 구조 확인
  console.log('\n🔍 처음 10행 데이터 구조 확인:');
  for (let i = 0; i < Math.min(10, sheetJson.length); i++) {
    const row = sheetJson[i];
    const rowData: any = {};
    columns.forEach(col => {
      const val = row[col];
      if (val !== undefined && val !== null && val !== '') {
        rowData[col] = String(val).substring(0, 20); // 처음 20자만
      }
    });
    console.log(`  행 ${i + 1}:`, JSON.stringify(rowData));
  }

  // 각 카테고리별 데이터 추출
  const result: SummaryData = {
    rawData: sheetJson.slice(0, 100), // 최대 100행
    sheetName: summarySheetName
  };

  // 상권별 데이터 추출
  result.byArea = extractCategoryData(sheetJson, columns, ['상권', '商圈', 'Area', 'District']);

  // Team별 데이터 추출
  result.byTeam = extractCategoryData(sheetJson, columns, ['team', 'Team', 'TEAM', '팀']);

  // 유통별 데이터 추출
  result.byChannel = extractCategoryData(sheetJson, columns, ['유통', '流通', 'Distribution', 'Channel']);

  // 순수별 데이터 추출
  result.byPure = extractCategoryData(sheetJson, columns, ['순수', '純粋', 'Pure', 'Net']);

  // 단체별 데이터 추출
  result.byGroup = extractCategoryData(sheetJson, columns, ['단체', '團體', 'Group', 'Organization']);

  // H열 7행, I열 7행 값 추출
  // 상권 SUM 행 찾기 (__EMPTY_4 === '상권' && __EMPTY_6 === 'SUM')
  let row7: any = null;
  for (let i = 0; i < sheetJson.length; i++) {
    const row = sheetJson[i];
    if (row['__EMPTY_4'] === '상권' && String(row['__EMPTY_6'] || '').trim() === 'SUM') {
      row7 = row;
      console.log(`✅ 7행 데이터 발견: 인덱스 ${i}`);
      break;
    }
  }
  
  // 찾지 못하면 인덱스 6 (7번째 행) 사용
  if (!row7) {
    row7 = sheetJson[6] || {};
    console.log('⚠️  상권 SUM 행을 찾지 못해 인덱스 6 사용');
  }
  
  console.log('📊 7행 데이터:', {
    __EMPTY_7: row7['__EMPTY_7'],
    __EMPTY_8: row7['__EMPTY_8'],
    __EMPTY_9: row7['__EMPTY_9'],
    __EMPTY_10: row7['__EMPTY_10'],
    __EMPTY_16: row7['__EMPTY_16'],
    __EMPTY_17: row7['__EMPTY_17'],
    __EMPTY_18: row7['__EMPTY_18'],
  });
  
  // 숫자 파싱 헬퍼
  const parseValue = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };
  
  result.salesTarget = [{
    name: '매출목표 (H7)',
    value: Math.round(parseValue(row7['__EMPTY_7']))
  }];
  
  result.forecast = [{
    name: '예상마감 (I7)',
    value: Math.round(parseValue(row7['__EMPTY_8']))
  }];

  result.lastYear = [{
    name: '작년실적 (K7)',
    value: Math.round(parseValue(row7['__EMPTY_10']))
  }];

  // Q열, R열, S열: 기간실적 관련
  result.periodPerformance = [{
    name: '올해 기간실적 (Q7)',
    value: Math.round(parseValue(row7['__EMPTY_16']))
  }];

  result.lastYearPeriod = [{
    name: '전년 기간실적 (R7)',
    value: Math.round(parseValue(row7['__EMPTY_17']))
  }];

  result.periodGrowthRate = [{
    name: '기간실적 전년비 (S7)',
    value: Math.round((parseValue(row7['__EMPTY_18'])) * 100) // 소수를 퍼센트로
  }];

  result.forecastGrowthRate = [{
    name: '예상 전년비 (L7)',
    value: Math.round((parseValue(row7['__EMPTY_11'])) * 100) // 소수를 퍼센트로
  }];

  // J열 7행: 예상달성율 (이미 소수로 저장되어 있으면 그대로 사용, 아니면 계산)
  const j7Value = parseValue(row7['__EMPTY_9']);
  const forecastAchievementRate = j7Value > 1 ? j7Value : j7Value * 100; // 1보다 크면 이미 퍼센트, 아니면 소수
  result.forecastAchievementRate = [{
    name: '예상달성율 (J7)',
    value: Math.round(forecastAchievementRate)
  }];
  
  console.log('✅ 추출된 값:', {
    salesTarget: result.salesTarget[0].value,
    forecast: result.forecast[0].value,
    forecastAchievementRate: result.forecastAchievementRate[0].value,
    periodPerformance: result.periodPerformance[0].value,
    lastYearPeriod: result.lastYearPeriod[0].value,
    periodGrowthRate: result.periodGrowthRate[0].value,
  });

  // 상권별 데이터 추출 (상권 표에서)
  console.log('\n📊 상권별/팀별/유통별 데이터 추출 시작...');
  result.byArea = extractAreaData(sheetJson);
  
  // TEAM별 데이터 추출 (TEAM 표에서)
  result.byTeam = extractTeamData(sheetJson);
  
  // 유통별 데이터 추출 (유통별 표에서)
  result.byChannel = extractChannelData(sheetJson);
  
  // 최종 결과 요약
  console.log('\n📊 요약 시트 데이터 추출 완료:');
  console.log(`   - 상권별: ${result.byArea?.length || 0}건`);
  console.log(`   - 팀별: ${result.byTeam?.length || 0}건`);
  console.log(`   - 유통별: ${result.byChannel?.length || 0}건`);
  console.log(`   - 순수별: ${result.byPure?.length || 0}건`);
  console.log(`   - 단체별: ${result.byGroup?.length || 0}건`);

  return result;
}

/**
 * 카테고리 데이터 추출 및 집계
 */
function extractCategoryData(
  data: any[],
  columns: string[],
  keywords: string[]
): any[] {
  // 키워드와 매칭되는 컬럼 찾기
  const categoryColumn = columns.find(col =>
    keywords.some(keyword => col.includes(keyword))
  );

  if (!categoryColumn) {
    console.log(`⚠️  카테고리를 찾을 수 없습니다: ${keywords.join(', ')}`);
    return [];
  }

  // 값 컬럼 찾기 (금액, 수량 등)
  const valueColumns = columns.filter(col =>
    col.includes('금액') || col.includes('수량') || col.includes('매출') ||
    col.includes('Amount') || col.includes('Sales') || col.includes('Value') ||
    col.includes('Count') || col.includes('Qty') || col.includes('Revenue')
  );

  const valueColumn = valueColumns[0] || columns[1]; // 기본값: 두 번째 컬럼

  console.log(`✅ 카테고리 컬럼: "${categoryColumn}", 값 컬럼: "${valueColumn}"`);

  // 데이터 집계
  const aggregated = new Map<string, number>();

  data.forEach(row => {
    const category = String(row[categoryColumn] || '').trim();
    const value = parseFloat(String(row[valueColumn] || '0').replace(/[^0-9.-]/g, '')) || 0;

    if (category && category !== '' && !isNaN(value)) {
      const current = aggregated.get(category) || 0;
      aggregated.set(category, current + value);
    }
  });

  // 결과 변환
  const result = Array.from(aggregated.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 20); // 상위 20개만

  console.log(`   → ${result.length}개 항목 추출`);

  return result;
}

/**
 * 카테고리별 데이터 추출 (실제 엑셀 구조)
 */
function extractByCategory(
  data: any[],
  valueColumn: string,
  nameColumn: string
): any[] {
  console.log(`✅ "${valueColumn}" 컬럼에서 데이터 추출`);

  const result = data
    .filter(row => {
      // 빈 행이거나 SUM 행은 제외
      const name = row[nameColumn];
      return name && 
             typeof name === 'string' && 
             name !== 'SUM' && 
             name.trim() !== '' &&
             row[valueColumn] != null;
    })
    .map(row => {
      const name = String(row[nameColumn]).trim();
      const value = parseFloat(String(row[valueColumn] || '0').replace(/[^0-9.-]/g, '')) || 0;

      return {
        name,
        value: Math.round(value)
      };
    })
    .filter(item => item.value > 0 && !item.name.includes('제외'))
    .slice(0, 15); // 상위 15개만

  console.log(`   → ${result.length}개 항목 추출`);

  return result;
}

/**
 * 상권별 데이터 추출 (상권 표)
 * E열: 상권명 (국내, 면세, 도매, RF)
 * H열: TARGET (매출목표)
 * I열: Sales AMT (예상마감)
 * J열: Ach% (예상달성율)
 * Q열: Actual MTD (실적)
 * R열: LY ACTUAL (전년실적)
 * S열: GR (전년비)
 */
function extractAreaData(data: any[]): any[] {
  console.log('✅ 상권별 데이터 추출 (E열 상권, H열 TARGET, I열 Sales AMT, J열 Ach%, Q열 Actual MTD, R열 LY ACTUAL, S열 GR)');
  console.log(`   총 ${data.length}행 검색 중...`);
  
  const result: any[] = [];
  
  // 숫자 파싱 헬퍼
  const parseValue = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };
  
  // 상권 표 찾기 (E열(__EMPTY_4)에 "상권"이 있는 행)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const eColumn = String(row['__EMPTY_4'] || '').trim();
    
    if (eColumn === '상권') {
      console.log(`   ✅ 상권 표 발견! 행 ${i + 1}`);
      
      // SUM 행 먼저 추가 (KPI 데이터로 사용)
      const sumName = String(row['__EMPTY_6'] || '').trim();
      if (sumName && (sumName === 'SUM' || sumName.includes('SUM'))) {
        const target = Math.round(parseValue(row['__EMPTY_7'])); // H열: TARGET
        const salesAMT = Math.round(parseValue(row['__EMPTY_8'])); // I열: Sales AMT
        const achPercent = parseValue(row['__EMPTY_9']); // J열: Ach%
        const actualMTD = Math.round(parseValue(row['__EMPTY_16'])); // Q열: Actual MTD
        const lyActual = Math.round(parseValue(row['__EMPTY_17'])); // R열: LY ACTUAL
        const gr = parseValue(row['__EMPTY_18']); // S열: GR
        
        // Ach%가 소수면 100 곱하기 (예: 0.95 -> 95%)
        const achPercentValue = achPercent > 1 ? achPercent : achPercent * 100;
        // GR이 소수면 100 곱하기 (예: 0.05 -> 5%)
        const grValue = gr > 1 ? gr : gr * 100;
        
        result.push({
          name: 'SUM', // KPI 데이터로 사용하기 위해 'SUM'으로 유지
          target,
          periodPerformance: actualMTD, // Q열: Actual MTD
          lastYearPeriod: lyActual, // R열: LY ACTUAL
          periodGrowthRate: Math.round(grValue), // S열: GR
          forecast: salesAMT, // I열: Sales AMT
          forecastAchievementRate: Math.round(achPercentValue), // J열: Ach%
          // 11월 데이터
          novemberTarget: target,
          actualMTD: actualMTD,
          lyActual: lyActual,
          salesFCST: salesAMT
        });
        
        console.log(`   ✅ SUM 행 추출 (KPI 데이터): 목표=${target.toLocaleString()}, 실적=${actualMTD.toLocaleString()}, 전년실적=${lyActual.toLocaleString()}, 전년비=${Math.round(grValue)}%, 예상마감=${salesAMT.toLocaleString()}, 예상달성율=${Math.round(achPercentValue)}%`);
      }
      
      // 상권별 개별 데이터 추출 (국내, 면세, 도매, RF)
      // G열(__EMPTY_6)에 소제목이 있음
      for (let j = i + 1; j < i + 15 && j < data.length; j++) {
        const dataRow = data[j];
        
        // 다음 표가 시작되면 중단 (TEAM, 유통 등)
        const nextEColumn = String(dataRow['__EMPTY_4'] || '').trim();
        if (nextEColumn === 'TEAM' || nextEColumn.includes('유통') || nextEColumn.includes('순수') || nextEColumn.includes('단체')) {
          break;
        }
        
        // E열이 비어있으면 다음 행으로
        if (!nextEColumn || nextEColumn === '') continue;
        
        // 상권명은 G열(__EMPTY_6)에서 소제목 가져오기
        const name = String(dataRow['__EMPTY_6'] || '').trim();
        if (!name || name === 'SUM' || name === '상권' || name.includes('제외')) continue;
        
        // 각 컬럼에서 데이터 추출
        const target = Math.round(parseValue(dataRow['__EMPTY_7'])); // H열: TARGET
        const salesAMT = Math.round(parseValue(dataRow['__EMPTY_8'])); // I열: Sales AMT
        const achPercent = parseValue(dataRow['__EMPTY_9']); // J열: Ach%
        const actualMTD = Math.round(parseValue(dataRow['__EMPTY_16'])); // Q열: Actual MTD
        const lyActual = Math.round(parseValue(dataRow['__EMPTY_17'])); // R열: LY ACTUAL
        const gr = parseValue(dataRow['__EMPTY_18']); // S열: GR
        
        // 데이터가 있는 경우만 추가
        if (target > 0 || actualMTD > 0 || salesAMT > 0) {
          // Ach%와 GR이 소수면 100 곱하기
          const achPercentValue = achPercent > 1 ? achPercent : achPercent * 100;
          const grValue = gr > 1 ? gr : gr * 100;
          
          result.push({
            name,
            target,
            periodPerformance: actualMTD, // Q열: Actual MTD
            lastYearPeriod: lyActual, // R열: LY ACTUAL
            periodGrowthRate: Math.round(grValue), // S열: GR
            forecast: salesAMT, // I열: Sales AMT
            forecastAchievementRate: Math.round(achPercentValue), // J열: Ach%
            // 11월 데이터
            novemberTarget: target,
            actualMTD: actualMTD,
            lyActual: lyActual,
            salesFCST: salesAMT
          });
          
          console.log(`   ✅ ${name}: 목표=${target.toLocaleString()}, 실적=${actualMTD.toLocaleString()}, 전년실적=${lyActual.toLocaleString()}, 전년비=${Math.round(grValue)}%, 예상마감=${salesAMT.toLocaleString()}, 예상달성율=${Math.round(achPercentValue)}%`);
        }
      }
      break;
    }
  }
  
  console.log(`   → ${result.length}개 항목 추출 (상권별)`);
  return result;
}

/**
 * TEAM별 데이터 추출 (TEAM 표)
 * TARGET, Sales FCST, LY ACTUAL 포함
 */
function extractTeamData(data: any[]): any[] {
  console.log('✅ TEAM별 데이터 추출 (TARGET, 기간실적, FCST, LY)');
  console.log(`   총 ${data.length}행 검색 중...`);
  
  const result: any[] = [];
  
  // TEAM 표 찾기
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // 디버깅: 처음 몇 행 확인
    if (i < 10) {
      console.log(`   행 ${i + 1} 확인: __EMPTY_4 = "${row['__EMPTY_4']}", __EMPTY_6 = "${row['__EMPTY_6']}"`);
    }
    if (row['__EMPTY_4'] === 'TEAM') {
      console.log(`   ✅ TEAM 표 발견! 행 ${i + 1}`);
      // SUM 행 먼저 추가 (SUM을 TTL로 변경)
      const sumName = String(row['__EMPTY_6'] || '').trim().replace('SUM', 'TTL');
      if (sumName) {
        const target = Math.round(parseFloat(String(row['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0);
        const periodPerformance = Math.round(parseFloat(String(row['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0);
        const lastYearPeriod = Math.round(parseFloat(String(row['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0);
        const forecast = Math.round(parseFloat(String(row['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0);
        result.push({
          name: sumName,
          target,
          periodPerformance,
          lastYearPeriod,
          periodGrowthRate: Math.round((parseFloat(String(row['__EMPTY_18'] || '0')) || 0) * 100),
          forecast,
          forecastGrowthRate: Math.round((parseFloat(String(row['__EMPTY_11'] || '0')) || 0) * 100),
          lastYear: Math.round(parseFloat(String(row['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          // 11월 데이터
          novemberTarget: target,
          actualMTD: periodPerformance,
          lyActual: lastYearPeriod,
          salesFCST: forecast
        });
      }
      
      // TEAM 표의 데이터 추출
      // G열(__EMPTY_6)에 소제목이 있음
      for (let j = i + 1; j < i + 15; j++) {
        if (j >= data.length) break;
        const dataRow = data[j];
        
        // 다음 표가 시작되면 중단
        const nextEColumn = String(dataRow['__EMPTY_4'] || '').trim();
        if (nextEColumn === '유통' || nextEColumn.includes('유통') || nextEColumn.includes('순수') || nextEColumn.includes('단체')) {
          break;
        }
        
        // E열이 비어있으면 다음 행으로
        if (!nextEColumn || nextEColumn === '') continue;
        
        // TEAM명은 G열(__EMPTY_6)에서 소제목 가져오기
        const name = String(dataRow['__EMPTY_6'] || '').trim();
        const target = parseFloat(String(dataRow['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const periodPerformance = parseFloat(String(dataRow['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const lastYearPeriod = parseFloat(String(dataRow['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const periodGrowthRate = (parseFloat(String(dataRow['__EMPTY_18'] || '0')) || 0) * 100;
        const forecast = parseFloat(String(dataRow['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const forecastGrowthRate = (parseFloat(String(dataRow['__EMPTY_11'] || '0')) || 0) * 100;
        const lastYear = parseFloat(String(dataRow['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        
        if (name && (target > 0 || forecast > 0)) {
          result.push({
            name,
            target: Math.round(target),
            periodPerformance: Math.round(periodPerformance),
            lastYearPeriod: Math.round(lastYearPeriod),
            periodGrowthRate: Math.round(periodGrowthRate),
            forecast: Math.round(forecast),
            forecastGrowthRate: Math.round(forecastGrowthRate),
            lastYear: Math.round(lastYear),
            // 11월 데이터
            novemberTarget: Math.round(target),
            actualMTD: Math.round(periodPerformance),
            lyActual: Math.round(lastYearPeriod),
            salesFCST: Math.round(forecast)
          });
        }
      }
      break;
    }
  }
  
  console.log(`   → ${result.length}개 항목 추출 (TEAM별)`);
  return result;
}

/**
 * 유통별 데이터 추출
 * E열: 유통 (구분자)
 * G열: 소제목 (백화점, 대리점, 직영점 등)
 * H열: TARGET (매출목표)
 * I열: Sales AMT (예상마감)
 * J열: Ach% (예상달성율)
 * Q열: Actual MTD (실적)
 * R열: LY ACTUAL (전년실적)
 * S열: GR (전년비)
 */
function extractChannelData(data: any[]): any[] {
  console.log('✅ 유통별 데이터 추출 (E열 유통, G열 소제목, H열 TARGET, I열 Sales AMT, J열 Ach%, Q열 Actual MTD, R열 LY ACTUAL, S열 GR)');
  console.log(`   총 ${data.length}행 검색 중...`);
  
  const result: any[] = [];
  
  // 숫자 파싱 헬퍼
  const parseValue = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };
  
  // 유통 표 찾기 (E열(__EMPTY_4)에 "유통"이 있는 행)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const eColumn = String(row['__EMPTY_4'] || '').trim();
    
    if (eColumn === '유통' || eColumn.includes('유통')) {
      console.log(`   ✅ 유통 표 발견! 행 ${i + 1}`);
      
      // SUM 행 먼저 추가 (있는 경우)
      const sumName = String(row['__EMPTY_6'] || '').trim();
      if (sumName && (sumName === 'SUM' || sumName.includes('SUM'))) {
        const target = Math.round(parseValue(row['__EMPTY_7'])); // H열: TARGET
        const salesAMT = Math.round(parseValue(row['__EMPTY_8'])); // I열: Sales AMT
        const achPercent = parseValue(row['__EMPTY_9']); // J열: Ach%
        const actualMTD = Math.round(parseValue(row['__EMPTY_16'])); // Q열: Actual MTD
        const lyActual = Math.round(parseValue(row['__EMPTY_17'])); // R열: LY ACTUAL
        const gr = parseValue(row['__EMPTY_18']); // S열: GR
        
        // Ach%가 소수면 100 곱하기
        const achPercentValue = achPercent > 1 ? achPercent : achPercent * 100;
        // GR이 소수면 100 곱하기
        const grValue = gr > 1 ? gr : gr * 100;
        
        result.push({
          name: 'SUM',
          target,
          periodPerformance: actualMTD,
          lastYearPeriod: lyActual,
          periodGrowthRate: Math.round(grValue),
          forecast: salesAMT,
          forecastAchievementRate: Math.round(achPercentValue),
          novemberTarget: target,
          actualMTD: actualMTD,
          lyActual: lyActual,
          salesFCST: salesAMT
        });
        
        console.log(`   ✅ SUM 행 추출: 목표=${target.toLocaleString()}, 실적=${actualMTD.toLocaleString()}, 전년실적=${lyActual.toLocaleString()}, 전년비=${Math.round(grValue)}%, 예상마감=${salesAMT.toLocaleString()}, 예상달성율=${Math.round(achPercentValue)}%`);
      }
      
      // 유통별 개별 데이터 추출 (백화점, 대리점, 직영점 등)
      // G열(__EMPTY_6)에 소제목이 있음
      for (let j = i + 1; j < i + 15 && j < data.length; j++) {
        const dataRow = data[j];
        
        // 다음 표가 시작되면 중단 (순수, 단체 등)
        const nextEColumn = String(dataRow['__EMPTY_4'] || '').trim();
        if (nextEColumn.includes('순수') || nextEColumn.includes('단체')) {
          break;
        }
        
        // E열이 비어있으면 다음 행으로
        if (!nextEColumn || nextEColumn === '') continue;
        
        // 유통명은 G열(__EMPTY_6)에서 소제목 가져오기
        const name = String(dataRow['__EMPTY_6'] || '').trim();
        if (!name || name === 'SUM' || name === '유통' || name.includes('제외')) continue;
    
        // 각 컬럼에서 데이터 추출
        const target = Math.round(parseValue(dataRow['__EMPTY_7'])); // H열: TARGET
        const salesAMT = Math.round(parseValue(dataRow['__EMPTY_8'])); // I열: Sales AMT
        const achPercent = parseValue(dataRow['__EMPTY_9']); // J열: Ach%
        const actualMTD = Math.round(parseValue(dataRow['__EMPTY_16'])); // Q열: Actual MTD
        const lyActual = Math.round(parseValue(dataRow['__EMPTY_17'])); // R열: LY ACTUAL
        const gr = parseValue(dataRow['__EMPTY_18']); // S열: GR
        
        // 데이터가 있는 경우만 추가
        if (target > 0 || actualMTD > 0 || salesAMT > 0) {
          // Ach%와 GR이 소수면 100 곱하기
          const achPercentValue = achPercent > 1 ? achPercent : achPercent * 100;
          const grValue = gr > 1 ? gr : gr * 100;
          
          result.push({
            name,
            target,
            periodPerformance: actualMTD, // Q열: Actual MTD
            lastYearPeriod: lyActual, // R열: LY ACTUAL
            periodGrowthRate: Math.round(grValue), // S열: GR
            forecast: salesAMT, // I열: Sales AMT
            forecastAchievementRate: Math.round(achPercentValue), // J열: Ach%
            // 11월 데이터
            novemberTarget: target,
            actualMTD: actualMTD,
            lyActual: lyActual,
            salesFCST: salesAMT
          });
          
          console.log(`   ✅ ${name}: 목표=${target.toLocaleString()}, 실적=${actualMTD.toLocaleString()}, 전년실적=${lyActual.toLocaleString()}, 전년비=${Math.round(grValue)}%, 예상마감=${salesAMT.toLocaleString()}, 예상달성율=${Math.round(achPercentValue)}%`);
        }
      }
      break;
    }
  }
  
  console.log(`   → ${result.length}개 항목 추출 (유통별)`);
  return result;
}

