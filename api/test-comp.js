const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PAGE_URL = `${BASE}/prod/finderDetail/4460`;
const TAB4_URL = `${BASE}/prod/finder/productViewFormTab4Jquery`;

module.exports = async function handler(req, res) {
  // 1) 세션 쿠키 획득
  const seedRes = await fetch(PAGE_URL, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
  });
  const rawCookie = seedRes.headers.get("set-cookie") || "";
  const cookieStr = rawCookie.split(",")
    .map(c => c.trim().split(";")[0])
    .filter(Boolean)
    .join("; ");

  // 2) Tab4 POST - 다양한 body 파라미터 조합 테스트
  async function postTab4(label, body) {
    const r = await fetch(TAB4_URL, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Referer": PAGE_URL,
        "Accept": "*/*",
        "Cookie": cookieStr,
      },
      body,
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    return {
      label, status: r.status, isJson,
      contentType: r.headers.get("content-type"),
      preview: text.slice(0, 500),
    };
  }

  const results = await Promise.all([
    postTab4("prodNo=4460",         "prodNo=4460"),
    postTab4("id=4460",             "id=4460"),
    postTab4("prodNo=4460&tab=4",   "prodNo=4460&tab=4"),
    postTab4("prodCd=4460",         "prodCd=4460"),
    postTab4("etfNo=4460",          "etfNo=4460"),
    postTab4("no=4460",             "no=4460"),
  ]);

  res.status(200).json({ cookieStr, results });
};
