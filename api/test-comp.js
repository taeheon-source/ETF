const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://1qetf.com";
const PAGE_URL = `${BASE}/pages/ETFproducts/ETF_items.view.php?etf_no=2`;
const AJAX_URL = `${BASE}/pages/ETFproducts/ajax/process.php`;

module.exports = async function handler(req, res) {
  // 1. 페이지에서 etf_code 추출
  const pageRes = await fetch(PAGE_URL, { headers: { "User-Agent": UA } });
  const html = await pageRes.text();
  const etfCodeMatch = html.match(/id="etf_code"[^>]*value="([^"]+)"/);
  const etfCode = etfCodeMatch ? etfCodeMatch[1] : null;

  // 2. ajax/process.php 호출
  const ajaxRes = await fetch(AJAX_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": PAGE_URL,
      "Origin": BASE,
    },
    body: `mode=get.pdf&etf_code=${etfCode || ""}`,
  });

  const text = await ajaxRes.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}

  res.status(200).json({
    etfCode,
    ajaxStatus: ajaxRes.status,
    isJson: text.trimStart().startsWith("{"),
    preview: text.slice(0, 500),
    success: json?.success,
    rowCount: json?.results?.length ?? null,
    sampleKeys: json?.results?.[0] ? Object.keys(json.results[0]) : null,
    sample: json?.results?.slice(0, 3) ?? null,
  });
};
