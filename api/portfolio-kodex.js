const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

const PRODUCTS = {
  "152380": { id: "2ETF48", name: "KODEX 단기채권" },
  "476050": { id: "2ETF35", name: "KODEX 단기채권PLUS" },
};

const SKIP_CODES = new Set(["CASH00000001", "KRD010010001"]);

async function fetchHoldings(productId, etfId) {
  const r = await fetch(`${BASE}/api/v1/kodex/product/${productId}.do`, {
    headers: {
      "User-Agent": UA,
      "Referer": `${BASE}/etf/product/view.do?id=${productId}`,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const json = await r.json();
  const pdf = json.pdf;
  if (!pdf?.list) throw new Error("pdf.list not found");

  const holdings = pdf.list
    .filter(r => !SKIP_CODES.has(r.itmNo))
    .sort((a, b) => Number(b.ratio) - Number(a.ratio))
    .map(r => ({
      code: r.itmNo,
      name: r.secNm,
      quantity: Number(r.applyQ).toLocaleString("ko-KR"),
      value: Number(r.evalA).toLocaleString("ko-KR"),
      weight: Number(r.ratio).toFixed(2),
    }));

  return {
    updatedAt: pdf.gijunYMD
      ? `${pdf.gijunYMD.slice(0, 4)}-${pdf.gijunYMD.slice(4, 6)}-${pdf.gijunYMD.slice(6, 8)}`
      : new Date().toISOString(),
    holdings,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  const ticker = req.query?.ticker || "152380";
  const product = PRODUCTS[ticker];
  if (!product) {
    return res.status(400).json({ error: `Unknown ticker: ${ticker}` });
  }

  try {
    const { updatedAt, holdings } = await fetchHoldings(product.id, ticker);
    res.status(200).json({
      name: product.name,
      ticker,
      updatedAt,
      headers: ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"],
      totalCount: holdings.length,
      holdings,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
