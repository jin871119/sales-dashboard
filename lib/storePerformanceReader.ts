import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface StorePerformance {
  storeName: string;
  nov2025: number;
  nov2024: number;
  growthRate: number;
  area?: string;
}

/**
 * backdata.xlsx 파일의 "11월실적" 시트 읽기
 */
export function readNovemberPerformance(filename: string): StorePerformance[] {
  try {
    const filePath = join(process.cwd(), filename);
    const file = readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    console.log(`\n📊 ${filename} 파일 분석 중...`);
    console.log(`📋 발견된 시트: ${workbook.SheetNames.join(', ')}`);

    // "11월실적" 시트 찾기
    const novSheetNames = ['11월실적', '11월 실적', 'November', 'november'];
    let sheetName = workbook.SheetNames.find(name =>
      novSheetNames.includes(name) ||
      name.includes('11월')
    );

    if (!sheetName) {
      console.log('⚠️  "11월실적" 시트를 찾을 수 없습니다.');
      return [];
    }

    console.log(`✅ "${sheetName}" 시트 선택됨`);

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`📊 총 ${rawData.length}행 발견`);

    const performances: StorePerformance[] = [];

    rawData.forEach((row, index) => {
      const storeName = String(row['매장명'] || '').trim();
      if (!storeName) return;

      const nov2025 = parseFloat(String(row['25년 11월'] || '0').replace(/[^0-9.-]/g, '')) || 0;
      const nov2024 = parseFloat(String(row['24년 11월'] || '0').replace(/[^0-9.-]/g, '')) || 0;

      // 전년 대비 증감률 계산
      const growthRate = nov2024 > 0 
        ? Math.round(((nov2025 - nov2024) / nov2024) * 100) 
        : 0;

      performances.push({
        storeName,
        nov2025: Math.round(nov2025),
        nov2024: Math.round(nov2024),
        growthRate
      });

      if (index < 5) {
        console.log(`   ✓ ${storeName}: 25년 ${Math.round(nov2025 / 100000000)}억 / 24년 ${Math.round(nov2024 / 100000000)}억 (${growthRate >= 0 ? '+' : ''}${growthRate}%)`);
      }
    });

    console.log(`✅ ${performances.length}개 매장 실적 추출 완료\n`);

    return performances;

  } catch (error) {
    console.error('11월실적 시트 읽기 오류:', error);
    throw error;
  }
}

/**
 * backdata.xlsx 파일의 "상권구분" 시트 읽기
 */
export function readStoreArea(filename: string): Map<string, string> {
  try {
    const filePath = join(process.cwd(), filename);
    const file = readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    // "상권구분" 시트 찾기
    const areaSheetNames = ['상권구분', '매장상권', 'Store Area'];
    let sheetName = workbook.SheetNames.find(name =>
      areaSheetNames.includes(name) ||
      name.includes('상권')
    );

    if (!sheetName) {
      console.log('⚠️  "상권구분" 시트를 찾을 수 없습니다.');
      return new Map();
    }

    console.log(`✅ "${sheetName}" 시트 선택됨`);

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const storeAreaMap = new Map<string, string>();

    rawData.forEach(row => {
      const storeName = String(row['매장명'] || '').trim();
      const area = String(row['상권별'] || '').trim();

      if (storeName && area) {
        storeAreaMap.set(storeName, area);
      }
    });

    console.log(`✅ ${storeAreaMap.size}개 매장 상권 정보 로드\n`);

    return storeAreaMap;

  } catch (error) {
    console.error('상권구분 시트 읽기 오류:', error);
    throw error;
  }
}

/**
 * 상권별로 매장 실적 그룹화
 */
export function groupPerformanceByArea(
  performances: StorePerformance[],
  storeAreaMap: Map<string, string>
): { [area: string]: StorePerformance[] } {
  const grouped: { [area: string]: StorePerformance[] } = {};

  performances.forEach(performance => {
    const area = storeAreaMap.get(performance.storeName) || '기타';
    
    // 상권 정보 추가
    performance.area = area;

    if (!grouped[area]) {
      grouped[area] = [];
    }

    grouped[area].push(performance);
  });

  // 각 상권별로 매출액 기준 정렬 (25년 11월 기준)
  Object.keys(grouped).forEach(area => {
    grouped[area].sort((a, b) => b.nov2025 - a.nov2025);
  });

  console.log('📊 상권별 매장 수:');
  Object.keys(grouped).forEach(area => {
    const totalNov2025 = grouped[area].reduce((sum, store) => sum + store.nov2025, 0);
    const totalNov2024 = grouped[area].reduce((sum, store) => sum + store.nov2024, 0);
    const areaGrowth = totalNov2024 > 0 
      ? Math.round(((totalNov2025 - totalNov2024) / totalNov2024) * 100)
      : 0;

    console.log(`   ${area}: ${grouped[area].length}개 매장 (25년 ${Math.round(totalNov2025 / 100000000)}억, ${areaGrowth >= 0 ? '+' : ''}${areaGrowth}%)`);
  });

  return grouped;
}

