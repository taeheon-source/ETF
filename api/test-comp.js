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

  // GET 방식으로 Tab 프로브 (이전 테스트에서 POST → 405, GET → 400 확인됨)
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
    return {
      label,
      status: r.status,
      contentType: r.headers.get("content-type"),
      isJson,
      preview: text.slice(0, 500),
      size: text.length,
    };
  }

  const results = await Promise.all([
    // Tab4 (구성종목) - prodNo 쿼리스트링
    get("Tab4 ?prodNo=4460",    `${BASE}/prod/finder/productViewFormTab4Jquery?prodNo=${PROD_NO}`),
    // Tab1~3 비교 (응답 형식 확인)
    get("Tab3 ?prodNo=4460",    `${BASE}/prod/finder/productViewFormTab3Jquery?prodNo=${PROD_NO}`),
    get("Tab2 ?prodNo=4460",    `${BASE}/prod/finder/productViewFormTab2Jquery?prodNo=${PROD_NO}`),
    get("Tab1 ?prodNo=4460",    `${BASE}/prod/finder/productViewFormTab1Jquery?prodNo=${PROD_NO}`),
    // prodNo 없이 (400 원인 확인)
    get("Tab4 no param",        `${BASE}/prod/finder/productViewFormTab4Jquery`),
    // id= 파라미터도 시도
    get("Tab4 ?id=4460",        `${BASE}/prod/finder/productViewFormTab4Jquery?id=${PROD_NO}`),
  ]);

  res.status(200).json({ cookieStr, results });
};
