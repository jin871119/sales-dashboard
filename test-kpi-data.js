// KPI 데이터 추출 테스트
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
// TypeScript 파일을 직접 require할 수 없으므로 로직을 직접 구현
const XLSX = require('xlsx');

const rootDir = process.cwd();
const jsonPath = path.join(rootDir, 'public', 'ending-focast.json');

console.log('='.repeat(80));
console.log('KPI 데이터 추출 테스트');
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

try {
  const summaryData = readSummaryFromRaw(sheetData.raw, summarySheetName);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('추출된 KPI 데이터:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`매출목표 (H7): ${summaryData.salesTarget?.[0]?.value?.toLocaleString() || 0}원`);
  console.log(`예상마감 (I7): ${summaryData.forecast?.[0]?.value?.toLocaleString() || 0}원`);
  console.log(`예상달성율 (J7): ${summaryData.forecastAchievementRate?.[0]?.value || 0}%`);
  console.log(`작년실적 (K7): ${summaryData.lastYear?.[0]?.value?.toLocaleString() || 0}원`);
  console.log(`실적 (Q7): ${summaryData.periodPerformance?.[0]?.value?.toLocaleString() || 0}원`);
  console.log(`전년실적 (R7): ${summaryData.lastYearPeriod?.[0]?.value?.toLocaleString() || 0}원`);
  console.log(`전년비 (S7): ${summaryData.periodGrowthRate?.[0]?.value || 0}%`);
  console.log('');
  
  if (summaryData.salesTarget?.[0]?.value === 0) {
    console.log('⚠️  경고: 모든 값이 0입니다. 데이터 추출에 문제가 있을 수 있습니다.');
  } else {
    console.log('✅ 데이터 추출 성공!');
  }
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error(error.stack);
}

console.log('\n✨ 완료!\n');

