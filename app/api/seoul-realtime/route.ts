import { NextResponse } from 'next/server';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🚨 API Route (서버)에서는 NEXT_PUBLIC_ 접두사가 없는 키를 불러와야 합니다.
const API_KEY = process.env.SEOUL_RTD_API_KEY;
const BASE_URL = process.env.SEOUL_RTD_BASE_URL || 'http://openapi.seoul.go.kr:8088';

export async function GET(request: Request) {
  // 클라이언트가 요청한 지역 코드를 가져옵니다. (없으면 광화문 PO001 기본값)
  const { searchParams } = new URL(request.url);
  const placeCode = searchParams.get('code') || 'PO001';
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: '서버: API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  // 서울시 API URL 생성
  const SEOUL_URL = `${BASE_URL}/${API_KEY}/json/citydata/1/5/${placeCode}`;
  
  try {
    // 1. 서버가 서울시 API로 요청 (CORS 문제 없음)
    const apiResponse = await fetch(SEOUL_URL);
    
    if (!apiResponse.ok) {
      // 서울시 API가 잘못된 응답을 보낼 경우 (예: 400 Bad Request)
      const errorText = await apiResponse.text();
      return NextResponse.json(
        { 
          error: `외부 API 오류: ${apiResponse.status}`,
          details: errorText.substring(0, 200) // 에러 상세정보 제공
        },
        { status: apiResponse.status }
      );
    }

    // 2. 응답 데이터를 JSON으로 파싱
    const data = await apiResponse.json();
    
    // 3. 데이터를 클라이언트에게 그대로 전달
    return NextResponse.json(data);
    
  } catch (error: any) {
    // 네트워크 연결 등 기타 문제 발생 시
    console.error("API Route 호출 실패:", error);
    return NextResponse.json(
      { error: '서버: API Route 처리 중 치명적인 오류 발생.' },
      { status: 500 }
    );
  }
}
