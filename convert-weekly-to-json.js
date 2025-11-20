const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('일주월별 판매 데이터를 JSON으로 변환 중...\n');

try {
    // 엑셀 파일 읽기
    const files = fs.readdirSync('.');
    const excelFile = files.find(f => f.startsWith('mw_일주월별_판매') && f.endsWith('.xlsx') && !f.startsWith('~$'));
    
    if (!excelFile) {
        throw new Error('엑셀 파일을 찾을 수 없습니다.');
    }
    
    console.log(`📊 읽는 중: ${excelFile}`);
    
    const workbook = XLSX.readFile(excelFile);
    const worksheet = workbook.Sheets['report'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log(`✅ ${data.length.toLocaleString()}행 읽기 완료`);
    
    // public 폴더 생성 (없으면)
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log('📁 public 폴더 생성');
    }
    
    // JSON으로 저장
    const outputPath = path.join(publicDir, 'weekly-sales-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data), 'utf8');
    
    console.log(`✅ 저장 완료: ${outputPath}`);
    console.log(`📦 파일 크기: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 변환 완료!');
    console.log('='.repeat(80));
    console.log('\n이제 Vercel에 배포할 수 있습니다.');
    console.log('배포 시 public/weekly-sales-data.json 파일이 포함됩니다.\n');
    
} catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
}

