const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PAGE_URL = `${BASE}/prod/finderDetail/4460`;
const TAB4_URL = `${BASE}/prod/finder/productViewFormTab4Jquery`;

module.exports = async function handler(req, res) {
  // 세션 쿠키 획득
  const seedRes = await fetch(PAGE_URL, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const cookieStr = (seedRes.headers.get("set-cookie") || "")
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");

  const r = await fetch(TAB4_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": PAGE_URL,
      "Accept": "*/*",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cookie": cookieStr,
    },
    body: "fundCd=4460",
  });

  const text = await r.text();
  const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");

  res.status(200).json({
    cookieStr,
    status: r.status,
    contentType: r.headers.get("content-type"),
    isJson,
    preview: text.slice(0, 1000),
  });
};
