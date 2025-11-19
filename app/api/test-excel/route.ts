import { NextResponse } from "next/server";
// import { readExcelFile, transformExcelToDashboard } from "@/lib/excelReader";

/**
 * 엑셀 파일 구조 확인용 테스트 API
 * 브라우저에서 /api/test-excel 로 접속하면 엑셀 데이터 구조를 볼 수 있습니다
 * 
 * ⚠️ 활성화하려면: npm install xlsx 실행 후 주석 해제
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: false,
      message: "엑셀 라이브러리가 설치되지 않았습니다.",
      instruction: "터미널에서 'npm install xlsx'를 실행하세요."
    });
    
    /*
    // xlsx 설치 후 아래 주석을 해제하세요
    const { readExcelFile, transformExcelToDashboard } = await import("@/lib/excelReader");
    const excelData = readExcelFile("ending focast.xlsx");
    const info = transformExcelToDashboard(excelData);
    
    return NextResponse.json({
      success: true,
      message: "엑셀 파일을 성공적으로 읽었습니다!",
      info,
      allSheets: Object.keys(excelData).map(sheetName => ({
        name: sheetName,
        rowCount: excelData[sheetName].length,
        columns: excelData[sheetName].length > 0 ? Object.keys(excelData[sheetName][0]) : [],
        sample: excelData[sheetName].slice(0, 5)
      }))
    });
    */
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

