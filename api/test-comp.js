const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";
const REFERER = `${BASE}/etf/product/view.do?id=2ETF48`;

module.exports = async function handler(req, res) {
  const jsRes = await fetch(`${BASE}/assets/js/product.js`, {
    headers: { "User-Agent": UA, Referer: REFERER },
  });
  const js = await jsRes.text();

  const fetchCalls = [...js.matchAll(/fetch\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const ajaxCalls = [...js.matchAll(/\$\.(?:ajax|get|post)\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const apiUrls = [...new Set([...js.matchAll(/["'`](\/[^"'`\s\n]{5,150})/g)].map(m => m[1]))].filter(u =>
    /api|ajax|portfolio|pdf|component|holding|product|etf/i.test(u)
  );

  // portfolio/pdf 관련 컨텍스트
  const pdfIdx = js.toLowerCase().indexOf("portfolio");
  const pdfIdx2 = js.toLowerCase().indexOf("pdf");
  const compIdx = js.toLowerCase().indexOf("component");

  res.status(200).json({
    jsLength: js.length,
    fetchCalls,
    ajaxCalls,
    apiUrls: apiUrls.slice(0, 30),
    pdfContext: pdfIdx > -1 ? js.slice(Math.max(0, pdfIdx - 50), pdfIdx + 300) : null,
    pdf2Context: pdfIdx2 > -1 ? js.slice(Math.max(0, pdfIdx2 - 50), pdfIdx2 + 300) : null,
    compContext: compIdx > -1 ? js.slice(Math.max(0, compIdx - 50), compIdx + 300) : null,
  });
};
