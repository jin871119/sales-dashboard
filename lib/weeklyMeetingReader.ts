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
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    
    // Vercel 환경에서는 JSON 파일 사용
    if (isProduction) {
      const jsonPath = path.join(process.cwd(), 'public', 'weekly-meeting-data.json');
      if (fs.existsSync(jsonPath)) {
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(jsonData);
      }
      console.warn('⚠️ weekly-meeting-data.json 파일이 없습니다.');
      return null;
    }

    // 로컬 환경에서는 엑셀 직접 읽기
    const excelPath = path.join(process.cwd(), 'backdata.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ backdata.xlsx 파일을 찾을 수 없습니다.');
      return null;
    }

    const buffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheetName = '주간회의';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.error('❌ "주간회의" 시트를 찾을 수 없습니다.');
      return null;
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    console.log('✅ 주간회의 데이터 읽기 성공');
    
    return parseWeeklyMeetingData(data);
  } catch (error: any) {
    console.error('❌ 주간회의 데이터 읽기 오류:', error.message);
    return null;
  }
}

function parseWeeklyMeetingData(data: any[][]): WeeklyMeetingData {
  const categories: WeeklyMeetingCategory[] = [];
  
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
        monthlyPureGrowth: parseNumber(row[14]),
        // 46주차
        weeklyActual: parseNumber(row[17]),
        weeklyLastYear: parseNumber(row[18]),
        weeklyGrowthRate: parseNumber(row[19]),
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
        monthlyPureGrowth: parseNumber(row[14]),
        // 46주차
        weeklyActual: parseNumber(row[17]),
        weeklyLastYear: parseNumber(row[18]),
        weeklyGrowthRate: parseNumber(row[19]),
      };
      channelData.push(channel);
    }
  });

  return {
    period: '2025년 46주차',
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

