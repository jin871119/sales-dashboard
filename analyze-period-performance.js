const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 ===== ending focast.xlsx "요약" 시트 기간실적 분석 =====\n');

try {
  const filePath = path.join(process.cwd(), 'ending focast.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ ending focast.xlsx 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  const file = fs.readFileSync(filePath);
  const workbook = XLSX.read(file, { type: 'buffer' });

  console.log('📋 발견된 시트:', workbook.SheetNames.join(', '));
  console.log('');

  // "요약" 시트 찾기
  const summarySheetNames = ['요약', '요약시트', 'Summary', 'summary'];
  let sheetName = workbook.SheetNames.find(name =>
    summarySheetNames.includes(name) ||
    name.includes('요약')
  );

  if (!sheetName) {
    console.log('⚠️  "요약" 시트를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ "${sheetName}" 시트 선택됨\n`);

  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 총 ${rawData.length}행 발견\n`);

  // 7행 데이터 (인덱스 6) - 전체 합계 행
  const row7 = rawData[6];
  
  console.log('📋 7행 (전체 합계) 컬럼 구조:');
  console.log('─'.repeat(80));
  
  Object.keys(row7).forEach((key, index) => {
    const value = row7[key];
    console.log(`${index + 1}. "${key}": ${value}`);
  });
  
  console.log('\n');
  console.log('🔍 주요 컬럼 확인:');
  console.log('─'.repeat(80));
  
  // H, I, J, K, L 컬럼 찾기 (__EMPTY_7, __EMPTY_8, __EMPTY_9, __EMPTY_10, __EMPTY_11)
  const columnMapping = {
    'H (목표)': '__EMPTY_7',
    'I (예상마감)': '__EMPTY_8',
    'J (기간실적?)': '__EMPTY_9',
    'K (작년실적)': '__EMPTY_10',
    'L (?)': '__EMPTY_11'
  };
  
  Object.entries(columnMapping).forEach(([label, col]) => {
    const value = row7[col];
    if (value) {
      console.log(`${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
    } else {
      console.log(`${label}: (없음)`);
    }
  });
  
  console.log('\n');
  console.log('📊 전체 컬럼 (실제 값 포함):');
  console.log('─'.repeat(80));
  
  // 모든 __EMPTY 컬럼 출력
  const emptyColumns = Object.keys(row7).filter(key => key.startsWith('__EMPTY'));
  emptyColumns.forEach(col => {
    const index = parseInt(col.replace('__EMPTY_', '')) || 0;
    const excelCol = String.fromCharCode(65 + index + 1); // A=65, B=66...
    const value = row7[col];
    console.log(`컬럼 ${excelCol} (${col}): ${typeof value === 'number' ? value.toLocaleString() : value}`);
  });

  // JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'period-performance-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    sheetName,
    row7Data: row7,
    columns: Object.keys(row7)
  }, null, 2));

  console.log(`\n✅ 분석 완료!`);
  console.log(`📄 상세 분석 결과: ${outputPath}`);

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error(error.stack);
  process.exit(1);
}

