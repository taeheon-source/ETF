const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";
const REFERER = `${BASE}/etf/product/view.do?id=2ETF48`;

async function probe(label, url, opts = {}) {
  try {
    const r = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        "User-Agent": UA,
        "Referer": REFERER,
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        ...(opts.headers || {}),
      },
      ...(opts.body ? { body: opts.body } : {}),
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    let json = null;
    try { json = JSON.parse(text); } catch {}

    // 구성종목 배열 찾기
    const listKey = json ? Object.keys(json).find(k => Array.isArray(json[k]) && json[k].length > 0) : null;
    const sampleRow = listKey ? json[listKey][0] : null;

    return {
      label,
      status: r.status,
      contentType: r.headers.get("content-type"),
      isJson,
      preview: text.slice(0, 500),
      topKeys: json && !Array.isArray(json) ? Object.keys(json) : null,
      listKey,
      rowCount: listKey ? json[listKey].length : (Array.isArray(json) ? json.length : null),
      sampleRow,
    };
  } catch (e) {
    return { label, error: e.message };
  }
}

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  const results = await Promise.all([
    // 확인된 URL
    probe("2ETF48.do", `${BASE}/api/v1/kodex/product/2ETF48.do`),
    probe("2ETF48.do?date", `${BASE}/api/v1/kodex/product/2ETF48.do?gijunYMD=${today}`),

    // KODEX 단기채권PLUS - id 추정
    probe("2ETF4G.do", `${BASE}/api/v1/kodex/product/2ETF4G.do`),
    probe("2ETF4H.do", `${BASE}/api/v1/kodex/product/2ETF4H.do`),
  ]);

  res.status(200).json(results);
};
