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
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`📊 "${summarySheetName}" 시트 로드: ${rawData.length}행`);

    if (rawData.length === 0) {
      return { rawData: [] };
    }

    // 컬럼명 분석
    const columns = Object.keys(rawData[0] || {});
    console.log(`📋 컬럼: ${columns.join(', ')}`);

    // 각 카테고리별 데이터 추출
    const result: SummaryData = {
      rawData: rawData.slice(0, 100), // 최대 100행
      sheetName: summarySheetName
    };

    // 상권별 데이터 추출
    result.byArea = extractCategoryData(rawData, columns, ['상권', '商圈', 'Area', 'District']);

    // Team별 데이터 추출
    result.byTeam = extractCategoryData(rawData, columns, ['team', 'Team', 'TEAM', '팀']);

    // 유통별 데이터 추출
    result.byChannel = extractCategoryData(rawData, columns, ['유통', '流通', 'Distribution', 'Channel']);

    // 순수별 데이터 추출
    result.byPure = extractCategoryData(rawData, columns, ['순수', '純粋', 'Pure', 'Net']);

    // 단체별 데이터 추출
    result.byGroup = extractCategoryData(rawData, columns, ['단체', '團體', 'Group', 'Organization']);

    // H열 7행, I열 7행 값 추출 (인덱스는 5, 6행부터 시작)
    const row7 = rawData[5] || {}; // 7번째 행 = 인덱스 5 (상권 SUM)
    result.salesTarget = [{
      name: '매출목표 (H7)',
      value: Math.round(parseFloat(String(row7['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0)
    }];
    
    result.forecast = [{
      name: '예상마감 (I7)',
      value: Math.round(parseFloat(String(row7['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0)
    }];

    result.lastYear = [{
      name: '작년실적 (K7)',
      value: Math.round(parseFloat(String(row7['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0)
    }];

    // Q열, R열, S열: 기간실적 관련
    result.periodPerformance = [{
      name: '올해 기간실적 (Q7)',
      value: Math.round(parseFloat(String(row7['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0)
    }];

    result.lastYearPeriod = [{
      name: '전년 기간실적 (R7)',
      value: Math.round(parseFloat(String(row7['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0)
    }];

    result.periodGrowthRate = [{
      name: '기간실적 전년비 (S7)',
      value: Math.round((parseFloat(String(row7['__EMPTY_18'] || '0')) || 0) * 100) // 소수를 퍼센트로
    }];

    result.forecastGrowthRate = [{
      name: '예상 전년비 (L7)',
      value: Math.round((parseFloat(String(row7['__EMPTY_11'] || '0')) || 0) * 100) // 소수를 퍼센트로
    }];

    // 상권별 데이터 추출 (상권 표에서)
    console.log('\n📊 상권별/팀별/유통별 데이터 추출 시작...');
    result.byArea = extractAreaData(rawData);
    
    // TEAM별 데이터 추출 (TEAM 표에서)
    result.byTeam = extractTeamData(rawData);
    
    // 유통별 데이터 추출 (유통별 표에서)
    result.byChannel = extractChannelData(rawData);
    
    // 최종 결과 요약
    console.log('\n📊 요약 시트 데이터 추출 완료:');
    console.log(`   - 상권별: ${result.byArea?.length || 0}건`);
    console.log(`   - 팀별: ${result.byTeam?.length || 0}건`);
    console.log(`   - 유통별: ${result.byChannel?.length || 0}건`);
    console.log(`   - 순수별: ${result.byPure?.length || 0}건`);
    console.log(`   - 단체별: ${result.byGroup?.length || 0}건`);

    return result;

  } catch (error) {
    console.error('요약 시트 읽기 오류:', error);
    throw error;
  }
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
 * TARGET, Sales FCST, LY ACTUAL 포함
 */
function extractAreaData(data: any[]): any[] {
  console.log('✅ 상권별 데이터 추출 (TARGET, 기간실적, FCST, LY)');
  
  const result: any[] = [];
  
  // 상권 표 찾기 (row 6부터 시작 - 상권 SUM 행)
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (row['__EMPTY_4'] === '상권') {
      // SUM 행 먼저 추가 (SUM을 TTL로 변경)
      const sumName = String(row['__EMPTY_6'] || '').trim().replace('SUM', 'TTL');
      if (sumName) {
        result.push({
          name: sumName,
          target: Math.round(parseFloat(String(row['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          periodPerformance: Math.round(parseFloat(String(row['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          lastYearPeriod: Math.round(parseFloat(String(row['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          periodGrowthRate: Math.round((parseFloat(String(row['__EMPTY_18'] || '0')) || 0) * 100),
          forecast: Math.round(parseFloat(String(row['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          forecastGrowthRate: Math.round((parseFloat(String(row['__EMPTY_11'] || '0')) || 0) * 100),
          lastYear: Math.round(parseFloat(String(row['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0)
        });
      }
      
      // 상권 표의 데이터 추출 (다음 행들)
      for (let j = i + 1; j < i + 15; j++) {
        if (j >= data.length) break;
        const dataRow = data[j];
        
        // 다음 표가 시작되면 중단
        if (dataRow['__EMPTY_4'] === 'TEAM' || dataRow['__EMPTY_4']?.includes('유통')) break;
        
        const name = String(dataRow['__EMPTY_6'] || '').trim();
        const target = parseFloat(String(dataRow['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const periodPerformance = parseFloat(String(dataRow['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const lastYearPeriod = parseFloat(String(dataRow['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const periodGrowthRate = (parseFloat(String(dataRow['__EMPTY_18'] || '0')) || 0) * 100;
        const forecast = parseFloat(String(dataRow['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const forecastGrowthRate = (parseFloat(String(dataRow['__EMPTY_11'] || '0')) || 0) * 100;
        const lastYear = parseFloat(String(dataRow['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        
        if (name && (target > 0 || forecast > 0) && !name.includes('제외')) {
          result.push({
            name,
            target: Math.round(target),
            periodPerformance: Math.round(periodPerformance),
            lastYearPeriod: Math.round(lastYearPeriod),
            periodGrowthRate: Math.round(periodGrowthRate),
            forecast: Math.round(forecast),
            forecastGrowthRate: Math.round(forecastGrowthRate),
            lastYear: Math.round(lastYear)
          });
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
  
  const result: any[] = [];
  
  // TEAM 표 찾기
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row['__EMPTY_4'] === 'TEAM') {
      // SUM 행 먼저 추가 (SUM을 TTL로 변경)
      const sumName = String(row['__EMPTY_6'] || '').trim().replace('SUM', 'TTL');
      if (sumName) {
        result.push({
          name: sumName,
          target: Math.round(parseFloat(String(row['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          periodPerformance: Math.round(parseFloat(String(row['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          lastYearPeriod: Math.round(parseFloat(String(row['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          periodGrowthRate: Math.round((parseFloat(String(row['__EMPTY_18'] || '0')) || 0) * 100),
          forecast: Math.round(parseFloat(String(row['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0),
          forecastGrowthRate: Math.round((parseFloat(String(row['__EMPTY_11'] || '0')) || 0) * 100),
          lastYear: Math.round(parseFloat(String(row['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0)
        });
      }
      
      // TEAM 표의 데이터 추출
      for (let j = i + 1; j < i + 15; j++) {
        if (j >= data.length) break;
        const dataRow = data[j];
        
        // 다음 표가 시작되면 중단
        if (dataRow['__EMPTY_4']?.includes('유통')) break;
        
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
            lastYear: Math.round(lastYear)
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
 * 유통별 데이터 추출 (요약 시트 21~27행)
 * TARGET, Sales FCST, LY ACTUAL 포함
 */
function extractChannelData(data: any[]): any[] {
  console.log('✅ 유통별 데이터 추출 (21행부터 시작, TTL 없음)');
  
  const result: any[] = [];
  
  console.log(`📊 총 데이터 행 수: ${data.length}`);
  
  // 유통별은 TTL이 없고 21행(인덱스 20)부터 바로 시작!
  // 21행: 백화점
  // 22행: 대리점
  // 23행: 직영점
  // 24행: 면세+도매
  // 25행: 온라인
  // 26행: 상설(위탁)
  
  // 21~30행 처리 (인덱스 20~29)
  for (let i = 20; i <= 29 && i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const name = String(row['__EMPTY_6'] || '').trim();
    if (!name) continue;
    
    // 다음 섹션(순수별 등)이 시작되면 중단
    if (row['__EMPTY_4']?.includes('순수') || row['__EMPTY_4']?.includes('단체')) {
      console.log(`   ⚠️  다음 섹션 감지: ${row['__EMPTY_4']}, 유통별 추출 중단`);
      break;
    }
    
    const target = parseFloat(String(row['__EMPTY_7'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const periodPerformance = parseFloat(String(row['__EMPTY_16'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const lastYearPeriod = parseFloat(String(row['__EMPTY_17'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const periodGrowthRate = (parseFloat(String(row['__EMPTY_18'] || '0')) || 0) * 100;
    const forecast = parseFloat(String(row['__EMPTY_8'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const forecastGrowthRate = (parseFloat(String(row['__EMPTY_11'] || '0')) || 0) * 100;
    const lastYear = parseFloat(String(row['__EMPTY_10'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    
    if (target > 0 || forecast > 0) {
      result.push({
        name: name,
        target: Math.round(target),
        periodPerformance: Math.round(periodPerformance),
        lastYearPeriod: Math.round(lastYearPeriod),
        periodGrowthRate: Math.round(periodGrowthRate),
        forecast: Math.round(forecast),
        forecastGrowthRate: Math.round(forecastGrowthRate),
        lastYear: Math.round(lastYear)
      });
      
      console.log(`   ${i + 1}행: ${name} - 목표: ${Math.round(target).toLocaleString()}, 기간실적: ${Math.round(periodPerformance).toLocaleString()}`);
    }
  }
  
  console.log(`✅ ${result.length}개 유통별 항목 추출 완료 (TTL + 개별 항목)`);
  return result;
}

