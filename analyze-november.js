const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 ===== backdata.xlsx "11월 실적" 시트 분석 =====\n');

try {
  const filePath = path.join(process.cwd(), 'backdata.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ backdata.xlsx 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  const file = fs.readFileSync(filePath);
  const workbook = XLSX.read(file, { type: 'buffer' });

  console.log('📋 발견된 시트:', workbook.SheetNames.join(', '));
  console.log('');

  // "11월 실적" 시트 찾기
  const novemberSheetNames = ['11월 실적', '11월실적', 'November', 'november'];
  let sheetName = workbook.SheetNames.find(name =>
    novemberSheetNames.includes(name) ||
    name.includes('11월')
  );

  if (!sheetName) {
    console.log('⚠️  "11월 실적" 시트를 찾을 수 없습니다.');
    console.log('💡 사용 가능한 시트:', workbook.SheetNames.join(', '));
    process.exit(1);
  }

  console.log(`✅ "${sheetName}" 시트 선택됨\n`);

  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 총 ${rawData.length}행 발견\n`);

  if (rawData.length === 0) {
    console.log('❌ 데이터가 비어 있습니다.');
    process.exit(1);
  }

  // 첫 번째 행 구조 분석
  console.log('📋 컬럼 구조:');
  const columns = Object.keys(rawData[0]);
  columns.forEach((col, idx) => {
    const sampleValue = rawData[0][col];
    console.log(`   ${idx + 1}. "${col}": ${sampleValue}`);
  });
  console.log('');

  // 샘플 데이터 출력 (처음 5개 매장)
  console.log('📊 샘플 데이터 (처음 5개):');
  rawData.slice(0, 5).forEach((row, idx) => {
    console.log(`\n   === ${idx + 1}번째 매장 ===`);
    Object.keys(row).forEach(key => {
      console.log(`   ${key}: ${row[key]}`);
    });
  });

  // 25년 11월, 24년 11월 컬럼 찾기
  const year25Columns = columns.filter(col => 
    col.includes('25') || col.includes('2025')
  );
  const year24Columns = columns.filter(col => 
    col.includes('24') || col.includes('2024')
  );

  console.log('\n\n🔍 컬럼 분석:');
  console.log('   25년 관련 컬럼:', year25Columns.join(', '));
  console.log('   24년 관련 컬럼:', year24Columns.join(', '));
  console.log('');

  // 매장명 컬럼 찾기
  const storeColumn = columns.find(col => 
    col.includes('매장') || 
    col.includes('점포') || 
    col.toLowerCase().includes('store')
  );

  console.log(`📍 매장명 컬럼: "${storeColumn}"\n`);

  // 통계 정보
  console.log('📈 통계:');
  console.log(`   총 매장 수: ${rawData.length}개`);
  
  if (storeColumn) {
    const uniqueStores = new Set(rawData.map(row => row[storeColumn]));
    console.log(`   고유 매장 수: ${uniqueStores.size}개`);
  }

  // JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'november-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    sheetName,
    totalRows: rawData.length,
    columns,
    year25Columns,
    year24Columns,
    storeColumn,
    sampleData: rawData.slice(0, 10) // 첫 10개만 저장
  }, null, 2));

  console.log(`\n✅ 분석 완료!`);
  console.log(`📄 상세 분석 결과: ${outputPath}`);

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error(error.stack);
  process.exit(1);
}

