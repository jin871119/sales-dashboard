const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('\n📊 backdata.xlsx 분석 시작...\n');

try {
  const filePath = path.join(process.cwd(), 'backdata.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ backdata.xlsx 파일을 찾을 수 없습니다!');
    console.log('\n💡 해결방법:');
    console.log('   1. backdata.xlsx 파일이 프로젝트 폴더에 있는지 확인하세요');
    console.log('   2. 파일명이 정확한지 확인하세요 (대소문자, 공백 등)');
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  
  console.log('✅ 파일 로드 성공!\n');
  console.log('📋 시트 목록:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  console.log('');

  // "월별목표" 시트 찾기
  const monthlySheetNames = ['월별목표', '월별', 'Monthly', 'monthly'];
  let targetSheet = workbook.SheetNames.find(name => 
    monthlySheetNames.includes(name) || 
    name.includes('월별') || 
    name.includes('목표')
  );

  if (!targetSheet) {
    console.log('⚠️  "월별목표" 시트를 찾을 수 없습니다. 첫 번째 시트를 분석합니다.');
    targetSheet = workbook.SheetNames[0];
  }

  console.log(`🔍 "${targetSheet}" 시트 분석 중...\n`);

  const worksheet = workbook.Sheets[targetSheet];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 총 ${data.length}행의 데이터가 있습니다.\n`);

  if (data.length > 0) {
    console.log('📋 컬럼 목록:');
    const columns = Object.keys(data[0]);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col}`);
    });
    console.log('');

    console.log('📊 데이터 미리보기 (처음 5행):');
    console.log('─'.repeat(80));
    data.slice(0, 5).forEach((row, index) => {
      console.log(`\n${index + 1}번째 행:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    });
    console.log('\n' + '─'.repeat(80));
  }

  // 분석 결과를 JSON 파일로 저장
  const analysis = {
    fileName: 'backdata.xlsx',
    sheetNames: workbook.SheetNames,
    targetSheet: targetSheet,
    totalRows: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    sampleData: data.slice(0, 5),
    analyzedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    'backdata-analysis.json',
    JSON.stringify(analysis, null, 2),
    'utf8'
  );

  console.log('\n✅ 분석 완료!');
  console.log('📄 분석 결과가 backdata-analysis.json 파일에 저장되었습니다.');
  console.log('\n💡 다음 단계:');
  console.log('   1. backdata-analysis.json 파일을 열어서 데이터 구조를 확인하세요');
  console.log('   2. npm run dev 명령으로 서버를 시작하세요');
  console.log('');

} catch (error) {
  console.error('\n❌ 오류 발생:', error.message);
  console.log('\n💡 해결방법:');
  console.log('   1. xlsx 패키지를 설치하세요: npm install xlsx');
  console.log('   2. backdata.xlsx 파일이 열려있다면 닫으세요');
  console.log('   3. 파일이 손상되지 않았는지 확인하세요');
  console.log('');
  process.exit(1);
}


