/**
 * 한국 공휴일 API 서비스
 * 공공데이터포털 API와 무료 API를 함께 사용하여 공휴일 정보를 가져옵니다.
 */

class HolidayService {
  constructor() {
    this.cache = new Map();
    this.FREE_API_BASE_URL = 'https://holidays.dist.be';
    this.GOV_API_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
    this.SERVICE_KEY = '7BZDblK8NIBj32BvDQ5jWi/YyHJJfhDHESiBYljCaocAPUQZc8IG5ltkJvlVR8J1AinP5izo2WA2F68xWyUTKA==';
  }

  /**
   * 지정된 연도의 공휴일 데이터를 가져옵니다.
   * 공공데이터포털 API 우선, 실패시 무료 API 사용
   * @param {number} year - 연도 (예: 2025)
   * @returns {Promise<Array>} 공휴일 배열
   */
  async getHolidays(year) {
    // 캐시에서 확인
    if (this.cache.has(year)) {
      return this.cache.get(year);
    }

    try {
      console.log(`📅 ${year}년 공휴일 데이터 요청 중... (정부 API 우선)`);
      
      // 1차: 공공데이터포털 API 시도
      let holidays = await this.getHolidaysFromGovAPI(year);
      
      // 2차: 실패시 무료 API 사용
      if (holidays.length === 0) {
        console.log(`🔄 정부 API 실패, 무료 API로 재시도...`);
        holidays = await this.getHolidaysFromFreeAPI(year);
      }
      
      // 3차: 모두 실패시 폴백 데이터
      if (holidays.length === 0) {
        console.log(`🔄 모든 API 실패, 기본 데이터 사용`);
        holidays = this.getFallbackHolidays(year);
      }

      console.log(`✅ ${year}년 공휴일 ${holidays.length}개 로드됨:`, holidays.map(h => h.name).join(', '));
      
      // 캐시에 저장
      this.cache.set(year, holidays);
      
      return holidays;
    } catch (error) {
      console.error(`❌ ${year}년 공휴일 데이터 로드 실패:`, error);
      
      // 폴백: 기본 공휴일 데이터 반환
      const fallbackHolidays = this.getFallbackHolidays(year);
      this.cache.set(year, fallbackHolidays);
      
      return fallbackHolidays;
    }
  }

  /**
   * 공공데이터포털 API로 공휴일 가져오기
   * @param {number} year - 연도
   * @returns {Promise<Array>} 공휴일 배열
   */
  async getHolidaysFromGovAPI(year) {
    try {
      const holidays = [];
      
      // 월별로 API 호출 (정부 API는 월별로만 제공)
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const url = `${this.GOV_API_URL}?serviceKey=${this.SERVICE_KEY}&solYear=${year}&solMonth=${monthStr}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const items = xmlDoc.getElementsByTagName('item');
        for (let item of items) {
          const dateName = item.getElementsByTagName('dateName')[0]?.textContent;
          const locdate = item.getElementsByTagName('locdate')[0]?.textContent;
          
          if (dateName && locdate) {
            const dateStr = `${locdate.substring(0, 4)}-${locdate.substring(4, 6)}-${locdate.substring(6, 8)}`;
            holidays.push({
              date: dateStr,
              name: dateName,
              kind: 1, // 공휴일
              remarks: null
            });
          }
        }
      }
      
      return holidays;
    } catch (error) {
      console.error('정부 API 호출 실패:', error);
      return [];
    }
  }

  /**
   * 무료 API로 공휴일 가져오기
   * @param {number} year - 연도
   * @returns {Promise<Array>} 공휴일 배열
   */
  async getHolidaysFromFreeAPI(year) {
    try {
      const response = await fetch(`${this.FREE_API_BASE_URL}/${year}.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 공휴일만 필터링 (holiday: true인 항목만)
      return data
        .filter(item => item.holiday === true)
        .map(item => ({
          date: item.date,
          name: item.name,
          kind: item.kind,
          remarks: item.remarks
        }));
    } catch (error) {
      console.error('무료 API 호출 실패:', error);
      return [];
    }
  }

