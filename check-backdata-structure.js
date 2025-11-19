const XLSX = require('xlsx');
const fs = require('fs');

console.log('\n📊 backdata.xlsx 파일 구조 상세 분석\n');
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile('backdata.xlsx');
  
  console.log('\n📋 시트 목록:');
  workbook.SheetNames.forEach((name, i) => {
    console.log(`   ${i + 1}. ${name}`);
  });
  
  // 첫 번째 시트 분석
  const firstSheetName = workbook.SheetNames[0];
  console.log(`\n🔍 "${firstSheetName}" 시트 상세 분석:\n`);
  
  const worksheet = workbook.Sheets[firstSheetName];
  
  // 원시 데이터로 읽기 (배열 형태)
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  console.log(`총 ${rawData.length}행\n`);
  console.log('처음 20행 전체 출력:\n');
  console.log('-'.repeat(80));
  
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    console.log(`\n행 ${i + 1}:`);
    
    if (row && row.length > 0) {
      row.forEach((cell, colIndex) => {
        if (cell !== '') {
          const colLetter = String.fromCharCode(65 + colIndex); // A, B, C, ...
          console.log(`   [${colLetter}${i + 1}] ${cell}`);
        }
      });
    } else {
      console.log('   (빈 행)');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💾 결과를 backdata-structure.txt 파일에 저장합니다...\n');
  
  // 결과를 파일로 저장
  let output = '=== backdata.xlsx 구조 분석 ===\n\n';
  output += `총 ${rawData.length}행\n\n`;
  output += '처음 50행:\n';
  output += '-'.repeat(80) + '\n';
  
  for (let i = 0; i < Math.min(50, rawData.length); i++) {
    const row = rawData[i];
    output += `\n행 ${i + 1}:\n`;
    
    if (row && row.length > 0) {
      row.forEach((cell, colIndex) => {
        if (cell !== '') {
          const colLetter = String.fromCharCode(65 + colIndex);
          output += `   [${colLetter}${i + 1}] ${cell}\n`;
        }
      });
    } else {
      output += '   (빈 행)\n';
    }
  }
  
  fs.writeFileSync('backdata-structure.txt', output, 'utf8');
  
  console.log('✅ 분석 완료!');
  console.log('📄 backdata-structure.txt 파일을 열어서 전체 구조를 확인하세요.\n');
  
} catch (error) {
  console.error('\n❌ 오류:', error.message);
  console.log('\n💡 해결방법:');
  console.log('   1. backdata.xlsx 파일이 프로젝트 폴더에 있는지 확인');
  console.log('   2. 파일이 열려있다면 닫기');
  console.log('   3. npm install xlsx 실행\n');
}


