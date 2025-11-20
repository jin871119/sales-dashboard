const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('파일 읽기 테스트');
console.log('========================================');
console.log();

console.log('현재 작업 디렉토리:', process.cwd());
console.log();

try {
  // 루트 디렉토리의 파일 목록
  const files = fs.readdirSync(process.cwd());
  const xlsxFiles = files.filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
  
  console.log('모든 xlsx 파일:');
  xlsxFiles.forEach(f => console.log('  -', f));
  console.log();
  
  // 일주월별 판매 파일 찾기
  const targetFile = files.find(f => 
    f.startsWith('mw_일주월별_판매') && 
    f.endsWith('.xlsx') && 
    !f.startsWith('~$')
  );
  
  if (targetFile) {
    console.log('✅ 찾은 파일:', targetFile);
    const filePath = path.join(process.cwd(), targetFile);
    console.log('✅ 전체 경로:', filePath);
    
    // 파일 존재 확인
    if (fs.existsSync(filePath)) {
      console.log('✅ 파일 존재 확인됨');
      
      // 파일 정보
      const stats = fs.statSync(filePath);
      console.log('✅ 파일 크기:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('✅ 수정 시간:', stats.mtime);
      
      // xlsx 라이브러리로 읽기 시도
      console.log();
      console.log('xlsx 라이브러리로 읽기 시도...');
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      console.log('✅ 성공! 시트:', workbook.SheetNames.join(', '));
    } else {
      console.log('❌ 파일이 존재하지 않음');
    }
  } else {
    console.log('❌ mw_일주월별_판매 파일을 찾을 수 없음');
    console.log();
    console.log('사용 가능한 파일:');
    files.filter(f => f.includes('일주월별') || f.includes('판매')).forEach(f => {
      console.log('  -', f);
    });
  }
} catch (error) {
  console.error('❌ 오류:', error.message);
  console.error(error.stack);
}

console.log();
console.log('========================================');

