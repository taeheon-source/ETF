const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PROD_NO = "4460"; // RISE 단기국공채액티브
const PAGE_URL = `${BASE}/prod/finderDetail/${PROD_NO}`;

module.exports = async function handler(req, res) {
  // 세션 쿠키 획득
  const seedRes = await fetch(PAGE_URL, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const rawCookie = seedRes.headers.get("set-cookie") || "";
  const cookieStr = rawCookie.split(/,(?=[^ ])/g)
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");

  async function get(label, url) {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Referer": PAGE_URL,
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookieStr,
      },
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    // HTML이면 테이블/목록 행 수 추출
    const tableRows = (text.match(/<tr/gi) || []).length;
    return {
      label,
      status: r.status,
      contentType: r.headers.get("content-type"),
      isJson,
      tableRows,
      size: text.length,
      preview: text.slice(0, 400),
    };
  }

  const results = await Promise.all([
    // 핵심: GET + prodNo 쿼리스트링 (이전 테스트: POST→405, GET no param→400)
    get("Tab4 ?prodNo=4460",                      `${BASE}/prod/finder/productViewFormTab4Jquery?prodNo=${PROD_NO}`),
    get("Tab4 ?searchFlag=viewtab4",              `${BASE}/prod/finder/productViewFormTab4Jquery?searchFlag=viewtab4`),
    get("Tab4 ?prodNo&searchFlag",                `${BASE}/prod/finder/productViewFormTab4Jquery?prodNo=${PROD_NO}&searchFlag=viewtab4`),
    // 전체 페이지에 탭 내용 포함 여부
    get("FullPage ?searchFlag=viewtab4",          `${BASE}/prod/finderDetail/${PROD_NO}?searchFlag=viewtab4`),
    // Tab1~3 비교
    get("Tab3 ?prodNo=4460",                      `${BASE}/prod/finder/productViewFormTab3Jquery?prodNo=${PROD_NO}`),
    get("Tab1 ?prodNo=4460",                      `${BASE}/prod/finder/productViewFormTab1Jquery?prodNo=${PROD_NO}`),
  ]);

  res.status(200).json({ cookieStr, results });
};
