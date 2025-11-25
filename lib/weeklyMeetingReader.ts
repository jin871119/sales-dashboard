import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface WeeklyMeetingData {
  period: string; // '25년 누계', '11월', '46주차'
  categories: WeeklyMeetingCategory[];
}

export interface WeeklyMeetingCategory {
  name: string; // '합계', '국내', '면세', 'RF+도매'
  yearlyTarget?: number;
  yearlyActual?: number;
  yearlyLastYear?: number;
  yearlyGrowthRate?: number;
  yearlyAchievementRate?: number;
  monthlyTarget?: number;
  monthlyActual?: number;
  monthlyLastYear?: number;
  monthlyGrowthRate?: number;
  monthlyAchievementRate?: number;
  weeklyActual?: number;
  weeklyLastYear?: number;
  weeklyGrowthRate?: number;
}

export function readWeeklyMeetingData(): WeeklyMeetingData | null {
  try {
    // 1. JSON 파일 우선 시도 (로컬/Vercel 모두)
    const jsonPath = path.join(process.cwd(), 'public', 'weekly-meeting-data.json');
    if (fs.existsSync(jsonPath)) {
      console.log('📊 weekly-meeting-data.json 파일에서 읽는 중...');
      const jsonData = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(jsonData);
      console.log('✅ 주간회의 데이터 JSON에서 로드 성공');
      return parsed;
    }

    // 2. backdata.json에서 주간회의 시트 읽기 시도
    const backdataJsonPath = path.join(process.cwd(), 'public', 'backdata.json');
    if (fs.existsSync(backdataJsonPath)) {
      console.log('📊 backdata.json에서 주간회의 시트 읽는 중...');
      const backdataJson = JSON.parse(fs.readFileSync(backdataJsonPath, 'utf-8'));
      const sheetName = '주간회의';
      
      if (backdataJson.data && backdataJson.data[sheetName] && backdataJson.data[sheetName].raw) {
        const rawData = backdataJson.data[sheetName].raw;
        console.log('✅ backdata.json에서 주간회의 시트 발견');
        const parsed = parseWeeklyMeetingData(rawData);
        console.log('✅ 주간회의 데이터 파싱 완료');
        return parsed;
      }
    }

    // 3. 엑셀 파일 직접 읽기 (로컬 개발용)
    const excelPath = path.join(process.cwd(), 'backdata.xlsx');
    if (fs.existsSync(excelPath)) {
      console.log('📊 backdata.xlsx에서 주간회의 시트 읽는 중...');
      const buffer = fs.readFileSync(excelPath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const sheetName = '주간회의';
      if (!workbook.SheetNames.includes(sheetName)) {
        console.error('❌ "주간회의" 시트를 찾을 수 없습니다.');
        return null;
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      console.log('✅ 주간회의 데이터 엑셀에서 읽기 성공');
      return parseWeeklyMeetingData(data);
    }

    console.warn('⚠️ 주간회의 데이터를 찾을 수 없습니다. (weekly-meeting-data.json, backdata.json, backdata.xlsx 모두 확인)');
    return null;
  } catch (error: any) {
    console.error('❌ 주간회의 데이터 읽기 오류:', error.message);
    return null;
  }
}

function parseWeeklyMeetingData(data: any[][]): WeeklyMeetingData {
  const categories: WeeklyMeetingCategory[] = [];
  
  // 주차 정보 추출 (1행 또는 2행에서 찾기)
  let weekNumber = 47; // 기본값
  let periodText = '2025년 47주차';
  
  // 1행과 2행에서 주차 정보 찾기
  for (let rowIdx = 0; rowIdx < Math.min(3, data.length); rowIdx++) {
    const row = data[rowIdx];
    if (row) {
      const rowText = row.join(' ').toString();
      // "47주차", "47주", "W47", "Week 47" 등 패턴 찾기
      const weekMatch = rowText.match(/(\d{1,2})\s*주차?|W(\d{1,2})|Week\s*(\d{1,2})/i);
      if (weekMatch) {
        weekNumber = parseInt(weekMatch[1] || weekMatch[2] || weekMatch[3] || '47');
        // 연도 정보도 찾기
        const yearMatch = rowText.match(/(\d{4})\s*년|(\d{2})\s*년/);
        if (yearMatch) {
          const year = yearMatch[1] || `20${yearMatch[2]}`;
          periodText = `${year}년 ${weekNumber}주차`;
        } else {
          periodText = `2025년 ${weekNumber}주차`;
        }
        console.log(`✅ 주차 정보 발견: ${periodText}`);
        break;
      }
    }
  }
  
  // 상권별 데이터 파싱 (행 4-8: 합계, 국내, 면세, RF+도매)
  const areaData: any[] = [];
  const areaRows = data.slice(3, 8);
  
  areaRows.forEach(row => {
    if (row[0] && typeof row[0] === 'string') {
      const category: any = {
        name: row[0],
        // 25년 누계
        yearlyTarget: parseNumber(row[1]),
        yearlyActual: parseNumber(row[2]),
        yearlyLastYear: parseNumber(row[3]),
        yearlyGrowthRate: parseNumber(row[4]),
        yearlyAchievementRate: parseNumber(row[5]),
        yearlyExistingGrowth: parseNumber(row[6]),
        // 11월
        monthlyTarget: parseNumber(row[8]),
        monthlyActual: parseNumber(row[9]),
        monthlyLastYear: parseNumber(row[10]),
        monthlyGrowthRate: parseNumber(row[11]),
        monthlyAchievementRate: parseNumber(row[12]),
        monthlyExistingGrowth: parseNumber(row[13]),
        monthlyPureGrowth: parseNumber(row[14]), // 순수신장율
        monthlyGroupRatio: parseNumber(row[15]), // 단체비중
        // 주차별 (동적으로 읽은 주차)
        weeklyActual: parseNumber(row[17]),
        weeklyLastYear: parseNumber(row[18]),
        weeklyGrowthRate: parseNumber(row[19]),
        weeklyGroupRatio: parseNumber(row[20]), // 단체비중
      };
      categories.push(category);
      areaData.push(category);
    }
  });

  // 채널별 데이터 파싱 (행 13-20: 합계, 백화점, 대리점, 온라인, 직영점, 면세, 도매)
  const channelData: any[] = [];
  const channelRows = data.slice(12, 21);
  
  channelRows.forEach(row => {
    if (row[0] && typeof row[0] === 'string') {
      const channel: any = {
        name: row[0],
        // 25년 누계
        yearlyTarget: parseNumber(row[1]),
        yearlyActual: parseNumber(row[2]),
        yearlyLastYear: parseNumber(row[3]),
        yearlyGrowthRate: parseNumber(row[4]),
        yearlyAchievementRate: parseNumber(row[5]),
        yearlyExistingGrowth: parseNumber(row[6]),
        // 11월
        monthlyTarget: parseNumber(row[8]),
        monthlyActual: parseNumber(row[9]),
        monthlyLastYear: parseNumber(row[10]),
        monthlyGrowthRate: parseNumber(row[11]),
        monthlyAchievementRate: parseNumber(row[12]),
        monthlyExistingGrowth: parseNumber(row[13]),
        monthlyPureGrowth: parseNumber(row[14]), // 순수신장율
        monthlyGroupRatio: parseNumber(row[15]), // 단체비중
        // 주차별 (동적으로 읽은 주차)
        weeklyActual: parseNumber(row[17]),
        weeklyLastYear: parseNumber(row[18]),
        weeklyGrowthRate: parseNumber(row[19]),
        weeklyGroupRatio: parseNumber(row[20]), // 단체비중
      };
      channelData.push(channel);
    }
  });

  console.log(`📊 주간회의 데이터 파싱 완료: ${periodText}`);
  console.log(`   상권별: ${areaData.length}개, 채널별: ${channelData.length}개`);
  console.log(`   순수신장율/단체비중 필드 포함 확인:`);
  if (areaData.length > 0) {
    const sample = areaData[0];
    console.log(`   - monthlyPureGrowth: ${sample.monthlyPureGrowth !== undefined ? '✓' : '✗'}`);
    console.log(`   - monthlyGroupRatio: ${sample.monthlyGroupRatio !== undefined ? '✓' : '✗'}`);
    console.log(`   - weeklyGroupRatio: ${sample.weeklyGroupRatio !== undefined ? '✓' : '✗'}`);
  }

  return {
    period: periodText,
    categories,
    rawData: {
      상권: areaData,
      채널: channelData
    }
  } as any;
}

function parseNumber(value: any): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? undefined : num;
}

