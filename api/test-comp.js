const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;

function parseTdValues(html) {
  return [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
    .filter(v => v.length > 0);
}

function parseRows(html) {
  // tbody 안의 tr들 파싱
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return [];
  const rows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  return rows.map(r => parseTdValues(r[1])).filter(r => r.length > 0);
}

module.exports = async function handler(req, res) {
  // 세션 쿠키 획득
  const seedRes = await fetch(DETAIL, { headers: { "User-Agent": UA } });
  const cookieStr = (seedRes.headers.get("set-cookie") || "")
    .split(",").map(c => c.trim().split(";")[0]).join("; ");

  // pdf.ajax 호출
  const r = await fetch(`${BASE}/tigeretf/ko/product/search/detail/pdf.ajax`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": DETAIL,
      "Origin": BASE,
      Cookie: cookieStr,
    },
    body: "ksdFund=KR7272580002&pageIndex=1&pageUnit=200",
  });

  const html = await r.text();
  const rows = parseRows(html);

  // 테이블 헤더도 추출
  const thMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const headers = thMatch
    ? [...thMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean)
    : [];

  res.status(200).json({
    status: r.status,
    htmlLength: html.length,
    headers,
    rowCount: rows.length,
    sample: rows.slice(0, 5),
    // 전체 데이터 확인용
    all: rows,
  });
};
