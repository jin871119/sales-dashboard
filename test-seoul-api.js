// 서울시 실시간 도시데이터 API 테스트
const API_KEY = process.env.NEXT_PUBLIC_SEOUL_RTD_API_KEY || '667a56454b6a696e39395570517a74';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

console.log('='.repeat(80));
console.log('서울시 실시간 도시데이터 API 테스트');
console.log('='.repeat(80));
console.log('');
console.log(`API 키: ${API_KEY.substring(0, 10)}...`);
console.log(`Base URL: ${BASE_URL}`);
console.log('');

// 테스트할 엔드포인트들
const endpoints = [
  {
    name: 'CITYDATA (기본)',
    url: `${BASE_URL}/${API_KEY}/json/CITYDATA/1/5/`
  },
  {
    name: 'CITYDATA (XML)',
    url: `${BASE_URL}/${API_KEY}/xml/CITYDATA/1/5/`
  },
  {
    name: 'CITYDATA (지역명 포함)',
    url: `${BASE_URL}/${API_KEY}/json/CITYDATA/1/5/강남역`
  },
  {
    name: 'CITYDATA (지역코드 포함)',
    url: `${BASE_URL}/${API_KEY}/json/CITYDATA/1/5/1100000000`
  }
];

async function testEndpoint(name, url) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`테스트: ${name}`);
  console.log(`URL: ${url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/xml',
      },
    });
    
    console.log(`상태 코드: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 오류 응답: ${errorText.substring(0, 200)}`);
      return false;
    }
    
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    
    if (contentType.includes('xml') || responseText.trim().startsWith('<')) {
      console.log('✅ XML 응답 받음');
      console.log(`응답 샘플: ${responseText.substring(0, 300)}`);
    } else {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ JSON 응답 받음');
        console.log(`응답 키: ${Object.keys(jsonData).join(', ')}`);
        
        // CITYDATA 구조 확인
        if (jsonData.CITYDATA) {
          const cityData = jsonData.CITYDATA;
          console.log(`CITYDATA 타입: ${typeof cityData}`);
          if (Array.isArray(cityData)) {
            console.log(`✅ CITYDATA 배열: ${cityData.length}개 항목`);
            if (cityData.length > 0) {
              console.log(`첫 번째 항목 키: ${Object.keys(cityData[0]).join(', ')}`);
            }
          } else if (cityData.row) {
            console.log(`✅ CITYDATA.row 배열: ${cityData.row.length}개 항목`);
            if (cityData.row.length > 0) {
              console.log(`첫 번째 항목 키: ${Object.keys(cityData.row[0]).join(', ')}`);
            }
          } else {
            console.log(`CITYDATA 구조:`, Object.keys(cityData));
          }
        }
      } catch (e) {
        console.log(`❌ JSON 파싱 실패: ${e.message}`);
        console.log(`응답 샘플: ${responseText.substring(0, 300)}`);
      }
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.log(`❌ 요청 실패: ${error.message}`);
    console.log('');
    return false;
  }
}

async function runTests() {
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.name, endpoint.url);
    if (success) successCount++;
    console.log('');
    
    // 요청 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(80));
  console.log(`테스트 완료: ${successCount}/${endpoints.length} 성공`);
  console.log('='.repeat(80));
}

runTests().catch(console.error);




