const XLSX = require('xlsx');

try {
  console.log('📊 22행(백화점) 데이터 확인 중...\n');
  
  const workbook = XLSX.readFile('ending focast.xlsx');
  const sheetName = '요약';
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    console.log('❌ "요약" 시트를 찾을 수 없습니다.');
    process.exit(1);
  }
  
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`총 데이터 행 수: ${data.length}\n`);
  
  // 21행(인덱스 20) - TTL 확인
  console.log('=== 21행 (인덱스 20) - TTL ===');
  if (data[20]) {
    console.log('전체 데이터:', data[20]);
    console.log('__EMPTY_6:', data[20]['__EMPTY_6']);
    console.log('__EMPTY_7 (목표):', data[20]['__EMPTY_7']);
    console.log('__EMPTY_8 (예상):', data[20]['__EMPTY_8']);
  }
  console.log('');
  
  // 22행(인덱스 21) - 백화점 확인
  console.log('=== 22행 (인덱스 21) - 백화점? ===');
  if (data[21]) {
    console.log('전체 데이터:', data[21]);
    console.log('__EMPTY_6 (이름):', data[21]['__EMPTY_6']);
    console.log('__EMPTY_7 (목표):', data[21]['__EMPTY_7']);
    console.log('__EMPTY_8 (예상):', data[21]['__EMPTY_8']);
    console.log('__EMPTY_16 (기간실적):', data[21]['__EMPTY_16']);
  } else {
    console.log('❌ 22행(인덱스 21) 데이터가 없습니다.');
  }
  console.log('');
  
  // 23~27행도 확인
  console.log('=== 23~27행 (다른 유통별 항목들) ===');
  for (let i = 22; i <= 26 && i < data.length; i++) {
    const row = data[i];
    const name = row?.['__EMPTY_6'];
    const target = row?.['__EMPTY_7'];
    const forecast = row?.['__EMPTY_8'];
    console.log(`${i+1}행 (인덱스 ${i}): 이름="${name}", 목표=${target}, 예상=${forecast}`);
  }
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}





