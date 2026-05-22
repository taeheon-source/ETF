const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;

function parseRows(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  return rows.map(r => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
    return cells.filter(c => c.length > 0);
  }).filter(r => r.length > 0);
}

async function ajax(url, body, cookieStr) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": DETAIL,
      "Origin": BASE,
      Cookie: cookieStr,
    },
    body,
  });
  const text = await r.text();
  return { status: r.status, text };
}

module.exports = async function handler(req, res) {
  const seedRes = await fetch(DETAIL, { headers: { "User-Agent": UA } });
  const cookieStr = (seedRes.headers.get("set-cookie") || "")
    .split(",").map(c => c.trim().split(";")[0]).join("; ");

  const body = "ksdFund=KR7272580002&pageIndex=1&pageUnit=200&firstIndex=0";

  const [pdfRes, pdfListRes] = await Promise.all([
    ajax(`${BASE}/tigeretf/ko/product/search/detail/pdf.ajax`, body, cookieStr),
    ajax(`${BASE}/tigeretf/ko/product/search/detail/pdfListAjax.ajax`, body, cookieStr),
  ]);

  const pdfRows = parseRows(pdfRes.text);
  const pdfListRows = parseRows(pdfListRes.text);

  // pdf.ajax tbody 주변 컨텍스트 확인
  const tbodyIdx = pdfRes.text.indexOf("<tbody");
  const tbodyContext = tbodyIdx > -1 ? pdfRes.text.slice(tbodyIdx, tbodyIdx + 500) : "tbody 없음";

  res.status(200).json({
    pdf: { status: pdfRes.status, htmlLength: pdfRes.text.length, rowCount: pdfRows.length, sample: pdfRows.slice(0, 3), tbodyContext },
    pdfList: { status: pdfListRes.status, htmlLength: pdfListRes.text.length, rowCount: pdfListRows.length, sample: pdfListRows.slice(0, 3), preview: pdfListRes.text.slice(0, 500) },
  });
};
