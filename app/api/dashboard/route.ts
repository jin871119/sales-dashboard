import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { readSummaryFromRaw } from "@/lib/summaryReader";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rootDir = process.cwd();
    
    // 1. backdata JSON 필수 확인
    const backdataJsonPath = join(rootDir, 'public', 'backdata.json');
    if (!existsSync(backdataJsonPath)) {
      console.log('⚠️  backdata.json 파일을 찾을 수 없습니다.');
      return NextResponse.json({
        ...getDefaultData(),
        _notice: "public/backdata.json 파일이 없습니다. 'node prepare-deploy.js'를 실행한 후 다시 시도해주세요."
      });
    }

    const backdataJson = JSON.parse(readFileSync(backdataJsonPath, 'utf8'));
    const monthlyData = parseMonthlyFromJson(backdataJson);
    const weeklyData = parseWeeklyFromJson(backdataJson);
    const storeByArea = parseStoreByAreaFromJson(backdataJson);
    const storeDCRate = parseStoreDCRateFromJson(backdataJson);

    // 2. ending focast JSON 필수 확인
    const endingFocastJsonPath = join(rootDir, 'public', 'ending-focast.json');
    if (!existsSync(endingFocastJsonPath)) {
      console.log('⚠️  ending-focast.json 파일을 찾을 수 없습니다.');
      return NextResponse.json({
        ...getDefaultData(),
        _notice: "public/ending-focast.json 파일이 없습니다. 'node convert-ending-focast.js' 또는 'node prepare-deploy.js'를 실행한 후 다시 시도해주세요."
      });
    }

    const endingJson = JSON.parse(readFileSync(endingFocastJsonPath, 'utf8'));
    const sheetName = getPrimarySheetName(endingJson);
    const primarySheet = endingJson.data?.[sheetName];

    if (!primarySheet || !primarySheet.raw) {
      throw new Error(`JSON 데이터에서 "${sheetName}" 시트를 찾을 수 없습니다.`);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(primarySheet.raw);
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log('✅ ending-focast.json 데이터 로드 성공:', {
      sheetName,
      rowCount: rawData.length,
      columns: rawData.length > 0 ? Object.keys(rawData[0]) : []
    });

    // 요약 시트 데이터 파싱
    let summaryData = null;
    const summarySheetName = getSummarySheetName(endingJson);
    if (summarySheetName && endingJson.data?.[summarySheetName]?.raw) {
      summaryData = readSummaryFromRaw(endingJson.data[summarySheetName].raw, summarySheetName);
      console.log(`✅ "${summarySheetName}" 요약 시트 JSON에서 로드 완료`);
      console.log('📊 summaryData 추출된 값:', {
        salesTarget: summaryData?.salesTarget?.[0]?.value,
        forecast: summaryData?.forecast?.[0]?.value,
        periodPerformance: summaryData?.periodPerformance?.[0]?.value,
        lastYearPeriod: summaryData?.lastYearPeriod?.[0]?.value,
        periodGrowthRate: summaryData?.periodGrowthRate?.[0]?.value,
        forecastAchievementRate: summaryData?.forecastAchievementRate?.[0]?.value,
      });
    } else {
      console.log('⚠️  요약 시트를 JSON에서 찾을 수 없습니다.');
      console.log('사용 가능한 시트:', Object.keys(endingJson.data || {}));
    }

    // upload 시트에서 KPI 데이터 및 상권별/팀별/유통별 데이터 추출 (우선순위 1)
    let uploadKpiData = null;
    let uploadSummaryData = null;
    const uploadSheetName = getUploadSheetName(endingJson);
    if (uploadSheetName && endingJson.data?.[uploadSheetName]?.raw) {
      uploadKpiData = extractKpiFromUploadSheet(endingJson.data[uploadSheetName].raw);
      uploadSummaryData = extractSummaryDataFromUploadSheet(endingJson.data[uploadSheetName].raw);
      console.log(`✅ "${uploadSheetName}" upload 시트에서 KPI 및 상권별/팀별/유통별 데이터 추출 완료`);
    } else {
      console.log('⚠️  upload 시트를 JSON에서 찾을 수 없습니다.');
      console.log('사용 가능한 시트:', Object.keys(endingJson.data || {}));
    }

    // upload 시트의 상권별/팀별/유통별 데이터가 있으면 우선 사용
    if (uploadSummaryData && (uploadSummaryData.byArea.length > 0 || uploadSummaryData.byTeam.length > 0 || uploadSummaryData.byChannel.length > 0)) {
      if (!summaryData) {
        summaryData = { rawData: [] };
      }
      // upload 시트 데이터로 덮어쓰기
      summaryData.byArea = uploadSummaryData.byArea;
      summaryData.byTeam = uploadSummaryData.byTeam;
      summaryData.byChannel = uploadSummaryData.byChannel;
      console.log('✅ upload 시트의 상권별/팀별/유통별 데이터를 summaryData에 반영');
    }
    
    const data = convertExcelToDashboard(rawData, sheetName, summaryData, monthlyData, weeklyData, storeByArea, uploadKpiData, storeDCRate);
    return NextResponse.json(data);
    
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

function getPrimarySheetName(endingJson: any): string {
  if (endingJson?.sheetNames && endingJson.sheetNames.length > 0) {
    return endingJson.sheetNames[0];
  }
  if (endingJson?.data && Object.keys(endingJson.data).length > 0) {
    return Object.keys(endingJson.data)[0];
  }
  return '요약';
}

function getSummarySheetName(endingJson: any): string | null {
  if (!endingJson?.data) return null;
  const summarySheetNames = ['요약', 'Summary', 'summary', '總結'];
  const found = Object.keys(endingJson.data).find(name =>
    summarySheetNames.includes(name) ||
    name.includes('요약') ||
    name.includes('Summary')
  );
  return found || null;
}

function getUploadSheetName(endingJson: any): string | null {
  if (!endingJson?.data) return null;
  const uploadSheetNames = ['upload', 'Upload', 'UPLOAD', '업로드'];
  const found = Object.keys(endingJson.data).find(name =>
    uploadSheetNames.includes(name) ||
    name.toLowerCase().includes('upload')
  );
  return found || null;
}

/**
 * "upload" 시트에서 상권별, 팀별, 유통별 데이터 추출
 */
function extractSummaryDataFromUploadSheet(uploadSheetRaw: any[][]): {
  byArea: any[];
  byTeam: any[];
  byChannel: any[];
} {
  console.log('📊 upload 시트에서 상권별/팀별/유통별 데이터 추출 시작...');
  
  const result = {
    byArea: [] as any[],
    byTeam: [] as any[],
    byChannel: [] as any[]
  };
  
  if (!uploadSheetRaw || uploadSheetRaw.length === 0) {
    console.log('⚠️  upload 시트 데이터가 비어있습니다.');
    return result;
  }
  
  // 숫자 파싱 헬퍼
  const parseValue = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };
  
  // 컬럼 인덱스
  const 구분ColIndex = 0;      // A열: 구분
  const 소제목ColIndex = 1;    // B열: 소제목
  const 매출목표ColIndex = 2;  // C열: 매출목표 (target)
  const 마감예상ColIndex = 3;  // D열: 마감예상 (sales fcst)
  const 마감달성율ColIndex = 4; // E열: 마감달성율 (ach%)
  const 진도실적ColIndex = 7;  // H열: 진도실적 (actual mtd)
  const 작년실적ColIndex = 8;  // I열: 작년실적 (ly actual)
  const 진도신장율ColIndex = 9; // J열: 신장율 (진도 신장율, gr)
  
  let currentCategory = '';
  
  // 모든 행 순회
  for (let i = 1; i < uploadSheetRaw.length; i++) {
    const row = uploadSheetRaw[i];
    if (!row) continue;
    
    const 구분값 = String(row[구분ColIndex] || '').trim();
    const 소제목값 = String(row[소제목ColIndex] || '').trim();
    
    // 빈 행이면 스킵
    if (!구분값 && !소제목값) continue;
    
    // 카테고리 변경 감지
    if (구분값 === '상권') {
      currentCategory = 'area';
    } else if (구분값 === 'TEAM') {
      currentCategory = 'team';
    } else if (구분값.includes('유통별')) {
      currentCategory = 'channel';
    }
    
    // SUM 행 또는 데이터 행 처리
    if (소제목값.toUpperCase() === 'SUM' || (소제목값 && 소제목값 !== '')) {
      const name = 소제목값 === 'SUM' || 소제목값.toUpperCase() === 'SUM' ? 'SUM' : 소제목값;
      
      const target = Math.round(parseValue(row[매출목표ColIndex]));
      const forecast = Math.round(parseValue(row[마감예상ColIndex]));
      const actualMTD = Math.round(parseValue(row[진도실적ColIndex]));
      const lyActual = Math.round(parseValue(row[작년실적ColIndex]));
      
      const 마감달성율 = parseValue(row[마감달성율ColIndex]);
      const forecastAchievementRate = Math.round(마감달성율 * 100);
      
      const 진도신장율 = parseValue(row[진도신장율ColIndex]);
      const periodGrowthRate = Math.round(진도신장율 * 100);
      
      const item = {
        name,
        target,
        periodPerformance: actualMTD,
        lastYearPeriod: lyActual,
        periodGrowthRate,
        forecast,
        forecastAchievementRate,
        novemberTarget: target,
        actualMTD: actualMTD,
        lyActual: lyActual,
        salesFCST: forecast
      };
      
      // SUM 행이 아니고 데이터가 있는 경우만 추가
      if (name !== 'SUM' && (target > 0 || actualMTD > 0 || forecast > 0)) {
        if (currentCategory === 'area') {
          result.byArea.push(item);
        } else if (currentCategory === 'team') {
          result.byTeam.push(item);
        } else if (currentCategory === 'channel') {
          result.byChannel.push(item);
        }
      } else if (name === 'SUM' && currentCategory) {
        // SUM 행은 맨 앞에 추가
        if (currentCategory === 'area') {
          result.byArea.unshift(item);
        } else if (currentCategory === 'team') {
          result.byTeam.unshift(item);
        } else if (currentCategory === 'channel') {
          result.byChannel.unshift(item);
        }
      }
    }
  }
  
  console.log(`✅ upload 시트 데이터 추출 완료: 상권별 ${result.byArea.length}건, 팀별 ${result.byTeam.length}건, 유통별 ${result.byChannel.length}건`);
  
  return result;
}

