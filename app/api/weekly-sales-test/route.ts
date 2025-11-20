import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    console.log('=== API 테스트 시작 ===');
    
    const rootDir = process.cwd();
    console.log('1. 현재 디렉토리:', rootDir);
    
    const files = fs.readdirSync(rootDir);
    const xlsxFiles = files.filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    console.log('2. xlsx 파일들:', xlsxFiles);
    
    const targetFile = files.find(f => 
      f.startsWith('mw_일주월별_판매') && 
      f.endsWith('.xlsx') && 
      !f.startsWith('~$')
    );
    console.log('3. 찾은 파일:', targetFile);
    
    if (!targetFile) {
      return NextResponse.json({
        success: false,
        error: '파일을 찾을 수 없음',
        cwd: rootDir,
        xlsxFiles
      });
    }
    
    const filePath = path.join(rootDir, targetFile);
    console.log('4. 전체 경로:', filePath);
    
    const exists = fs.existsSync(filePath);
    console.log('5. 파일 존재:', exists);
    
    if (!exists) {
      return NextResponse.json({
        success: false,
        error: '파일이 존재하지 않음',
        filePath
      });
    }
    
    const stats = fs.statSync(filePath);
    console.log('6. 파일 크기:', stats.size);
    
    // xlsx 라이브러리 테스트
    console.log('7. xlsx 라이브러리 로드 시도...');
    const XLSX = require('xlsx');
    console.log('8. xlsx 라이브러리 로드 성공');
    
    console.log('9. 파일 읽기 시도...');
    const workbook = XLSX.readFile(filePath);
    console.log('10. 파일 읽기 성공!');
    console.log('11. 시트:', workbook.SheetNames);
    
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log('12. 데이터 행 수:', data.length);
    
    return NextResponse.json({
      success: true,
      message: '모든 테스트 통과!',
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
      stack: error.stack
    }, { status: 500 });
  }
}

