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
    return {
      label,
      status: r.status,
      contentType: r.headers.get("content-type"),
      isJson,
      preview: text.slice(0, 400),
      keys: json && !Array.isArray(json) ? Object.keys(json) : null,
      rowCount: json?.list?.length ?? json?.data?.length ?? json?.result?.length ?? (Array.isArray(json) ? json.length : null),
    };
  } catch (e) {
    return { label, error: e.message };
  }
}

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

  const results = await Promise.all([
    // Main product data endpoint
    probe("2ETF48.do GET", `${BASE}/etf/product/2ETF48.do`),
    probe("2ETF48.do with date", `${BASE}/etf/product/2ETF48.do?gijunYMD=${today}`),

    // Alternative paths
    probe("api/2ETF48.do", `${BASE}/api/etf/product/2ETF48.do`),
    probe("etf/2ETF48.do", `${BASE}/etf/2ETF48.do`),

    // Try with different Accept header
    probe("2ETF48.do json accept", `${BASE}/etf/product/2ETF48.do`, {
      headers: { "Accept": "application/json" },
    }),

    // KODEX 단기채권PLUS - need to find its id
    probe("2ETF4G.do GET", `${BASE}/etf/product/2ETF4G.do`),
  ]);

  res.status(200).json(results);
};