/**
 * "upload" 시트에서 KPI 데이터 추출
 * 실제 구조:
 * A열: 구분
 * B열: 소제목
 * C열: 매출목표 (target)
 * D열: 마감예상 (sales fcst)
 * E열: 마감달성율 (ach%)
 * F열: 작년 월마감
 * G열: 신장율 (마감 신장율)
 * H열: 진도실적 (actual mtd)
 * I열: 작년실적 (ly actual)
 * J열: 신장율 (진도 신장율)
 */
function extractKpiFromUploadSheet(uploadSheetRaw: any[][]): {
  salesTarget: number;
  periodPerformance: number;
  lastYearPeriod: number;
  periodGrowthRate: number;
  forecast: number;
  forecastAchievementRate: number;
} {
  console.log('📊 upload 시트에서 KPI 데이터 추출 시작...');
  
  const result = {
    salesTarget: 0,
    periodPerformance: 0,
    lastYearPeriod: 0,
    periodGrowthRate: 0,
    forecast: 0,
    forecastAchievementRate: 0
  };
  
  if (!uploadSheetRaw || uploadSheetRaw.length === 0) {
    console.log('⚠️  upload 시트 데이터가 비어있습니다.');
    return result;
  }
  
  // 숫자 파싱 헬퍼
  const parseValue = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };
  
  // 실제 컬럼 인덱스 (분석 결과 기반)
  const 구분ColIndex = 0;      // A열: 구분
  const 소제목ColIndex = 1;    // B열: 소제목
  const 매출목표ColIndex = 2;  // C열: 매출목표 (target)
  const 마감예상ColIndex = 3;  // D열: 마감예상 (sales fcst)
  const 마감달성율ColIndex = 4; // E열: 마감달성율 (ach%)
  const 진도실적ColIndex = 7;  // H열: 진도실적 (actual mtd)
  const 작년실적ColIndex = 8;  // I열: 작년실적 (ly actual)
  const 진도신장율ColIndex = 9; // J열: 신장율 (진도 신장율, gr)
  
  // 첫 번째 SUM 행 찾기 (상권 SUM 행, 인덱스 1)
  for (let i = 1; i < Math.min(20, uploadSheetRaw.length); i++) {
    const row = uploadSheetRaw[i];
    if (!row) continue;
    
    const 구분값 = String(row[구분ColIndex] || '').trim();
    const 소제목값 = String(row[소제목ColIndex] || '').trim().toUpperCase();
    
    // 상권 SUM 행 찾기 (첫 번째 SUM 행)
    if (소제목값 === 'SUM' && 구분값 === '상권') {
      result.salesTarget = Math.round(parseValue(row[매출목표ColIndex])); // C열: 매출목표
      result.forecast = Math.round(parseValue(row[마감예상ColIndex])); // D열: 마감예상
      result.periodPerformance = Math.round(parseValue(row[진도실적ColIndex])); // H열: 진도실적
      result.lastYearPeriod = Math.round(parseValue(row[작년실적ColIndex])); // I열: 작년실적
      
      // 마감달성율 (E열): 1.02 = 102%이므로 항상 100 곱하기
      const 마감달성율 = parseValue(row[마감달성율ColIndex]);
      result.forecastAchievementRate = Math.round(마감달성율 * 100);
      
      // 진도 신장율 (J열): 소수면 100 곱하기 (0.08 = 8%)
      const 진도신장율 = parseValue(row[진도신장율ColIndex]);
      result.periodGrowthRate = Math.round(진도신장율 * 100);
      
      console.log('✅ 상권 SUM 행에서 KPI 추출:', {
        salesTarget: result.salesTarget.toLocaleString(),
        forecast: result.forecast.toLocaleString(),
        periodPerformance: result.periodPerformance.toLocaleString(),
        lastYearPeriod: result.lastYearPeriod.toLocaleString(),
        periodGrowthRate: result.periodGrowthRate + '%',
        forecastAchievementRate: result.forecastAchievementRate + '%'
      });
      
      break;
    }
  }
  
  return result;
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
    // JSON 구조 확인: jsonData.data["주차별매출"] 또는 jsonData["주차별매출"]
    let sheetData = null;
    let sheetName = null;
    
    // 먼저 jsonData.data 구조 확인
    if (jsonData.data) {
      sheetName = Object.keys(jsonData.data).find((name: string) => 
        name.includes('주차') || name.includes('Weekly') || name.includes('Week')
      );
      if (sheetName) {
        sheetData = jsonData.data[sheetName];
      }
    }
    
    // jsonData.data가 없으면 직접 확인
    if (!sheetData) {
      sheetName = Object.keys(jsonData).find((name: string) => 
        name.includes('주차') || name.includes('Weekly') || name.includes('Week')
      );
      if (sheetName) {
        sheetData = jsonData[sheetName];
      }
    }
    
    if (!sheetData) {
      console.log('⚠️  JSON에서 "주차별매출" 시트를 찾을 수 없습니다.');
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
    
    // lib/backDataReader.ts의 parseWeeklyData 로직 재사용
    return parseWeeklyDataFromRaw(rawData);
    
  } catch (error: any) {
    console.error('주차별 데이터 파싱 실패:', error);
    console.error('에러 스택:', error.stack);
    return [];
  }
}

