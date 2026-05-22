const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

module.exports = async function handler(req, res) {
  // ETF 목록 HTML에서 2ETF 패턴 상품 ID 추출
  const html = await fetch(`${BASE}/etf/product/list.do`, {
    headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
  }).then(r => r.text());

  // 가능한 모든 2ETF 패턴 추출
  const ids = [...new Set([
    ...[...html.matchAll(/['"](2ETF[A-Z0-9]{2})['"]/g)].map(m => m[1]),
    ...[...html.matchAll(/id=(2ETF[A-Z0-9]{2})/g)].map(m => m[1]),
    ...[...html.matchAll(/fId=(2ETF[A-Z0-9]{2})/g)].map(m => m[1]),
    ...[...html.matchAll(/data-id="(2ETF[A-Z0-9]{2})"/g)].map(m => m[1]),
  ])];

  // 476050 (KODEX 단기채권PLUS 티커) 관련 텍스트 주변 컨텍스트
  const idx476 = html.indexOf("476050");
  const ctx476 = idx476 >= 0 ? html.slice(Math.max(0, idx476 - 100), idx476 + 200) : "not found";

  // 단기채권 관련 텍스트 주변
  const idx단기 = html.indexOf("단기채권PLUS");
  const ctx단기 = idx단기 >= 0 ? html.slice(Math.max(0, idx단기 - 100), idx단기 + 300) : "not found";

  res.status(200).json({
    etf_ids_found: ids,
    ctx_476050: ctx476,
    ctx_단기채권PLUS: ctx단기,
    html_length: html.length,
  });
};