  /**
   * 특정 날짜가 공휴일인지 확인합니다.
   * @param {Date|string} date - 확인할 날짜
   * @returns {Promise<Object|null>} 공휴일 정보 또는 null
   */
  async isHoliday(date) {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const dateString = this.formatDate(targetDate);

    const holidays = await this.getHolidays(year);
    return holidays.find(holiday => holiday.date === dateString) || null;
  }

  /**
   * 특정 월의 공휴일을 가져옵니다.
   * @param {number} year - 연도
   * @param {number} month - 월 (1-12)
   * @returns {Promise<Array>} 해당 월의 공휴일 배열
   */
  async getHolidaysForMonth(year, month) {
    const holidays = await this.getHolidays(year);
    const monthStr = month.toString().padStart(2, '0');
    
    return holidays.filter(holiday => 
      holiday.date.startsWith(`${year}-${monthStr}`)
    );
  }

  /**
   * 여러 연도의 공휴일을 미리 로드합니다.
   * @param {Array<number>} years - 연도 배열
   */
  async preloadHolidays(years) {
    const promises = years.map(year => this.getHolidays(year));
    await Promise.allSettled(promises);
    console.log(`🚀 ${years.length}개 연도 공휴일 데이터 프리로드 완료`);
  }

  /**
   * 캐시를 초기화합니다.
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ 공휴일 캐시 초기화됨');
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷합니다.
   * @param {Date} date - 포맷할 날짜
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate(date) {
    // timezone 문제 해결을 위해 로컬 날짜로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * API 오류 시 사용할 기본 공휴일 데이터
   * @param {number} year - 연도
   * @returns {Array} 기본 공휴일 배열
   */
  getFallbackHolidays(year) {
    console.log(`🔄 ${year}년 기본 공휴일 데이터 사용`);
    
    // 고정 공휴일들 (매년 동일)
    const fixedHolidays = [
      { date: `${year}-01-01`, name: '신정', kind: 1 },
      { date: `${year}-03-01`, name: '삼일절', kind: 1 },
      { date: `${year}-05-05`, name: '어린이날', kind: 1 },
      { date: `${year}-06-06`, name: '현충일', kind: 1 },
      { date: `${year}-08-15`, name: '광복절', kind: 1 },
      { date: `${year}-10-03`, name: '개천절', kind: 1 },
      { date: `${year}-10-09`, name: '한글날', kind: 1 },
      { date: `${year}-12-25`, name: '크리스마스', kind: 1 }
    ];

    // 2025년 기준 음력 공휴일 (실제로는 매년 계산이 필요하지만 폴백용)
    const lunarHolidays = year === 2025 ? [
      { date: '2025-01-28', name: '설날 전날', kind: 1 },
      { date: '2025-01-29', name: '설날', kind: 1 },
      { date: '2025-01-30', name: '설날 다음날', kind: 1 },
      { date: '2025-05-05', name: '석가탄신일', kind: 1 },
      { date: '2025-10-05', name: '추석 연휴', kind: 1 },
      { date: '2025-10-06', name: '추석', kind: 1 },
      { date: '2025-10-07', name: '추석 연휴', kind: 1 },
      { date: '2025-10-08', name: '추석 대체공휴일', kind: 1 }
    ] : [];

    return [...fixedHolidays, ...lunarHolidays];
  }

  /**
   * 공휴일 종류별 색상을 반환합니다.
   * @param {number} kind - 공휴일 종류 (1: 공휴일, 2: 기념일, 3: 24절기, 4: 잡절)
   * @returns {string} CSS 색상
   */
  getHolidayColor(kind) {
    switch (kind) {
      case 1: return '#ff4757'; // 공휴일 - 빨간색
      case 2: return '#ffa502'; // 기념일 - 주황색
      case 3: return '#3742fa'; // 24절기 - 파란색
      case 4: return '#7bed9f'; // 잡절 - 연두색
      default: return '#ff4757';
    }
  }

  /**
   * 공휴일 종류명을 반환합니다.
   * @param {number} kind - 공휴일 종류
   * @returns {string} 종류명
   */
  getHolidayKindName(kind) {
    switch (kind) {
      case 1: return '공휴일';
      case 2: return '기념일';
      case 3: return '24절기';
      case 4: return '잡절';
      default: return '기타';
    }
  }
}

// 싱글톤 인스턴스 생성
const holidayService = new HolidayService();

export default holidayService;
