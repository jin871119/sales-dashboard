const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 ===== backdata.xlsx "상권구분" 시트 분석 =====\n');

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

  // "상권구분" 시트 찾기
  const storeAreaSheetNames = ['상권구분', '매장상권', 'Store Area', 'store_area'];
  let sheetName = workbook.SheetNames.find(name =>
    storeAreaSheetNames.includes(name) ||
    name.includes('상권') ||
    name.includes('매장')
  );

  if (!sheetName) {
    console.log('⚠️  "상권구분" 시트를 찾을 수 없습니다.');
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
  console.log('📋 컬럼 구조 (첫 번째 행):');
  const columns = Object.keys(rawData[0]);
  columns.forEach((col, idx) => {
    const sampleValue = rawData[0][col];
    console.log(`   ${idx + 1}. ${col}: ${sampleValue}`);
  });
  console.log('');

  // 상권별로 그룹화
  const areaGroups = {};
  rawData.forEach(row => {
    // 상권 컬럼 찾기 (여러 가능한 컬럼명 시도)
    const areaColumn = columns.find(col => 
      col.includes('상권') || 
      col.includes('구분') || 
      col.toLowerCase().includes('area') ||
      col.toLowerCase().includes('type')
    );
    
    if (areaColumn && row[areaColumn]) {
      const area = String(row[areaColumn]).trim();
      if (!areaGroups[area]) {
        areaGroups[area] = [];
      }
      areaGroups[area].push(row);
    }
  });

  console.log('🏢 상권별 매장 수:');
  Object.keys(areaGroups).forEach(area => {
    console.log(`   ${area}: ${areaGroups[area].length}개 매장`);
  });
  console.log('');

  // 각 상권의 샘플 데이터 출력
  console.log('📊 각 상권의 샘플 매장 (최대 3개):');
  Object.keys(areaGroups).forEach(area => {
    console.log(`\n   === ${area} ===`);
    const stores = areaGroups[area].slice(0, 3);
    stores.forEach((store, idx) => {
      console.log(`   ${idx + 1}. 매장:`, JSON.stringify(store, null, 2).replace(/\n/g, '\n      '));
    });
    if (areaGroups[area].length > 3) {
      console.log(`   ... 외 ${areaGroups[area].length - 3}개 매장`);
    }
  });

  // JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'store-area-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    sheetName,
    totalRows: rawData.length,
    columns,
    areaGroups,
    rawData: rawData.slice(0, 10) // 첫 10개만 저장
  }, null, 2));

  console.log(`\n✅ 분석 완료!`);
  console.log(`📄 상세 분석 결과: ${outputPath}`);

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

