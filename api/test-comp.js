const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://1qetf.com";
const REFERER = `${BASE}/pages/ETFproducts/ETF_items.view.php?etf_no=2`;

module.exports = async function handler(req, res) {
  const jsRes = await fetch(`${BASE}/pages/ETFproducts/js/process.pdf.js`, {
    headers: { "User-Agent": UA, Referer: REFERER },
  });
  const js = await jsRes.text();

  const fetchCalls = [...js.matchAll(/fetch\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const ajaxCalls = [...js.matchAll(/\$\.(?:ajax|get|post)\s*\(\s*{?[\s\S]{0,50}url\s*:\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const urlStrings = [...new Set([...js.matchAll(/["'`](\/[^"'`\n\s]{5,150})/g)].map(m => m[1]))];

  res.status(200).json({
    jsStatus: jsRes.status,
    jsLength: js.length,
    jsPreview: js.slice(0, 800),
    fetchCalls,
    ajaxCalls,
    urlStrings,
  });
};
