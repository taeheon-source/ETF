const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://1qetf.com";

module.exports = async function handler(req, res) {
  // process.pdf.js 내용 확인
  const jsRes = await fetch(`${BASE}/js/process.pdf.js`, {
    headers: { "User-Agent": UA, Referer: `${BASE}/pages/ETFproducts/ETF_items.view.php?etf_no=2` },
  });
  const js = await jsRes.text();

  // URL 패턴 추출
  const urls = [...new Set([...js.matchAll(/["'`]([^"'`\n]{5,200})/g)].map(m => m[1]).filter(u => u.includes("/") || u.includes("php") || u.includes("ajax")))];
  const fetchCalls = [...js.matchAll(/fetch\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const ajaxCalls = [...js.matchAll(/\$\.(?:ajax|get|post)\s*\(\s*["'`]?([^"'`\n,)]{5,150})/g)].map(m => m[1]);
  const xhrOpen = [...js.matchAll(/\.open\s*\([^,]+,\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);

  res.status(200).json({
    jsStatus: jsRes.status,
    jsLength: js.length,
    jsPreview: js.slice(0, 500),
    fetchCalls,
    ajaxCalls,
    xhrOpen,
    urlsFound: urls.slice(0, 30),
  });
};
