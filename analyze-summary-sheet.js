// ending focast.xlsx의 "요약" 시트 전용 분석
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

try {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ending focast.xlsx - "요약" 시트 분석');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const filePath = path.join(process.cwd(), 'ending focast.xlsx');
  const workbook = XLSX.readFile(filePath);

  console.log(`📋 전체 시트 목록:\n`);
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`);
  });

  // "요약" 시트 찾기
  const summarySheetNames = ['요약', '요약', 'Summary', 'summary', '總結'];
  let summarySheetName = workbook.SheetNames.find(name => 
    summarySheetNames.includes(name) || name.includes('요약') || name.includes('Summary')
  );

  if (!summarySheetName) {
    console.log('\n⚠️  "요약" 시트를 찾을 수 없습니다.');
    console.log('💡 첫 번째 시트를 분석합니다...\n');
    summarySheetName = workbook.SheetNames[0];
  } else {
    console.log(`\n✅ "요약" 시트 발견: "${summarySheetName}"\n`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 "${summarySheetName}" 시트 상세 분석`);
  console.log(`${'='.repeat(60)}\n`);

  const worksheet = workbook.Sheets[summarySheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 총 행 수: ${jsonData.length.toLocaleString()} 행\n`);

  if (jsonData.length > 0) {
    // 컬럼 분석
    const columns = Object.keys(jsonData[0]);
    console.log(`📋 컬럼 (${columns.length}개):\n`);
    columns.forEach((col, i) => {
      // 각 컬럼의 샘플 값
      const sampleValues = jsonData.slice(0, 5).map(row => row[col]).filter(v => v != null);
      const uniqueCount = new Set(sampleValues).size;
      console.log(`   ${i + 1}. "${col}"`);
      console.log(`      샘플: ${sampleValues.slice(0, 3).join(', ')}`);
      console.log(`      고유값: ${uniqueCount}개\n`);
    });

    // 키워드별 데이터 추출
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 카테고리별 데이터 분석`);
    console.log(`${'='.repeat(60)}\n`);

    const categories = {
      '상권별': ['상권', '商圈', 'Area', 'District', 'Zone'],
      'team별': ['team', 'Team', 'TEAM', '팀', 'チーム'],
      '유통별': ['유통', '流通', 'Distribution', 'Channel'],
      '순수별': ['순수', '純粋', 'Pure', 'Net'],
      '단체별': ['단체', '團體', 'Group', 'Organization']
    };

    const analysis = {
      sheetName: summarySheetName,
      totalRows: jsonData.length,
      columns: columns,
      categories: {},
      sampleData: jsonData.slice(0, 20)
    };

    Object.entries(categories).forEach(([categoryName, keywords]) => {
      console.log(`\n📍 ${categoryName} 데이터 검색...`);
      
      // 해당 키워드를 포함하는 컬럼 찾기
      const matchingColumns = columns.filter(col => 
        keywords.some(keyword => col.includes(keyword))
      );

      if (matchingColumns.length > 0) {
        console.log(`   ✅ 발견된 컬럼: ${matchingColumns.join(', ')}`);
        
        // 해당 컬럼의 데이터 추출
        const categoryData = {};
        matchingColumns.forEach(col => {
          const values = jsonData.map(row => row[col]).filter(v => v != null);
          const uniqueValues = [...new Set(values)];
          categoryData[col] = {
            totalCount: values.length,
            uniqueCount: uniqueValues.length,
            sample: uniqueValues.slice(0, 10),
            allValues: values.slice(0, 50) // 처음 50개
          };
          
          console.log(`\n      컬럼: "${col}"`);
          console.log(`      - 총 ${values.length}개 데이터`);
          console.log(`      - 고유값 ${uniqueValues.length}개`);
          console.log(`      - 샘플: ${uniqueValues.slice(0, 5).join(', ')}`);
        });
        
        analysis.categories[categoryName] = {
          found: true,
          columns: matchingColumns,
          data: categoryData
        };
      } else {
        console.log(`   ⚠️  해당 키워드를 포함하는 컬럼을 찾을 수 없습니다.`);
        
        // 유사한 컬럼명 제안
        const similarColumns = columns.filter(col => 
          keywords.some(keyword => 
            col.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(col.toLowerCase())
          )
        );
        
        if (similarColumns.length > 0) {
          console.log(`   💡 유사한 컬럼: ${similarColumns.join(', ')}`);
        }
        
        analysis.categories[categoryName] = {
          found: false,
          suggestions: similarColumns
        };
      }
    });

    // 전체 데이터 구조 출력
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📝 샘플 데이터 (처음 5행):`);
    console.log(`${'='.repeat(60)}\n`);
    
    jsonData.slice(0, 5).forEach((row, i) => {
      console.log(`[행 ${i + 1}]`);
      Object.entries(row).forEach(([key, value]) => {
        const displayValue = String(value).length > 60 
          ? String(value).substring(0, 60) + '...' 
          : value;
        console.log(`   ${key}: ${displayValue}`);
      });
      console.log('');
    });

    // JSON 저장
    const outputPath = path.join(process.cwd(), 'summary-sheet-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
    console.log(`\n💾 분석 결과 저장: summary-sheet-analysis.json\n`);

    // 추천 구현 전략
    console.log(`\n${'='.repeat(60)}`);
    console.log(`💡 구현 추천 사항:`);
    console.log(`${'='.repeat(60)}\n`);
    
    Object.entries(analysis.categories).forEach(([name, info]) => {
      if (info.found) {
        console.log(`✅ ${name}: ${info.columns.join(', ')}`);
        console.log(`   → 바 차트 또는 파이 차트로 시각화 추천\n`);
      } else {
        console.log(`⚠️  ${name}: 데이터를 찾을 수 없음`);
        if (info.suggestions && info.suggestions.length > 0) {
          console.log(`   → 대안: ${info.suggestions.join(', ')}\n`);
        } else {
          console.log(`   → 수동으로 컬럼명을 확인하세요\n`);
        }
      }
    });

  } else {
    console.log('⚠️  시트가 비어있습니다.\n');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 분석 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📍 다음 단계:');
  console.log('   1. summary-sheet-analysis.json 파일 확인');
  console.log('   2. 발견된 컬럼명을 API 코드에 반영');
  console.log('   3. 대시보드 컴포넌트 생성\n');

} catch (error) {
  console.error('\n❌ 오류 발생:', error.message);
  console.error('\n💡 해결 방법:');
  console.error('   1. xlsx 패키지 설치: npm install xlsx');
  console.error('   2. ending focast.xlsx 파일이 프로젝트 폴더에 있는지 확인');
  console.error('   3. 파일이 다른 프로그램에서 열려있지 않은지 확인\n');
  process.exit(1);
}


