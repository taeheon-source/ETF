const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PAGE_URL = `${BASE}/prod/finderDetail/4460`;

module.exports = async function handler(req, res) {
  // 세션 쿠키 획득 (리다이렉트 포함)
  const seedRes = await fetch(PAGE_URL, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const setCookie = seedRes.headers.get("set-cookie") || "";
  const cookieStr = setCookie.split(/,(?=[^ ])/g)
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");

  const finalUrl = seedRes.url;

  async function probe(label, url, method = "POST", body = "prodNo=4460") {
    const headers = {
      "User-Agent": UA,
      "Referer": PAGE_URL,
      "Accept": "*/*",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cookie": cookieStr,
    };
    if (method === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    }
    const r = await fetch(url, {
      method,
      headers,
      ...(method === "POST" ? { body } : {}),
    });
    const text = await r.text();
    return { label, status: r.status, preview: text.slice(0, 300) };
  }

  const results = await Promise.all([
    // 정확한 경로 변형들
    probe("POST /prod/finder/productViewFormTab4Jquery", `${BASE}/prod/finder/productViewFormTab4Jquery`),
    probe("POST /finder/productViewFormTab4Jquery", `${BASE}/finder/productViewFormTab4Jquery`),
    probe("POST /ETF/prod/finder/productViewFormTab4Jquery", `${BASE}/ETF/prod/finder/productViewFormTab4Jquery`),
    probe("GET /prod/finder/productViewFormTab4Jquery", `${BASE}/prod/finder/productViewFormTab4Jquery`, "GET", null),
    // Tab 번호 변형
    probe("POST Tab3", `${BASE}/prod/finder/productViewFormTab3Jquery`),
    probe("POST Tab2", `${BASE}/prod/finder/productViewFormTab2Jquery`),
    probe("POST Tab1", `${BASE}/prod/finder/productViewFormTab1Jquery`),
  ]);

  res.status(200).json({ cookieStr, finalUrl, results });
};
