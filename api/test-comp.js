const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;

module.exports = async function handler(req, res) {
  // 1단계: 상세 페이지에서 세션 쿠키 획득
  const seedRes = await fetch(DETAIL, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const rawCookies = seedRes.headers.get("set-cookie") || "";
  const cookieStr = rawCookies.split(",").map(c => c.trim().split(";")[0]).join("; ");

  // 2단계: pdf.ajax 호출 (파라미터 조합별로 시도)
  const candidates = [
    { url: `${BASE}/tigeretf/ko/product/search/detail/pdf.ajax`, body: "ksdFund=KR7272580002" },
    { url: `${BASE}/tigeretf/ko/product/search/detail/pdf.ajax`, body: "ksdFund=KR7272580002&pageIndex=1&pageUnit=100" },
    { url: `${BASE}/tigeretf/ko/product/search/detail/pdf.ajax?ksdFund=KR7272580002`, body: "" },
  ];

  const results = await Promise.all(candidates.map(async ({ url, body }, i) => {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": DETAIL,
        "Origin": BASE,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9",
        ...(cookieStr ? { Cookie: cookieStr } : {}),
      },
      body,
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      i,
      status: r.status,
      isJson,
      preview: text.slice(0, 300),
      rowCount: json?.list?.length ?? json?.data?.length ?? json?.items?.length ?? (Array.isArray(json) ? json.length : null),
      keys: json ? Object.keys(json) : null,
    };
  }));

  res.status(200).json({ cookieStr, results });
};
