const XLSX = require('xlsx');

console.log('엑셀 구조 확인...\n');

try {
    const workbook = XLSX.readFile('mw_일주월별_판매_20251120090853.xlsx');
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log('='.repeat(80));
    console.log('헤더 분석 (행 1과 행 2)');
    console.log('='.repeat(80));
    
    // 행 1 (인덱스 0)
    console.log('\n[행 1 - 타이틀]');
    for (let i = 0; i < Math.min(45, data[0].length); i++) {
        const colName = getColumnName(i);
        console.log(`${colName}(${i}): "${data[0][i]}" (${typeof data[0][i]})`);
    }
    
    // 행 2 (인덱스 1) - 실제 헤더
    console.log('\n[행 2 - 헤더]');
    for (let i = 0; i < Math.min(45, data[1].length); i++) {
        const colName = getColumnName(i);
        const value = data[1][i];
        const type = typeof value;
        
        // 날짜일 가능성이 있는 컬럼 강조
        if (type === 'number' && value > 40000 && value < 50000) {
            console.log(`✨ ${colName}(${i}): ${value} (숫자-날짜가능) → ${excelDateToJSDate(value)}`);
        } else {
            console.log(`${colName}(${i}): "${value}" (${type})`);
        }
    }
    
    // 날짜 범위 찾기
    console.log('\n' + '='.repeat(80));
    console.log('날짜 컬럼 찾기');
    console.log('='.repeat(80));
    
    const dateColumns = [];
    for (let i = 0; i < data[1].length; i++) {
        const value = data[1][i];
        if (typeof value === 'number' && value > 40000 && value < 50000) {
            dateColumns.push({
                index: i,
                column: getColumnName(i),
                serial: value,
                date: excelDateToJSDate(value)
            });
        }
    }
    
    if (dateColumns.length > 0) {
        console.log(`\n✅ 찾은 날짜 컬럼: ${dateColumns.length}개`);
        console.log(`첫 날짜: ${dateColumns[0].column}열 (인덱스 ${dateColumns[0].index}) = ${dateColumns[0].date}`);
        console.log(`마지막 날짜: ${dateColumns[dateColumns.length-1].column}열 (인덱스 ${dateColumns[dateColumns.length-1].index}) = ${dateColumns[dateColumns.length-1].date}`);
        
        console.log('\n모든 날짜:');
        dateColumns.forEach(d => {
            console.log(`  ${d.column}열 (${d.index}): ${d.date}`);
        });
    } else {
        console.log('\n❌ 날짜 컬럼을 찾을 수 없습니다!');
    }
    
} catch (error) {
    console.error('오류:', error.message);
}

// 인덱스를 엑셀 열 이름으로 변환 (0=A, 1=B, ..., 25=Z, 26=AA, ...)
function getColumnName(index) {
    let name = '';
    index++; // 1-based로 변환
    while (index > 0) {
        const remainder = (index - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        index = Math.floor((index - 1) / 26);
    }
    return name;
}

// 엑셀 날짜 시리얼을 날짜로 변환
function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date_info.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

