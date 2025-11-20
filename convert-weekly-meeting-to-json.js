const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  console.log('📊 주간회의 데이터를 JSON으로 변환 중...');
  
  const excelPath = path.join(__dirname, 'backdata.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ backdata.xlsx 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = '주간회의';
  
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error('❌ "주간회의" 시트를 찾을 수 없습니다.');
    process.exit(1);
  }

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log(`✅ ${data.length}개 행 읽음`);

  // 데이터 파싱
  const categories = [];
  const categoryRows = data.slice(3, 8); // 행 4-8: 합계, 국내, 면세, RF+도매

  categoryRows.forEach(row => {
    if (row[0] && typeof row[0] === 'string') {
      const category = {
        name: row[0],
        // 25년 누계
        yearlyTarget: parseNumber(row[1]),
        yearlyActual: parseNumber(row[2]),
        yearlyLastYear: parseNumber(row[3]),
        yearlyGrowthRate: parseNumber(row[4]),
        yearlyAchievementRate: parseNumber(row[5]),
        // 11월
        monthlyTarget: parseNumber(row[8]),
        monthlyActual: parseNumber(row[9]),
        monthlyLastYear: parseNumber(row[10]),
        monthlyGrowthRate: parseNumber(row[11]),
        monthlyAchievementRate: parseNumber(row[12]),
        // 46주차
        weeklyActual: parseNumber(row[17]),
        weeklyLastYear: parseNumber(row[18]),
        weeklyGrowthRate: parseNumber(row[19]),
      };
      categories.push(category);
    }
  });

  const result = {
    period: '2025년 46주차',
    categories
  };

  // JSON 파일로 저장
  const outputPath = path.join(__dirname, 'public', 'weekly-meeting-data.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  
  console.log('✅ JSON 변환 완료:', outputPath);
  console.log(`📋 카테고리 수: ${categories.length}`);
  console.log('📂 카테고리:', categories.map(c => c.name).join(', '));
  
} catch (error) {
  console.error('❌ 변환 실패:', error.message);
  process.exit(1);
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? undefined : num;
}

