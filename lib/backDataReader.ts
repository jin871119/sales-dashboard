import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface MonthlyData {
  month: string;
  매출: number;
  목표: number;
  작년실적: number;
  신장율: number;
}

export interface WeeklyData {
  week: string;
  금년: number;
  전년: number;
  신장율: number;
}

/**
 * backdata.xlsx 파일의 "월별목표" 시트 읽기
 */
export function readMonthlyTargetSheet(filename: string): MonthlyData[] {
  try {
    const filePath = join(process.cwd(), filename);
    const file = readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    console.log(`\n📊 ${filename} 파일 분석 중...`);
    console.log(`📋 발견된 시트: ${workbook.SheetNames.join(', ')}`);

    // "월별목표" 시트 찾기
    const monthlySheetNames = ['월별목표', '월별', 'Monthly', 'monthly', 'Monthly Target'];
    let sheetName = workbook.SheetNames.find(name =>
      monthlySheetNames.includes(name) ||
      name.includes('월별') ||
      name.includes('목표') ||
      name.includes('Monthly')
    );

    if (!sheetName) {
      console.log('⚠️  "월별목표" 시트를 찾을 수 없습니다. 첫 번째 시트를 사용합니다.');
      sheetName = workbook.SheetNames[0];
    }

    console.log(`✅ "${sheetName}" 시트 선택됨`);

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`📊 총 ${rawData.length}행 발견`);

    if (rawData.length === 0) {
      return [];
    }

    console.log('\n🔍 가로 배열 데이터 분석 중...');
    
    // 실제 구조:
    // 1행(인덱스 0): [A1?, "1월", "2월", "3월", ..., "12월"]
    // 2행(인덱스 1): ["목표", 목표값1, 목표값2, ...]
    // 3행(인덱스 2): ["실적", 실적값1, 실적값2, ...]
    // 4행(인덱스 3): ["작년실적", 작년값1, 작년값2, ...] 또는 달성율
    const monthRow = rawData[0];   // 1행: 월 정보
    const targetRow = rawData[1];  // 2행: 목표
    const salesRow = rawData[2];   // 3행: 실적
    const lastYearRow = rawData[4] || rawData[3]; // 5행 또는 4행: 작년실적
    
    console.log(`📊 1행(월): ${monthRow?.length || 0}개 셀`);
    console.log(`📊 2행(목표): ${targetRow?.length || 0}개 셀`);
    console.log(`📊 3행(실적): ${salesRow?.length || 0}개 셀`);
    console.log(`📊 4-5행(작년실적): ${lastYearRow?.length || 0}개 셀`);
    
    const monthlyData: MonthlyData[] = [];
    
    if (!monthRow || !targetRow || !salesRow) {
      console.log('⚠️  필수 데이터 행을 찾을 수 없습니다.');
      return [];
    }
    
    // B열부터 시작 (인덱스 1부터)
    // A열은 라벨("목표", "실적")이므로 건너뜀
    for (let col = 1; col < monthRow.length; col++) {
      const monthCell = monthRow[col];
      if (!monthCell || String(monthCell).trim() === '') continue;
      
      const monthStr = String(monthCell).trim();
      
      // 월 번호 추출 (1~12)
      let monthNumber = 0;
      
      // "1월", "01월", "1" 형식
      const numMatch = monthStr.match(/(\d{1,2})\s*월?/);
      if (numMatch) {
        monthNumber = parseInt(numMatch[1]);
      }
      
      // 영문 월 이름
      const monthMap: { [key: string]: number } = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12
      };
      
      const lowerMonth = monthStr.toLowerCase();
      for (const [key, num] of Object.entries(monthMap)) {
        if (lowerMonth.includes(key)) {
          monthNumber = num;
          break;
        }
      }
      
      if (monthNumber < 1 || monthNumber > 12) continue;
      
      const month = `${monthNumber}월`;
      
      // 목표 데이터 추출 (2행)
      const 목표 = parseNumericCell(targetRow[col]);
      
      // 실적 데이터 추출 (3행)
      const 매출 = parseNumericCell(salesRow[col]);
      
      // 작년 실적 데이터 추출 (4-5행)
      const 작년실적 = lastYearRow ? parseNumericCell(lastYearRow[col]) : 0;
      
      // 신장율 계산
      const 신장율 = 작년실적 > 0 ? Math.round(((매출 - 작년실적) / 작년실적) * 100) : 0;
      
      monthlyData.push({
        month: month,
        매출: Math.round(매출),
        목표: Math.round(목표),
        작년실적: Math.round(작년실적),
        신장율: 신장율
      });
      
      console.log(`   ✓ ${month}: 목표 ${Math.round(목표).toLocaleString()}, 실적 ${Math.round(매출).toLocaleString()}, 작년 ${Math.round(작년실적).toLocaleString()}, 신장율 ${신장율}%`);
    }
    
    // 월 순서대로 정렬
    monthlyData.sort((a, b) => {
      const aNum = parseInt(a.month.replace('월', ''));
      const bNum = parseInt(b.month.replace('월', ''));
      return aNum - bNum;
    });
    
    // 누락된 월 채우기 (0으로)
    const completeData: MonthlyData[] = [];
    for (let i = 1; i <= 12; i++) {
      const monthName = `${i}월`;
      const existingData = monthlyData.find(item => item.month === monthName);
      
      if (existingData) {
        completeData.push(existingData);
      } else {
        completeData.push({
          month: monthName,
          매출: 0,
          목표: 0,
          작년실적: 0,
          신장율: 0
        });
      }
    }

    console.log(`✅ ${monthlyData.length}개 월별 데이터 추출 완료`);
    console.log(`📅 전체 12개월 데이터 생성 (누락 월 포함)`);
    
    // 데이터 미리보기
    console.log('\n📊 1월~12월 전체 데이터:');
    completeData.forEach(item => {
      const status = item.매출 > 0 || item.목표 > 0 ? '✓' : '○';
      const 달성율 = item.목표 > 0 ? Math.round((item.매출 / item.목표) * 100) : 0;
      console.log(`   ${status} ${item.month}: 목표 ${item.목표.toLocaleString()}, 실적 ${item.매출.toLocaleString()} (${달성율}%)`);
    });
    console.log('');

    return completeData;

  } catch (error) {
    console.error('월별목표 시트 읽기 오류:', error);
    throw error;
  }
}

