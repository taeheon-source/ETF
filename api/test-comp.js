const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;
const LIST_URL = `${BASE}/tigeretf/ko/product/search/detail/pdfListAjax.ajax`;

function parseRows(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  return rows.map(r => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
    return cells.filter(c => c.length > 0);
  }).filter(r => r.length >= 4);
}

function getTotalCount(html) {
  const m = html.match(/data-tot-cnt="(\d+)"/);
  return m ? parseInt(m[1]) : 0;
}

async function fetchPage(pageIndex, cookieStr) {
  const r = await fetch(LIST_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": DETAIL,
      "Origin": BASE,
      Cookie: cookieStr,
    },
    body: `ksdFund=KR7272580002&pageIndex=${pageIndex}&firstIndex=${(pageIndex - 1) * 10}`,
  });
  return r.text();
}

module.exports = async function handler(req, res) {
  // 세션 쿠키 획득
  const seedRes = await fetch(DETAIL, { headers: { "User-Agent": UA } });
  const cookieStr = (seedRes.headers.get("set-cookie") || "")
    .split(",").map(c => c.trim().split(";")[0]).join("; ");

  // 1페이지로 총 건수 파악
  const page1Html = await fetchPage(1, cookieStr);
  const totalCount = getTotalCount(page1Html);
  const totalPages = Math.ceil(totalCount / 10);

  // 나머지 페이지 병렬 요청
  const restHtmls = totalPages > 1
    ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2, cookieStr)))
    : [];

  const allRows = [page1Html, ...restHtmls].flatMap(parseRows);

  res.status(200).json({
    totalCount,
    totalPages,
    rowCount: allRows.length,
    headers: ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)", "1주 수익률"],
    sample: allRows.slice(0, 5),
    all: allRows,
  });
};
