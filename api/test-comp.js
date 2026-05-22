const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

async function getJson(url, referer) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Referer": referer || `${BASE}/`,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, preview: text.slice(0, 200) };
}

module.exports = async function handler(req, res) {
  // 1) 2ETF48.do의 pdf 키 확인 (구성종목)
  const r48 = await getJson(
    `${BASE}/api/v1/kodex/product/2ETF48.do`,
    `${BASE}/etf/product/view.do?id=2ETF48`
  );

  // 2) Samsung fund ETF 목록 HTML에서 단기채권PLUS ID 추출
  const listHtml = await fetch(`${BASE}/etf/product/list.do`, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
  }).then(r => r.text());

  // id="2ETFxx" 패턴 추출
  const ids = [...listHtml.matchAll(/id=([A-Z0-9]{6})/g)].map(m => m[1]);
  const uniqueIds = [...new Set(ids)];

  // 3) pdf 키 구조 샘플
  const pdf = r48.json?.pdf;
  const pdfSample = Array.isArray(pdf) ? pdf.slice(0, 2) : pdf;

  res.status(200).json({
    etf48_pdf_type: Array.isArray(pdf) ? "array" : typeof pdf,
    etf48_pdf_count: Array.isArray(pdf) ? pdf.length : null,
    etf48_pdf_sample: pdfSample,
    etf48_all_keys: r48.json ? Object.keys(r48.json) : null,
    list_page_ids: uniqueIds.slice(0, 30),
  });
};