/**
 * backdata.xlsx 파일의 "주차별매출" 시트 읽기
 */
export function readWeeklySalesSheet(filename: string): WeeklyData[] {
  try {
    const filePath = join(process.cwd(), filename);
    const file = readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    console.log(`\n📊 ${filename} 파일 분석 중...`);
    console.log(`📋 발견된 시트: ${workbook.SheetNames.join(', ')}`);

    // "주차별매출" 시트 찾기
    const weeklySheetNames = ['주차별매출', '주차별', 'Weekly', 'weekly', 'Week'];
    let sheetName = workbook.SheetNames.find(name =>
      weeklySheetNames.includes(name) ||
      name.includes('주차') ||
      name.includes('Weekly') ||
      name.includes('Week')
    );

    if (!sheetName) {
      console.log('⚠️  "주차별매출" 시트를 찾을 수 없습니다.');
      return [];
    }

    console.log(`✅ "${sheetName}" 시트 선택됨`);

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`📊 총 ${rawData.length}행 발견`);

    if (rawData.length === 0) {
      return [];
    }

    console.log('\n🔍 주차별 데이터 분석 중...');
    
    // 실제 구조:
    // 1행(인덱스 0): [A1?, "1주", "2주", "3주", ..., "52주"]
    // 2행(인덱스 1): ["금년", 금년값1, 금년값2, ...]
    // 3행(인덱스 2): ["전년", 전년값1, 전년값2, ...]
    const weekRow = rawData[0];   // 1행: 주차 정보
    const thisYearRow = rawData[1];  // 2행: 금년
    const lastYearRow = rawData[2];  // 3행: 전년
    
    console.log(`📊 1행(주차): ${weekRow?.length || 0}개 셀`);
    console.log(`📊 2행(금년): ${thisYearRow?.length || 0}개 셀`);
    console.log(`📊 3행(전년): ${lastYearRow?.length || 0}개 셀`);
    
    const weeklyData: WeeklyData[] = [];
    
    if (!weekRow || !thisYearRow || !lastYearRow) {
      console.log('⚠️  필수 데이터 행을 찾을 수 없습니다.');
      return [];
    }
    
    // B열부터 시작 (인덱스 1부터)
    for (let col = 1; col < weekRow.length && col <= 52; col++) {
      const weekCell = weekRow[col];
      if (!weekCell || String(weekCell).trim() === '') continue;
      
      const weekStr = String(weekCell).trim();
      
      // 주차 번호 추출 (1~52)
      let weekNumber = 0;
      
      // "1주", "1W", "Week 1" 형식
      const numMatch = weekStr.match(/(\d{1,2})/);
      if (numMatch) {
        weekNumber = parseInt(numMatch[1]);
      }
      
      if (weekNumber < 1 || weekNumber > 52) continue;
      
      const week = `${weekNumber}주`;
      
      // 금년 데이터 추출 (2행)
      const 금년 = parseNumericCell(thisYearRow[col]);
      
      // 전년 데이터 추출 (3행)
      const 전년 = parseNumericCell(lastYearRow[col]);
      
      // 신장율 계산
      const 신장율 = 전년 > 0 ? Math.round(((금년 - 전년) / 전년) * 100) : 0;
      
      weeklyData.push({
        week: week,
        금년: Math.round(금년),
        전년: Math.round(전년),
        신장율: 신장율
      });
      
      if (weeklyData.length <= 3) {
        console.log(`   ✓ ${week}: 금년 ${Math.round(금년).toLocaleString()}, 전년 ${Math.round(전년).toLocaleString()}, 신장율 ${신장율}%`);
      }
    }
    
    console.log(`✅ ${weeklyData.length}개 주차별 데이터 추출 완료`);
    console.log('');

    return weeklyData;

  } catch (error) {
    console.error('주차별매출 시트 읽기 오류:', error);
    return [];
  }
}

/**
 * 셀 값을 숫자로 변환
 */
function parseNumericCell(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const str = String(value).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * 여러 키 중에서 값 찾기
 */
function findValue(row: any, keys: string[]): any {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

/**
 * 여러 키 중에서 숫자 값 찾기
 */
function findNumericValue(row: any, keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      const value = row[key];
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num) && num !== 0) {
        return num;
      }
    }
  }
  return 0;
}

