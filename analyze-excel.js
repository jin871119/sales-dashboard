// ending focast.xlsx 파일 구조 분석
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

try {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ending focast.xlsx 파일 분석 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const filePath = path.join(process.cwd(), 'ending focast.xlsx');
  const workbook = XLSX.readFile(filePath);

  console.log(`✅ 파일을 성공적으로 읽었습니다!\n`);
  console.log(`📋 시트 개수: ${workbook.SheetNames.length}\n`);

  workbook.SheetNames.forEach((sheetName, idx) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 시트 ${idx + 1}: "${sheetName}"`);
    console.log(`${'='.repeat(60)}\n`);

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 총 행 수: ${jsonData.length.toLocaleString()} 행\n`);

    if (jsonData.length > 0) {
      // 컬럼 정보
      const columns = Object.keys(jsonData[0]);
      console.log(`📋 컬럼 (${columns.length}개):`);
      columns.forEach((col, i) => {
        console.log(`   ${i + 1}. ${col}`);
      });

      // 샘플 데이터
      console.log(`\n📝 샘플 데이터 (처음 3행):\n`);
      jsonData.slice(0, 3).forEach((row, i) => {
        console.log(`   [행 ${i + 1}]`);
        Object.entries(row).forEach(([key, value]) => {
          const displayValue = String(value).length > 50 
            ? String(value).substring(0, 50) + '...' 
            : value;
          console.log(`      ${key}: ${displayValue}`);
        });
        console.log('');
      });

      // 데이터 분석 결과를 JSON으로 저장
      const analysis = {
        sheetName,
        rowCount: jsonData.length,
        columns,
        sampleData: jsonData.slice(0, 10),
        dataTypes: {}
      };

      // 각 컬럼의 데이터 타입 분석
      columns.forEach(col => {
        const sampleValues = jsonData.slice(0, 100).map(row => row[col]).filter(v => v != null);
        const types = new Set(sampleValues.map(v => typeof v));
        analysis.dataTypes[col] = Array.from(types);
      });

      // JSON 파일로 저장
      const outputPath = path.join(process.cwd(), `excel-analysis-${idx + 1}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
      console.log(`💾 분석 결과 저장: excel-analysis-${idx + 1}.json\n`);
    } else {
      console.log('⚠️  시트가 비어있습니다.\n');
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 분석 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error) {
  console.error('\n❌ 오류 발생:', error.message);
  console.error('\n💡 해결 방법:');
  console.error('   1. xlsx 패키지가 설치되어 있는지 확인: npm list xlsx');
  console.error('   2. 설치되지 않았다면: npm install xlsx');
  console.error('   3. ending focast.xlsx 파일이 프로젝트 폴더에 있는지 확인\n');
  process.exit(1);
}


