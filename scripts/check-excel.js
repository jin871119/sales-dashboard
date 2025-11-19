// 엑셀 파일 구조 확인 스크립트
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'ending focast.xlsx');

try {
  console.log('📂 엑셀 파일 경로:', filePath);
  console.log('\n📊 엑셀 파일 읽는 중...\n');
  
  const workbook = XLSX.readFile(filePath);
  
  console.log('✅ 시트 목록:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  
  console.log('\n📋 각 시트의 데이터:\n');
  
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`📄 시트: "${sheetName}"`);
    console.log(`═══════════════════════════════════════`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`총 행 수: ${jsonData.length}`);
    
    if (jsonData.length > 0) {
      console.log('\n컬럼 목록:');
      Object.keys(jsonData[0]).forEach((col, i) => {
        console.log(`   ${i + 1}. ${col}`);
      });
      
      console.log('\n처음 3행 샘플 데이터:');
      jsonData.slice(0, 3).forEach((row, i) => {
        console.log(`\n   [행 ${i + 1}]`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      });
    } else {
      console.log('⚠️  시트가 비어있습니다.');
    }
  });
  
  console.log('\n\n✨ 완료!\n');
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}


