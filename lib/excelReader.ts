import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ExcelData {
  [key: string]: any[];
}

/**
 * 엑셀 파일을 읽어서 JSON 데이터로 변환
 * @param filename - 엑셀 파일명 (예: "ending focast.xlsx")
 * @returns 시트별 데이터 객체
 */
export function readExcelFile(filename: string): ExcelData {
  try {
    // 프로젝트 루트에서 파일 경로 설정
    const filePath = join(process.cwd(), filename);
    
    // 파일 읽기
    const file = readFileSync(filePath);
    
    // 엑셀 파일 파싱
    const workbook = XLSX.read(file, { type: 'buffer' });
    
    const result: ExcelData = {};
    
    // 모든 시트 읽기
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      // 시트를 JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      result[sheetName] = jsonData;
    });
    
    return result;
  } catch (error) {
    console.error('엑셀 파일 읽기 오류:', error);
    throw new Error(`엑셀 파일을 읽을 수 없습니다: ${filename}`);
  }
}

/**
 * 엑셀 데이터를 대시보드 형식으로 변환
 */
export function transformExcelToDashboard(excelData: ExcelData) {
  // 첫 번째 시트 가져오기 (또는 특정 시트 이름 지정)
  const sheetName = Object.keys(excelData)[0];
  const data = excelData[sheetName];
  
  console.log('엑셀 데이터 구조:', {
    sheetName,
    rowCount: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    sampleRow: data[0]
  });
  
  return {
    rawData: data,
    sheetName,
    rowCount: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : []
  };
}


