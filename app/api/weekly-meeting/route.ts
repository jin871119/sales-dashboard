import { NextResponse } from 'next/server';
import { readWeeklyMeetingData } from '@/lib/weeklyMeetingReader';

export async function GET() {
  try {
    const data = readWeeklyMeetingData();
    
    if (!data) {
      return NextResponse.json(
        { error: '주간회의 데이터를 로드할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ 주간회의 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', message: error.message },
      { status: 500 }
    );
  }
}