// lib/backDataReader.ts의 parseWeeklyData 로직 재사용
function parseWeeklyDataFromRaw(rawData: any[][]): any[] {
  try {
    if (rawData.length === 0) {
      return [];
    }
    
    // 실제 구조:
    // 1행(인덱스 0): [A1?, "1주", "2주", "3주", ..., "52주"]
    // 2행(인덱스 1): ["금년", 금년값1, 금년값2, ...]
    // 3행(인덱스 2): ["전년", 전년값1, 전년값2, ...]
    const weekRow = rawData[0] as any[];   // 1행: 주차 정보
    const thisYearRow = rawData[1] as any[];  // 2행: 금년
    const lastYearRow = rawData[2] as any[];  // 3행: 전년
    
    if (!weekRow || !thisYearRow || !lastYearRow) {
      console.log('⚠️  필수 데이터 행을 찾을 수 없습니다.');
      return [];
    }
    
    const weeklyData: any[] = [];
    
    // 숫자 파싱 헬퍼
    const parseNumericCell = (cell: any): number => {
      if (cell == null || cell === '') return 0;
      if (typeof cell === 'number') return cell;
      const str = String(cell).replace(/[^0-9.-]/g, '');
      return parseFloat(str) || 0;
    };
    
    // 47주 찾기: 모든 컬럼에서 "47"이 포함된 셀 찾기
    console.log('\n🔍 47주 찾기: 40-55 컬럼 범위에서 "47" 포함 셀 검색...');
    for (let col = 40; col < Math.min(weekRow.length, 55); col++) {
      const cell = weekRow[col];
      if (cell && String(cell).includes('47')) {
        console.log(`   발견! 컬럼 ${col}: "${cell}" (타입: ${typeof cell})`);
      }
    }
    console.log('');
    
    const weekNumberSet = new Set<number>(); // 중복 체크용
    
    // B열부터 시작 (인덱스 1부터)
    // 주의: col <= 52 조건을 제거하고 weekRow.length까지 모두 확인
    for (let col = 1; col < weekRow.length; col++) {
      const weekCell = weekRow[col];
      if (!weekCell || String(weekCell).trim() === '') {
        // 47주 근처에서 빈 셀 로그 출력
        if (col >= 40 && col <= 55) {
          console.log(`   ⚠️  컬럼 ${col}: 빈 셀 또는 null`);
        }
        continue;
      }
      
      const weekStr = String(weekCell).trim();
      
      // 주차 번호 추출 (1~52)
      let weekNumber = 0;
      
      // 다양한 형식 지원: "1주", "1W", "W1", "W47", "Week 1", "47주", "47" 등
      // W47, w47 형식도 처리
      const patterns = [
        /W(\d{1,2})/i,           // W47, w47
        /(\d{1,2})\s*주/,        // 47주, 47 주
        /(\d{1,2})\s*W/i,        // 47W, 47 W
        /Week\s*(\d{1,2})/i,     // Week 47
        /^(\d{1,2})$/            // 47 (숫자만)
      ];
      
      for (const pattern of patterns) {
        const match = weekStr.match(pattern);
        if (match) {
          weekNumber = parseInt(match[1]);
          break;
        }
      }
      
      if (weekNumber < 1 || weekNumber > 52) {
        // 47주 근처에서 주차 번호 추출 실패 로그 출력
        if (col >= 40 && col <= 55) {
          console.log(`   ⚠️  컬럼 ${col}: 주차 번호 추출 실패 (weekStr="${weekStr}", weekNumber=${weekNumber})`);
        }
        continue;
      }
      
      // 중복 체크: 같은 주차 번호가 이미 추가되었는지 확인
      if (weekNumberSet.has(weekNumber)) {
        console.log(`   ⚠️  컬럼 ${col}: 주차 ${weekNumber}주가 이미 추가됨 (중복, 원본="${weekStr}")`);
        continue;
      }
      weekNumberSet.add(weekNumber);
      
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
      
      // 47주 발견 시 특별 로그
      if (weekNumber === 47) {
        console.log(`   🎯 47주 발견! 컬럼 ${col}, 원본="${weekStr}": 금년 ${Math.round(금년).toLocaleString()}, 전년 ${Math.round(전년).toLocaleString()}`);
      }
      
      // 45-50주 로그 출력
      if (weekNumber >= 45 && weekNumber <= 50) {
        console.log(`   ✓ ${week} (컬럼 ${col}, 원본="${weekStr}"): 금년 ${Math.round(금년).toLocaleString()}, 전년 ${Math.round(전년).toLocaleString()}, 신장율 ${신장율}%`);
      }
    }
    
    // 47주차 특별 처리: AV열(인덱스 48) 3행(인덱스 2)에서 직접 읽기
    // 주의: 47주차 25년 실적은 AV열 3행에 있음 (3행 = 인덱스 2)
    const AV_COLUMN_INDEX = 47; // AV열 = 47번째 인덱스 (0-베이스, 컬럼 'AV')
    const ROW_3_INDEX = 2; // 3행 = 인덱스 2
    const existingWeekNumbers = new Set(weeklyData.map(w => parseInt(w.week.replace('주', ''))));
    
    // 3행에서 금년 데이터 직접 읽기 (사용자 확인: AV열 3행에 25년 실적)
    const row3Data = rawData[ROW_3_INDEX] as any[];
    if (!existingWeekNumbers.has(47) && row3Data && row3Data.length > AV_COLUMN_INDEX) {
      const 금년47 = parseNumericCell(row3Data[AV_COLUMN_INDEX]);
      // 전년 데이터는 다른 행에서 찾거나 0으로 설정
      const 전년47 = lastYearRow && lastYearRow.length > AV_COLUMN_INDEX 
        ? parseNumericCell(lastYearRow[AV_COLUMN_INDEX])
        : 0;
      
      if (금년47 > 0) {
        const 신장율47 = 전년47 > 0 ? Math.round(((금년47 - 전년47) / 전년47) * 100) : 0;
        
        weeklyData.push({
          week: '47주',
          금년: Math.round(금년47),
          전년: Math.round(전년47),
          신장율: 신장율47
        });
        
        console.log(`   🎯 47주 AV열 직접 읽기 성공! AV열(인덱스 ${AV_COLUMN_INDEX}) 3행: 금년 ${Math.round(금년47).toLocaleString()}, 전년 ${Math.round(전년47).toLocaleString()}, 신장율 ${신장율47}%`);
      } else {
        console.log(`   ⚠️  AV열(인덱스 ${AV_COLUMN_INDEX}) 3행에서 47주 데이터를 찾을 수 없습니다 (값: ${금년47})`);
      }
    }
    
    console.log(`✅ JSON에서 ${weeklyData.length}개 주차별 데이터 파싱 완료`);
    
    // 추출된 주차 번호 목록 확인 (47주 포함 여부)
    const weekNumbers = weeklyData.map(w => {
      const num = parseInt(w.week.replace('주', ''));
      return num;
    }).sort((a, b) => a - b);
    
    const hasWeek47 = weekNumbers.includes(47);
    console.log(`📊 추출된 주차 범위: ${weekNumbers[0]}주 ~ ${weekNumbers[weekNumbers.length - 1]}주`);
    console.log(`${hasWeek47 ? '✅' : '⚠️'} 47주 데이터: ${hasWeek47 ? '포함됨' : '누락됨'}`);
    
    if (!hasWeek47) {
      console.log(`🔍 47주 근처 데이터 확인:`);
      const nearbyWeeks = weeklyData.filter(w => {
        const num = parseInt(w.week.replace('주', ''));
        return num >= 45 && num <= 50;
      });
      nearbyWeeks.forEach(w => {
        console.log(`   - ${w.week}: 금년 ${w.금년.toLocaleString()}, 전년 ${w.전년.toLocaleString()}`);
      });
      
      // 47주가 없는 경우, 원본 데이터에서 직접 찾기
      console.log(`\n🔍 원본 데이터에서 47주 직접 검색 (40-55 컬럼):`);
      for (let col = 40; col < Math.min(weekRow.length, 55); col++) {
        const weekCell = weekRow[col];
        if (weekCell && String(weekCell).includes('47')) {
          const weekStr = String(weekCell).trim();
          const 금년 = parseNumericCell(thisYearRow[col]);
          const 전년 = parseNumericCell(lastYearRow[col]);
          console.log(`   컬럼 ${col}: "${weekStr}" -> 금년: ${금년.toLocaleString()}, 전년: ${전년.toLocaleString()}`);
        }
      }
    }
    
    return weeklyData;
    
  } catch (error: any) {
    console.error('주차별 데이터 파싱 오류:', error);
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
 * JSON 데이터에서 매장별 DC율 데이터 파싱 (DC율 시트 기반)
 * 실판가, 택가, DC율, 전년DC율, 전년대비차이 포함
 */
function parseStoreDCRateFromJson(jsonData: any): any[] {
  try {
    console.log('📊 매장별 DC율 데이터 파싱 시작 (상권구분 + DC율 시트 통합)...');
    console.log('📋 backdata.json의 모든 시트:', Object.keys(jsonData.data || {}));
    
    const allSheetNames = Object.keys(jsonData.data || {});
    
    // 1. "상권구분" 시트 찾기 (상권별 매장 목록)
    const areaSheetName = allSheetNames.find((name: string) => {
      return name.includes('상권구분') || 
             name.includes('상권') || 
             name.includes('매장') ||
             name.includes('Store') ||
             name.includes('store');
    });
    
    if (!areaSheetName || !jsonData.data[areaSheetName]) {
      console.log('⚠️  상권구분 시트를 찾을 수 없습니다.');
      console.log('📋 사용 가능한 시트:', allSheetNames);
      return [];
    }
    
    console.log(`✅ 상권구분 시트 발견: "${areaSheetName}"`);
    
    // 2. "DC율" 시트 찾기 (매장별 실적 데이터)
    const dcSheetName = allSheetNames.find((name: string) => {
      const nameLower = name.toLowerCase();
      return name.includes('DC율') || 
             name.includes('DC') || 
             nameLower.includes('dc') || 
             name.includes('할인') ||
             name.includes('dc율') ||
             name.includes('DCRate') ||
             name.includes('dcrate');
    });
    
    if (!dcSheetName || !jsonData.data[dcSheetName]) {
      console.log('⚠️  DC율 시트를 찾을 수 없습니다.');
      console.log('📋 사용 가능한 시트:', allSheetNames);
      console.log('💡 "DC율", "DC", "dc", "할인" 키워드가 포함된 시트를 찾습니다.');
      return [];
    }
    
    console.log(`✅ DC율 시트 발견: "${dcSheetName}"`);
    
    // 3. 상권구분 시트에서 상권별 매장 목록 읽기
    const areaRawData = jsonData.data[areaSheetName].raw || jsonData.data[areaSheetName];
    const storeAreaMap = new Map<string, string>(); // 매장명 -> 상권구분
    
    if (areaRawData && Array.isArray(areaRawData) && areaRawData.length > 0) {
      console.log(`📊 상권구분 시트 파싱 시작: ${areaRawData.length}행`);
      
      // 헤더 행 찾기
      let areaHeaderRowIndex = -1;
      let areaStoreNameColIndex = -1;
      let areaAreaColIndex = -1;
      
      for (let i = 0; i < Math.min(10, areaRawData.length); i++) {
        const row = areaRawData[i];
        if (!row || !Array.isArray(row)) continue;
        
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim();
          if (cell.includes('매장명') || cell.includes('매장') || cell.includes('Store') || cell.includes('store')) {
            areaStoreNameColIndex = j;
          }
          if (cell.includes('상권') || cell.includes('Area') || cell.includes('구분') || cell.includes('지역')) {
            areaAreaColIndex = j;
          }
        }
        
        if (areaStoreNameColIndex >= 0 && areaAreaColIndex >= 0) {
          areaHeaderRowIndex = i;
          break;
        }
      }
      
      if (areaStoreNameColIndex >= 0 && areaAreaColIndex >= 0) {
        // 데이터 행 파싱
        for (let i = (areaHeaderRowIndex >= 0 ? areaHeaderRowIndex + 1 : 1); i < areaRawData.length; i++) {
          const row = areaRawData[i];
          if (!row || !Array.isArray(row)) continue;
          
          const storeName = String(row[areaStoreNameColIndex] || '').trim();
          const area = String(row[areaAreaColIndex] || '').trim();
          
          if (storeName && area && storeName !== '매장명' && area !== '상권구분' && storeName !== '' && area !== '') {
            storeAreaMap.set(storeName, area);
          }
        }
        console.log(`✅ 상권구분 매핑 완료: ${storeAreaMap.size}개 매장`);
      } else {
        console.log('⚠️  상권구분 시트에서 매장명 또는 상권구분 컬럼을 찾을 수 없습니다.');
      }
    }
    
    // 4. DC율 시트에서 매장별 실적 데이터 읽기
    const dcRawData = jsonData.data[dcSheetName].raw || jsonData.data[dcSheetName];
    
    if (!dcRawData || !Array.isArray(dcRawData) || dcRawData.length === 0) {
      console.log('⚠️  DC율 시트 데이터가 비어있습니다.');
      return [];
    }
    
    console.log(`📊 DC율 시트 데이터 파싱 시작: ${dcRawData.length}행`);
    
    // 처음 5행 출력하여 구조 확인
    console.log('📋 DC율 시트 처음 5행 미리보기:');
    for (let i = 0; i < Math.min(5, dcRawData.length); i++) {
      const row = dcRawData[i];
      if (row && Array.isArray(row)) {
        console.log(`   행 ${i + 1}:`, row.slice(0, 10).map((cell, idx) => `[${String.fromCharCode(65 + idx)}]${cell}`).join(', '));
      }
    }
    
    // DC율 시트 헤더 행 찾기
    let dcHeaderRowIndex = -1;
    let dcStoreNameColIndex = -1;
    let realPriceColIndex = -1;  // 실판가 (25년)
    let tagPriceColIndex = -1;   // 택가 (25년)
    let lastYearRealPriceColIndex = -1;  // 실판가 (24년)
    let lastYearTagPriceColIndex = -1;   // 택가 (24년)
    let dcRateColIndex = -1;      // DC율
    let lastYearDcRateColIndex = -1; // 전년DC율
    let differenceColIndex = -1;  // 전년대비차이
    
    // 헤더 행 찾기 (처음 10행까지 검색)
    for (let i = 0; i < Math.min(10, dcRawData.length); i++) {
      const row = dcRawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      let foundCount = 0;
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim();
        const cellLower = cell.toLowerCase();
        
        if (cell.includes('매장명') || cell.includes('매장') || cell.includes('Store') || cell.includes('store')) {
          dcStoreNameColIndex = j;
          foundCount++;
        }
        // 25년 실판가/택가
        if ((cell.includes('실판가') || cellLower.includes('real') || cellLower.includes('actual') || cell.includes('판가')) && !cell.includes('24') && !cell.includes('전년')) {
          realPriceColIndex = j;
          foundCount++;
        }
        if ((cell.includes('택가') || cellLower.includes('tag') || cellLower.includes('list') || cell.includes('정가')) && !cell.includes('24') && !cell.includes('전년')) {
          tagPriceColIndex = j;
          foundCount++;
        }
        // 24년 실판가/택가 - E열(인덱스 4), F열(인덱스 5) 확인
        if (j === 4 && (cell.includes('실판가') || cellLower.includes('real') || cellLower.includes('actual') || cell.includes('판가') || cell.includes('24'))) {
          lastYearRealPriceColIndex = j;
          foundCount++;
        }
        if (j === 5 && (cell.includes('택가') || cellLower.includes('tag') || cellLower.includes('list') || cell.includes('정가') || cell.includes('24'))) {
          lastYearTagPriceColIndex = j;
          foundCount++;
        }
        // E열, F열이 아니더라도 24년 키워드가 있으면 사용
        if (lastYearRealPriceColIndex < 0 && (cell.includes('실판가') || cellLower.includes('real') || cellLower.includes('actual') || cell.includes('판가')) && (cell.includes('24') || cell.includes('전년'))) {
          lastYearRealPriceColIndex = j;
          foundCount++;
        }
        if (lastYearTagPriceColIndex < 0 && (cell.includes('택가') || cellLower.includes('tag') || cellLower.includes('list') || cell.includes('정가')) && (cell.includes('24') || cell.includes('전년'))) {
          lastYearTagPriceColIndex = j;
          foundCount++;
        }
        if ((cell.includes('DC율') || cell.includes('DC') || cell.includes('할인율')) && !cell.includes('전년') && !cell.includes('24')) {
          dcRateColIndex = j;
          foundCount++;
        }
        if (cell.includes('전년DC') || (cell.includes('전년') && (cell.includes('DC') || cell.includes('할인'))) || (cell.includes('24') && (cell.includes('DC') || cell.includes('할인')))) {
          lastYearDcRateColIndex = j;
          foundCount++;
        }
        if (cell.includes('전년대비') || cell.includes('차이') || cell.includes('변화') || cellLower.includes('diff')) {
          differenceColIndex = j;
          foundCount++;
        }
      }
      
      // 3개 이상의 컬럼을 찾으면 헤더 행으로 간주
      if (foundCount >= 3) {
        dcHeaderRowIndex = i;
        break;
      }
    }
    
    if (dcStoreNameColIndex < 0) {
      console.log('⚠️  DC율 시트에서 매장명 컬럼을 찾을 수 없습니다.');
      return [];
    }
    
    // E열(인덱스 4), F열(인덱스 5)이 24년 데이터인지 확인
    if (lastYearRealPriceColIndex < 0 && dcHeaderRowIndex >= 0) {
      const headerRow = dcRawData[dcHeaderRowIndex];
      if (headerRow && Array.isArray(headerRow) && headerRow[4]) {
        const eColCell = String(headerRow[4] || '').trim();
        if (eColCell.includes('24') || eColCell.includes('전년') || eColCell.includes('실판가') || eColCell.includes('판가')) {
          lastYearRealPriceColIndex = 4;
          console.log(`✅ E열(인덱스 4)을 24년 실판가로 인식: "${eColCell}"`);
        }
      }
    }
    if (lastYearTagPriceColIndex < 0 && dcHeaderRowIndex >= 0) {
      const headerRow = dcRawData[dcHeaderRowIndex];
      if (headerRow && Array.isArray(headerRow) && headerRow[5]) {
        const fColCell = String(headerRow[5] || '').trim();
        if (fColCell.includes('24') || fColCell.includes('전년') || fColCell.includes('택가') || fColCell.includes('정가')) {
          lastYearTagPriceColIndex = 5;
          console.log(`✅ F열(인덱스 5)을 24년 택가로 인식: "${fColCell}"`);
        }
      }
    }
    
    console.log(`✅ DC율 시트 컬럼 인덱스: 매장명=${dcStoreNameColIndex}, 실판가(25년)=${realPriceColIndex >= 0 ? realPriceColIndex : '없음'}, 택가(25년)=${tagPriceColIndex >= 0 ? tagPriceColIndex : '없음'}, 실판가(24년)=E열(4), 택가(24년)=F열(5), DC율=${dcRateColIndex >= 0 ? dcRateColIndex : '없음'}, 전년DC율=G열(6), 전년대비차이=${differenceColIndex >= 0 ? differenceColIndex : '없음'}`);
    
    // 숫자 파싱 헬퍼
    const parseNumeric = (val: any): number => {
      if (val == null || val === '') return 0;
      if (typeof val === 'number') return val;
      const str = String(val).replace(/[^0-9.-]/g, '');
      return parseFloat(str) || 0;
    };
    
    // 5. DC율 시트에서 매장별 실적 데이터 읽기 및 상권구분과 합치기
    const dcRateDataMap = new Map<string, any>(); // 매장명 -> DC율 데이터
    
    console.log(`📊 데이터 행 파싱 시작 (헤더 행: ${dcHeaderRowIndex + 1}행)`);
    
    for (let i = (dcHeaderRowIndex >= 0 ? dcHeaderRowIndex + 1 : 1); i < dcRawData.length; i++) {
      const row = dcRawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const storeName = String(row[dcStoreNameColIndex] || '').trim();
      
      if (!storeName || storeName === '매장명' || storeName === '') {
        continue;
      }
      
      // 실판가, 택가, DC율, 전년DC율, 전년대비차이 추출
      const realPrice = realPriceColIndex >= 0 ? parseNumeric(row[realPriceColIndex]) : undefined; // 25년 실판가
      const tagPrice = tagPriceColIndex >= 0 ? parseNumeric(row[tagPriceColIndex]) : undefined; // 25년 택가
      // 24년 데이터: E열(인덱스 4) = 실판가, F열(인덱스 5) = 택가
      const lastYearRealPrice = parseNumeric(row[4]); // E열: 24년 실판가
      const lastYearTagPrice = parseNumeric(row[5]); // F열: 24년 택가
      const dcRate = dcRateColIndex >= 0 ? parseNumeric(row[dcRateColIndex]) : undefined;
      // 전년 DC율: G열(인덱스 6)에서 직접 읽기
      const lastYearDcRateRaw = row[6]; // G열 원본 값
      const lastYearDcRate = parseNumeric(lastYearDcRateRaw); // G열: 전년 DC율
      let difference = differenceColIndex >= 0 ? parseNumeric(row[differenceColIndex]) : undefined;
      
      // 디버깅: 처음 3개 매장의 G열 값 확인
      if (dcRateDataMap.size < 3) {
        console.log(`   매장 ${dcRateDataMap.size + 1}: ${storeName} - G열(인덱스 6) 원본값="${lastYearDcRateRaw}", 파싱값=${lastYearDcRate}`);
      }
      
      // DC율 계산: (택가 - 실판가) / 택가 * 100 (25년)
      let calculatedDcRate = dcRate;
      if (calculatedDcRate === undefined && realPrice !== undefined && tagPrice !== undefined && tagPrice > 0) {
        calculatedDcRate = ((tagPrice - realPrice) / tagPrice) * 100;
      }
      
      // 전년 DC율은 G열에서 직접 읽은 값 사용 (계산하지 않음)
      const calculatedLastYearDcRate = lastYearDcRate !== undefined && !isNaN(lastYearDcRate) && lastYearDcRate > 0 ? lastYearDcRate : undefined;
      
      // 전년대비차이가 없으면 계산 (DC율 - 전년DC율)
      if (difference === undefined && calculatedDcRate !== undefined && calculatedLastYearDcRate !== undefined) {
        difference = calculatedDcRate - calculatedLastYearDcRate;
      }
      
      dcRateDataMap.set(storeName, {
        realPrice: realPrice !== undefined && realPrice > 0 ? realPrice : undefined,
        tagPrice: tagPrice !== undefined && tagPrice > 0 ? tagPrice : undefined,
        dcRate: calculatedDcRate !== undefined && !isNaN(calculatedDcRate) ? calculatedDcRate : undefined,
        lastYearDcRate: calculatedLastYearDcRate !== undefined && !isNaN(calculatedLastYearDcRate) && calculatedLastYearDcRate > 0 ? calculatedLastYearDcRate : undefined,
        difference: difference !== undefined && !isNaN(difference) ? difference : undefined
      });
      
      // 디버깅: 처음 3개 매장의 최종 데이터 확인
      if (dcRateDataMap.size <= 3) {
        const finalData = dcRateDataMap.get(storeName);
        console.log(`   최종 데이터: ${storeName}`, {
          realPrice: finalData.realPrice,
          tagPrice: finalData.tagPrice,
          dcRate: finalData.dcRate,
          lastYearDcRate: finalData.lastYearDcRate,
          difference: finalData.difference
        });
      }
    }
    
    console.log(`✅ DC율 데이터 파싱 완료: ${dcRateDataMap.size}개 매장`);
    
    // 6. 상권구분과 DC율 데이터 합치기
    const areaMap = new Map<string, any[]>();
    
    // 상권구분 시트의 매장 목록을 기준으로 DC율 데이터를 합침
    storeAreaMap.forEach((area, storeName) => {
      const dcData = dcRateDataMap.get(storeName);
      
      if (!areaMap.has(area)) {
        areaMap.set(area, []);
      }
      
      areaMap.get(area)!.push({
        storeName,
        realPrice: dcData?.realPrice,
        tagPrice: dcData?.tagPrice,
        dcRate: dcData?.dcRate,
        lastYearDcRate: dcData?.lastYearDcRate,
        difference: dcData?.difference
      });
    });
    
    // DC율 시트에만 있고 상권구분 시트에 없는 매장도 추가 (상권구분이 없는 경우)
    dcRateDataMap.forEach((dcData, storeName) => {
      if (!storeAreaMap.has(storeName)) {
        const unknownArea = '기타';
        if (!areaMap.has(unknownArea)) {
          areaMap.set(unknownArea, []);
        }
        areaMap.get(unknownArea)!.push({
          storeName,
          realPrice: dcData.realPrice,
          tagPrice: dcData.tagPrice,
          dcRate: dcData.dcRate,
          lastYearDcRate: dcData.lastYearDcRate,
          difference: dcData.difference
        });
      }
    });
    
    // 상권별로 정렬하여 배열로 변환
    const result = Array.from(areaMap.entries())
      .map(([area, stores]) => ({
        area,
        stores: stores.sort((a, b) => {
          // 실판가 기준 내림차순 정렬
          const aRealPrice = a.realPrice || 0;
          const bRealPrice = b.realPrice || 0;
          if (aRealPrice !== bRealPrice) {
            return bRealPrice - aRealPrice; // 내림차순
          }
          // 실판가가 같으면 매장명 기준 오름차순
          return a.storeName.localeCompare(b.storeName);
        })
      }))
      .sort((a, b) => a.area.localeCompare(b.area));
    
    console.log(`✅ 매장별 DC율 데이터 파싱 완료: ${result.length}개 상권, ${result.reduce((sum, r) => sum + r.stores.length, 0)}개 매장`);
    
    // 샘플 데이터 출력 (처음 3개 매장)
    if (result.length > 0 && result[0].stores.length > 0) {
      console.log('📊 샘플 데이터 (첫 번째 상권의 처음 3개 매장):');
      result[0].stores.slice(0, 3).forEach((store, idx) => {
        console.log(`   ${idx + 1}. ${store.storeName}:`, {
          realPrice: store.realPrice,
          tagPrice: store.tagPrice,
          dcRate: store.dcRate,
          lastYearDcRate: store.lastYearDcRate,
          difference: store.difference
        });
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('매장별 DC율 데이터 파싱 실패:', error);
    return [];
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
function convertExcelToDashboard(rawData: any[], sheetName: string, summaryData?: any, monthlyData?: any[], weeklyData?: any[], storeByArea?: any, uploadKpiData?: any, storeDCRate?: any[]) {
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

  // 요약 시트의 KPI 값 추출
  // 우선순위: 1) upload 시트, 2) 상권별 SUM 행, 3) 요약 시트 SUM 행
  let salesTarget = 0;
  let forecast = 0;
  let forecastAchievementRateValue = 0;
  let lastYear = 0;
  let periodPerformance = 0;
  let lastYearPeriod = 0;
  let periodGrowthRate = 0;
  
  // 1순위: upload 시트에서 KPI 데이터 추출
  if (uploadKpiData && (uploadKpiData.salesTarget > 0 || uploadKpiData.periodPerformance > 0)) {
    salesTarget = uploadKpiData.salesTarget || 0;
    forecast = uploadKpiData.forecast || 0;
    periodPerformance = uploadKpiData.periodPerformance || 0;
    lastYearPeriod = uploadKpiData.lastYearPeriod || 0;
    periodGrowthRate = uploadKpiData.periodGrowthRate || 0;
    forecastAchievementRateValue = uploadKpiData.forecastAchievementRate || 0;
    
    console.log('✅ upload 시트에서 KPI 추출:', {
      salesTarget,
      forecast,
      periodPerformance,
      lastYearPeriod,
      periodGrowthRate,
      forecastAchievementRateValue
    });
  }
  // 2순위: 상권별 데이터에서 SUM 행 찾기 (KPI 데이터)
  else if (summaryData?.byArea && summaryData.byArea.length > 0) {
    const areaData = summaryData.byArea;
    console.log('📊 상권별 데이터에서 SUM 행 찾기:', areaData.length, '개 항목');
    
    // SUM 행 찾기 (KPI 데이터로 사용)
    const sumRow = areaData.find((item: any) => item.name === 'SUM');
    if (sumRow) {
      salesTarget = sumRow.target || sumRow.novemberTarget || 0;
      forecast = sumRow.forecast || sumRow.salesFCST || 0;
      periodPerformance = sumRow.periodPerformance || sumRow.actualMTD || 0;
      lastYearPeriod = sumRow.lastYearPeriod || sumRow.lyActual || 0;
      periodGrowthRate = sumRow.periodGrowthRate || 0;
      forecastAchievementRateValue = sumRow.forecastAchievementRate || 0;
      
      console.log('✅ SUM 행에서 KPI 추출:', {
        salesTarget,
        forecast,
        periodPerformance,
        lastYearPeriod,
        periodGrowthRate,
        forecastAchievementRateValue
      });
    } else {
      console.log('⚠️  SUM 행을 찾을 수 없습니다. 상권별 데이터:', areaData.map((item: any) => item.name));
    }
  }
  
  // 3순위: 상권별 데이터가 없으면 요약 시트 SUM 행 데이터 사용
  if (salesTarget === 0 && periodPerformance === 0) {
    salesTarget = (summaryData?.salesTarget?.[0]?.value ?? 0) as number; // H7
    forecast = (summaryData?.forecast?.[0]?.value ?? 0) as number; // I7
    forecastAchievementRateValue = (summaryData?.forecastAchievementRate?.[0]?.value ?? 0) as number; // J7
    lastYear = (summaryData?.lastYear?.[0]?.value ?? 0) as number; // K7
    periodPerformance = (summaryData?.periodPerformance?.[0]?.value ?? 0) as number; // Q7
    lastYearPeriod = (summaryData?.lastYearPeriod?.[0]?.value ?? 0) as number; // R7
    periodGrowthRate = (summaryData?.periodGrowthRate?.[0]?.value ?? 0) as number; // S7
    
    console.log('⚠️  상권별 데이터 없음, SUM 행 데이터 사용');
  }
  
  console.log('🔍 KPI 데이터 추출:', {
    salesTarget,
    forecast,
    forecastAchievementRateValue,
    periodPerformance,
    lastYearPeriod,
    periodGrowthRate,
    summaryDataExists: !!summaryData,
    summaryDataKeys: summaryData ? Object.keys(summaryData) : [],
  });
  
  // 계산된 값들 (데이터가 없을 경우 계산)
  // forecastAchievementRateValue가 0보다 크면 사용, 아니면 계산
  const calculatedForecastAchievementRate = forecastAchievementRateValue > 0 
    ? forecastAchievementRateValue 
    : (salesTarget > 0 ? ((forecast / salesTarget) * 100) : 0);
  
  // periodGrowthRate가 0보다 크면 사용, 아니면 계산
  const calculatedGrowthRate = periodGrowthRate !== 0 && periodGrowthRate !== null && periodGrowthRate !== undefined
    ? periodGrowthRate 
    : (lastYearPeriod > 0 ? (((periodPerformance - lastYearPeriod) / lastYearPeriod) * 100) : 0);
  
  console.log('📊 계산된 KPI 값:', {
    calculatedForecastAchievementRate,
    calculatedGrowthRate,
    salesTargetFormatted: formatCurrency(salesTarget),
    forecastFormatted: formatCurrency(forecast),
    periodPerformanceFormatted: formatCurrency(periodPerformance),
  });
  
  const data = {
    kpis: {
      salesTarget: {
        value: formatBillion(salesTarget),
        change: calculatedForecastAchievementRate.toFixed(1) + '% 달성 예상',
        trend: calculatedForecastAchievementRate >= 100 ? "up" as const : "down" as const,
      },
      periodPerformance: {
        value: formatBillion(periodPerformance),
        change: '실적',
        trend: periodPerformance >= salesTarget ? "up" as const : "down" as const,
      },
      lastYearPeriod: {
        value: formatBillion(lastYearPeriod),
        change: '전년실적',
        trend: "up" as const,
      },
      periodGrowthRate: {
        value: calculatedGrowthRate.toFixed(1) + '%',
        change: '전년비',
        trend: calculatedGrowthRate >= 0 ? "up" as const : "down" as const,
      },
      forecast: {
        value: formatBillion(forecast),
        change: calculatedForecastAchievementRate.toFixed(1) + '% 달성률',
        trend: calculatedForecastAchievementRate >= 100 ? "up" as const : "down" as const,
      },
      forecastAchievementRate: {
        value: calculatedForecastAchievementRate.toFixed(1) + '%',
        change: '예상달성율',
        trend: calculatedForecastAchievementRate >= 100 ? "up" as const : "down" as const,
      },
    },
    monthlySales: monthlySales.length > 0 ? monthlySales : getDefaultData().monthlySales,
    weeklySales: weeklyData || [],
    regionalTargets: regionalData.length > 0 ? regionalData : getDefaultData().regionalTargets,
    recentSales: salesData.length > 0 ? salesData : getDefaultData().recentSales,
    forecast: forecastData.length > 0 ? forecastData : undefined,
    summarySheet: summaryData || undefined,
    storeByArea: storeByArea || {},
    storeDCRate: storeDCRate || [],
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
 * 숫자를 억원 단위로 변환
 */
function formatBillion(value: number): string {
  if (!value || value === 0) return '0.0';
  const billion = (value / 100000000).toFixed(1);
  return `${billion}억원`;
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

