// 매장 정보 타입
export interface StoreInfo {
  code: string;
  name: string;
  type: 'department' | 'direct' | 'dealer' | 'outlet' | 'dutyfree' | 'online' | 'other';
  brand?: string; // 백화점인 경우
  region?: string;
  isOnline: boolean;
}

// 매장 유형 판별
export function getStoreType(storeName: string): StoreInfo['type'] {
  if (storeName.includes('(직)')) return 'direct';
  if (storeName.includes('(대-위)')) return 'dealer';
  if (storeName.includes('(제휴몰)')) return 'online';
  if (storeName.includes('(상-위)') || storeName.includes('아울렛')) return 'outlet';
  if (storeName.includes('면세')) return 'dutyfree';
  if (storeName.includes('롯데') || storeName.includes('현대') || 
      storeName.includes('신세계') || storeName.includes('갤러리아') || 
      storeName.includes('AK')) return 'department';
  return 'other';
}

// 백화점 브랜드 추출
export function getDepartmentBrand(storeName: string): string | undefined {
  if (storeName.includes('롯데')) return '롯데';
  if (storeName.includes('현대')) return '현대';
  if (storeName.includes('신세계')) return '신세계';
  if (storeName.includes('갤러리아')) return '갤러리아';
  if (storeName.includes('AK')) return 'AK';
  return undefined;
}

// 지역 추출 (매장명 기반)
export function getStoreRegion(storeName: string): string {
  // 면세점은 기타로 분류
  if (storeName.includes('면세')) return '기타';
  
  // 서울
  if (storeName.includes('강남') || storeName.includes('본점') || 
      storeName.includes('명동') || storeName.includes('잠실') ||
      storeName.includes('영등포') || storeName.includes('성수') ||
      storeName.includes('홍대') || storeName.includes('가로수길') ||
      storeName.includes('한남') || storeName.includes('청량리') ||
      storeName.includes('노원') || storeName.includes('신촌') ||
      storeName.includes('천호') || storeName.includes('미아') ||
      storeName.includes('동대문') || storeName.includes('왕십리') ||
      storeName.includes('사옥') || storeName.includes('아이파크용산') ||
      storeName.includes('건대') || storeName.includes('더현대서울') ||
      storeName.includes('두타') || storeName.includes('신림') ||
      storeName.includes('마리오') || storeName.includes('NC강서') ||
      storeName.includes('가산') || storeName.includes('송파') ||
      storeName.includes('가든5')) return '서울';
  
  // 경기
  if (storeName.includes('판교') || storeName.includes('분당') ||
      storeName.includes('일산') || storeName.includes('평촌') ||
      storeName.includes('수원') || storeName.includes('안양') ||
      storeName.includes('성남') || storeName.includes('용인') ||
      storeName.includes('하남') || storeName.includes('고양') ||
      storeName.includes('동탄') || storeName.includes('광교') ||
      storeName.includes('킨텍스') || storeName.includes('중동') ||
      storeName.includes('안산') || storeName.includes('광명') ||
      storeName.includes('김포') || storeName.includes('부천') ||
      storeName.includes('시흥') || storeName.includes('오산') ||
      storeName.includes('평택') || storeName.includes('화성') ||
      storeName.includes('안성') || storeName.includes('구리') ||
      storeName.includes('남양주') || storeName.includes('의정부') ||
      storeName.includes('고양') || storeName.includes('파주') ||
      storeName.includes('양주') || storeName.includes('포천') ||
      storeName.includes('가평') || storeName.includes('연천') ||
      storeName.includes('퍼스트빌리지') || storeName.includes('신세계경기') ||
      storeName.includes('의왕') || storeName.includes('여주') ||
      storeName.includes('기흥') || storeName.includes('이천') ||
      storeName.includes('콜렉티드')) return '경기';
  
  // 인천
  if (storeName.includes('인천') || storeName.includes('부평')) return '인천';
  
  // 부산/경남
  if (storeName.includes('부산') || storeName.includes('울산') ||
      storeName.includes('창원') || storeName.includes('김해') ||
      storeName.includes('마산') || storeName.includes('진주') ||
      storeName.includes('거제') || storeName.includes('통영') ||
      storeName.includes('사천') || storeName.includes('밀양') ||
      storeName.includes('양산') || storeName.includes('동래') ||
      storeName.includes('센텀') || storeName.includes('광복') ||
      storeName.includes('기장')) return '부산/경남';
  
  // 대구/경북
  if (storeName.includes('대구') || storeName.includes('경산') ||
      storeName.includes('포항') || storeName.includes('구미') ||
      storeName.includes('안동') || storeName.includes('경주') ||
      storeName.includes('영주') || storeName.includes('상주') ||
      storeName.includes('칠곡') || storeName.includes('성서') ||
      storeName.includes('동성로') || storeName.includes('상인') ||
      storeName.includes('봉무') || storeName.includes('율하')) return '대구/경북';
  
  // 광주/전라
  if (storeName.includes('광주') || storeName.includes('전주') ||
      storeName.includes('순천') || storeName.includes('목포') ||
      storeName.includes('여수') || storeName.includes('익산') ||
      storeName.includes('나주') || storeName.includes('정읍') ||
      storeName.includes('남원') || storeName.includes('해남') ||
      storeName.includes('여천') || storeName.includes('송천') ||
      storeName.includes('수완') || storeName.includes('광양') ||
      storeName.includes('군산') || storeName.includes('충장로')) return '광주/전라';
  
  // 대전/충청
  if (storeName.includes('대전') || storeName.includes('청주') ||
      storeName.includes('천안') || storeName.includes('충청') ||
      storeName.includes('세종') || storeName.includes('아산') ||
      storeName.includes('당진') || storeName.includes('서산') ||
      storeName.includes('홍성') || storeName.includes('보령') ||
      storeName.includes('제천') || storeName.includes('충주') ||
      storeName.includes('은행') || storeName.includes('갤러리아센터시티') ||
      storeName.includes('부여')) return '대전/충청';
  
  // 강원
  if (storeName.includes('춘천') || storeName.includes('강릉') ||
      storeName.includes('속초') || storeName.includes('원주') ||
      storeName.includes('동해') || storeName.includes('태백')) return '강원';
  
  // 제주
  if (storeName.includes('제주') || storeName.includes('서귀포')) return '제주';
  
  return '기타';
}

