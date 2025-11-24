// ending-focast.json의 요약 시트 7행 데이터 확인
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = process.cwd();
const jsonPath = path.join(rootDir, 'public', 'ending-focast.json');

console.log('='.repeat(80));
console.log('ending-focast.json 요약 시트 7행 데이터 확인');
console.log('='.repeat(80));
console.log('');

if (!fs.existsSync(jsonPath)) {
  console.log('❌ ending-focast.json 파일이 없습니다.');
  console.log('💡 먼저 "node prepare-deploy.js"를 실행하세요.');
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 요약 시트 찾기
const summarySheetNames = ['요약', 'Summary', 'summary', '總結'];
let summarySheetName = Object.keys(jsonData.data || {}).find(name =>
  summarySheetNames.includes(name) ||
  name.includes('요약') ||
  name.includes('Summary')
);

if (!summarySheetName) {
  console.log('⚠️  요약 시트를 찾을 수 없습니다.');
  console.log('사용 가능한 시트:', Object.keys(jsonData.data || {}));
  process.exit(1);
}

console.log(`✅ 요약 시트 발견: "${summarySheetName}"\n`);

const sheetData = jsonData.data[summarySheetName];
if (!sheetData || !sheetData.raw) {
  console.log('❌ raw 데이터가 없습니다.');
  process.exit(1);
}

const rawData = sheetData.raw;
console.log(`📊 총 행 수: ${rawData.length}\n`);

// 7행 데이터 확인 (인덱스 6)
if (rawData.length < 7) {
  console.log('❌ 데이터가 7행 미만입니다.');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('7행 (인덱스 6) 원본 데이터:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const row7 = rawData[6];
console.log('전체:', JSON.stringify(row7));
console.log('');

// 각 컬럼 확인 (H=7, I=8, J=9, K=10, Q=16, R=17, S=18)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('7행의 주요 컬럼 값 (인덱스 기준):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`H7 (인덱스 7): ${row7[7]} (타입: ${typeof row7[7]})`);
console.log(`I7 (인덱스 8): ${row7[8]} (타입: ${typeof row7[8]})`);
console.log(`J7 (인덱스 9): ${row7[9]} (타입: ${typeof row7[9]})`);
console.log(`K7 (인덱스 10): ${row7[10]} (타입: ${typeof row7[10]})`);
console.log(`Q7 (인덱스 16): ${row7[16]} (타입: ${typeof row7[16]})`);
console.log(`R7 (인덱스 17): ${row7[17]} (타입: ${typeof row7[17]})`);
console.log(`S7 (인덱스 18): ${row7[18]} (타입: ${typeof row7[18]})`);
console.log('');

// raw 데이터를 XLSX 시트로 변환
const worksheet = XLSX.utils.aoa_to_sheet(rawData);
const sheetJson = XLSX.utils.sheet_to_json(worksheet);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('XLSX 변환 후 7행 (인덱스 6) 데이터:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (sheetJson.length > 6) {
  const row7Json = sheetJson[6];
  console.log('전체:', JSON.stringify(row7Json, null, 2));
  console.log('');
  console.log('주요 컬럼:');
  console.log(`__EMPTY_7 (H7): ${row7Json['__EMPTY_7']}`);
  console.log(`__EMPTY_8 (I7): ${row7Json['__EMPTY_8']}`);
  console.log(`__EMPTY_9 (J7): ${row7Json['__EMPTY_9']}`);
  console.log(`__EMPTY_10 (K7): ${row7Json['__EMPTY_10']}`);
  console.log(`__EMPTY_16 (Q7): ${row7Json['__EMPTY_16']}`);
  console.log(`__EMPTY_17 (R7): ${row7Json['__EMPTY_17']}`);
  console.log(`__EMPTY_18 (S7): ${row7Json['__EMPTY_18']}`);
} else {
  console.log('❌ 변환된 데이터가 7행 미만입니다.');
}

console.log('\n✨ 완료!\n');

