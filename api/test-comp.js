// TIGER ETF 상세 페이지 HTML 파싱으로 구성종목 추출 테스트
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";

function parseTable(html) {
  // <tbody class="listArea"> 안의 <tr> 파싱
  const tbodyMatch = html.match(/<tbody[^>]*class="[^"]*listArea[^"]*"[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return null;

  const tbody = tbodyMatch[1];
  const rows = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];

  return rows.map(rowMatch => {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim());
    return cells;
  }).filter(row => row.length > 0 && row.some(c => c.length > 0));
}

module.exports = async function handler(req, res) {
  const url = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", Referer: BASE },
  });
  const html = await r.text();

  const rows = parseTable(html);

  if (!rows) {
    // listArea 못찾으면 HTML에서 주변 컨텍스트 확인
    const idx = html.indexOf("listArea");
    return res.status(200).json({
      found: false,
      listAreaContext: idx > -1 ? html.slice(Math.max(0, idx - 100), idx + 500) : "없음",
    });
  }

  res.status(200).json({
    found: true,
    rowCount: rows.length,
    sample: rows.slice(0, 3),
    all: rows,
  });
};
