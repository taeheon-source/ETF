const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";
const REFERER = `${BASE}/etf/product/view.do?id=2ETF48`;

async function probe(url, body) {
  const isGet = !body;
  const r = await fetch(isGet ? url : url, {
    method: isGet ? "GET" : "POST",
    headers: {
      "User-Agent": UA,
      "Referer": REFERER,
      "Accept": "application/json, text/html, */*",
      "X-Requested-With": "XMLHttpRequest",
      ...(!isGet && { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    ...(body ? { body } : {}),
  });
  const text = await r.text();
  const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, isJson, preview: text.slice(0, 300), rowCount: json?.list?.length ?? json?.data?.length ?? (Array.isArray(json) ? json.length : null), keys: json && !Array.isArray(json) ? Object.keys(json) : null };
}

module.exports = async function handler(req, res) {
  const results = await Promise.all([
    probe(`${BASE}/etf/product/library/pdf.do?id=2ETF48`).then(r => ({ name: "pdf.do GET", ...r })),
    probe(`${BASE}/etf/product/library/pdf.do`, "id=2ETF48").then(r => ({ name: "pdf.do POST", ...r })),
    probe(`${BASE}/etf/product/library/pdf.do?id=2ETF48&type=json`).then(r => ({ name: "pdf.do GET+json", ...r })),
    // KODEX 단기채권PLUS id=2ETF4G, KODEX 단기채권 id=2ETF48 확인
    probe(`${BASE}/etf/product/view.do?id=2ETF48`).then(r => ({ name: "view.do GET (확인용)", ...r })),
  ]);

  res.status(200).json(results);
};