// 온라인 여부
export function isOnlineStore(storeName: string): boolean {
  return storeName.includes('(제휴몰)') || 
         storeName.includes('온라인') ||
         storeName.includes('쇼피파이');
}

// 매장 정보 전체 생성
export function createStoreInfo(storeCode: string, storeName: string): StoreInfo {
  const type = getStoreType(storeName);
  return {
    code: storeCode,
    name: storeName,
    type,
    brand: type === 'department' ? getDepartmentBrand(storeName) : undefined,
    region: getStoreRegion(storeName),
    isOnline: isOnlineStore(storeName)
  };
}

// 매장 유형 한글명
export function getStoreTypeLabel(type: StoreInfo['type']): string {
  const labels: Record<StoreInfo['type'], string> = {
    department: '백화점',
    direct: '직영점',
    dealer: '대리점',
    outlet: '아울렛',
    dutyfree: '면세점',
    online: '제휴몰',
    other: '기타'
  };
  return labels[type];
}

// 지역 정렬 순서
export function getRegionOrder(region: string): number {
  const order: Record<string, number> = {
    '서울': 1,
    '경기': 2,
    '인천': 3,
    '부산/경남': 4,
    '대구/경북': 5,
    '광주/전라': 6,
    '대전/충청': 7,
    '강원': 8,
    '제주': 9,
    '기타': 10
  };
  return order[region] || 100;
}

