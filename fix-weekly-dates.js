const XLSX = require('xlsx');
const fs = require('fs');

console.log('엑셀 날짜 컬럼 확인 및 수정...\n');

try {
    const workbook = XLSX.readFile('mw_일주월별_판매_20251120090853.xlsx');
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log('행 2 (헤더) 전체 분석:');
    const headers = data[1];
    
    const dateInfo = [];
    
    for (let i = 0; i < headers.length; i++) {
        const value = headers[i];
        const type = typeof value;
        
        if (i >= 20 && i <= 40) {
            console.log(`[${i}] ${getColName(i)}: "${value}" (${type})`);
        }
        
        // 날짜 형식 찾기
        if (type === 'number' && value > 40000 && value < 50000) {
            dateInfo.push({
                index: i,
                col: getColName(i),
                serial: value,
                date: excelDateToJSDate(value)
            });
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`찾은 날짜 컬럼: ${dateInfo.length}개`);
    console.log('='.repeat(80));
    
    if (dateInfo.length > 0) {
        console.log(`\n시작: ${dateInfo[0].col}열 (인덱스 ${dateInfo[0].index}) = ${dateInfo[0].date}`);
        console.log(`끝: ${dateInfo[dateInfo.length-1].col}열 (인덱스 ${dateInfo[dateInfo.length-1].index}) = ${dateInfo[dateInfo.length-1].date}`);
        
        console.log('\n모든 날짜:');
        dateInfo.forEach(d => {
            console.log(`  ${d.col}(${d.index}): ${d.date}`);
        });
        
        // 코드 생성
        console.log('\n' + '='.repeat(80));
        console.log('수정할 코드:');
        console.log('='.repeat(80));
        console.log(`\nconst DATE_START_INDEX = ${dateInfo[0].index};`);
        console.log(`const DATE_END_INDEX = ${dateInfo[dateInfo.length-1].index};`);
        console.log(`// 날짜 범위: ${dateInfo[0].date} ~ ${dateInfo[dateInfo.length-1].date}`);
        
    } else {
        console.log('\n❌ 날짜 컬럼을 찾을 수 없습니다!');
        console.log('\n20~40번 인덱스 값들:');
        for (let i = 20; i <= 40 && i < headers.length; i++) {
            console.log(`  [${i}]: "${headers[i]}" (${typeof headers[i]})`);
        }
    }
    
} catch (error) {
    console.error('오류:', error.message);
}

function getColName(n) {
    let name = '';
    n++;
    while (n > 0) {
        const r = (n - 1) % 26;
        name = String.fromCharCode(65 + r) + name;
        n = Math.floor((n - 1) / 26);
    }
    return name;
}

function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date_info.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

