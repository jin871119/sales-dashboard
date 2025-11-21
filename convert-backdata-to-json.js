const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('backdata.xlsx를 JSON으로 변환 중...\n');

try {
    const rootDir = process.cwd();
    const excelFilePath = path.join(rootDir, 'backdata.xlsx');
    
    if (!fs.existsSync(excelFilePath)) {
        throw new Error('backdata.xlsx 파일을 찾을 수 없습니다.');
    }
    
    console.log(`📊 읽는 중: ${excelFilePath}`);
    
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log(`✅ ${workbook.SheetNames.length}개 시트 발견: ${workbook.SheetNames.join(', ')}\n`);
    
    const result = {
        sheetNames: workbook.SheetNames,
        data: {}
    };
    
    // 모든 시트를 JSON으로 변환
    workbook.SheetNames.forEach(sheetName => {
        console.log(`📋 "${sheetName}" 시트 변환 중...`);
        const worksheet = workbook.Sheets[sheetName];
        
        // 원시 데이터 (2차원 배열)로 읽기 - 나중에 파싱하기 위해
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // JSON 형식으로도 읽기 (객체 배열)
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        result.data[sheetName] = {
            raw: rawData,  // 2차원 배열 (파싱용)
            json: jsonData  // 객체 배열 (직접 사용용)
        };
        
        console.log(`   ✅ ${rawData.length}행 변환 완료`);
    });
    
    // public 폴더 생성 (없으면)
    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log('\n📁 public 폴더 생성');
    }
    
    // JSON으로 저장
    const outputPath = path.join(publicDir, 'backdata.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    
    const fileSize = fs.statSync(outputPath).size / 1024 / 1024;
    console.log(`\n✅ 저장 완료: ${outputPath}`);
    console.log(`📦 파일 크기: ${fileSize.toFixed(2)} MB`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 변환 완료!');
    console.log('='.repeat(80));
    console.log('\n이제 Vercel에 배포할 수 있습니다.');
    console.log('배포 시 public/backdata.json 파일이 포함됩니다.\n');
    
} catch (error) {
    console.error('\n❌ 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
}

