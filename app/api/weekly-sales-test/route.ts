import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    console.log('=== API 테스트 시작 ===');
    
    const rootDir = process.cwd();
    console.log('1. 현재 디렉토리:', rootDir);
    
    // 1. JSON 파일 먼저 확인 (프로덕션 환경용)
    const jsonPath = path.join(rootDir, 'public', 'weekly-sales-data.json');
    const jsonExists = fs.existsSync(jsonPath);
    console.log('2. JSON 파일 확인:', jsonPath, jsonExists);
    
    if (jsonExists) {
      console.log('3. JSON 파일 읽기 시도...');
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(jsonData) as any[][];
      const stats = fs.statSync(jsonPath);
      
      console.log('4. JSON 파일 읽기 성공!');
      console.log('5. 데이터 행 수:', data.length);
      
      return NextResponse.json({
        success: true,
        message: 'JSON 파일에서 데이터 로드 성공!',
        source: 'JSON',
        info: {
          cwd: rootDir,
          filePath: jsonPath,
          fileSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          totalRows: data.length,
          sampleRows: data.slice(0, 3)
        }
      });
    }
    
    // 2. 엑셀 파일 시도 (로컬 개발 환경용)
    console.log('3. JSON 파일 없음, 엑셀 파일 확인...');
    const files = fs.readdirSync(rootDir);
    const xlsxFiles = files.filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    console.log('4. xlsx 파일들:', xlsxFiles);
    
    const targetFile = files.find(f => 
      f.startsWith('mw_일주월별_판매') && 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$')
    );
    console.log('5. 찾은 파일:', targetFile);
    
    if (!targetFile) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없음 (JSON 및 엑셀 파일 모두 없음)',
        cwd: rootDir,
        xlsxFiles,
        jsonPath,
        suggestion: 'prepare-deploy.js를 실행하여 JSON 파일을 생성하세요.'
      });
    }
    
    const filePath = path.join(rootDir, targetFile);
    console.log('6. 전체 경로:', filePath);
    
    const exists = fs.existsSync(filePath);
    console.log('7. 파일 존재:', exists);
    
    if (!exists) {
      return NextResponse.json({
        success: false,
        error: '파일이 존재하지 않음',
        filePath,
        suggestion: 'prepare-deploy.js를 실행하여 JSON 파일을 생성하세요.'
      });
    }
    
    const stats = fs.statSync(filePath);
    console.log('8. 파일 크기:', stats.size);
    
    // xlsx 라이브러리 테스트
    console.log('9. xlsx 라이브러리 로드 시도...');
    const XLSX = require('xlsx');
    console.log('10. xlsx 라이브러리 로드 성공');
    
    console.log('11. 파일 읽기 시도...');
    const workbook = XLSX.readFile(filePath);
    console.log('12. 파일 읽기 성공!');
    console.log('13. 시트:', workbook.SheetNames);
    
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log('14. 데이터 행 수:', data.length);
    
    return NextResponse.json({
      success: true,
      message: '엑셀 파일에서 데이터 로드 성공!',
      source: 'Excel',
      info: {
        cwd: rootDir,
        fileName: targetFile,
        filePath,
        fileSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        sheets: workbook.SheetNames,
        totalRows: data.length
      }
    });
    
  } catch (error: any) {
    console.error('=== API 테스트 오류 ===');
    console.error(error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestion: '프로덕션 환경에서는 JSON 파일을 사용하세요. prepare-deploy.js를 실행하세요.'
    }, { status: 500 });
  }
}

