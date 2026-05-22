const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

async function fetchPdf(productId) {
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
  return {
    status: r.status,
    gijunYMD: pdf?.gijunYMD,
    totalCnt: pdf?.totalCnt,
    sample: pdf?.list?.slice(0, 2),
  };
}

module.exports = async function handler(req, res) {
  const [etf48, etf35] = await Promise.all([
    fetchPdf("2ETF48"),
    fetchPdf("2ETF35"),
  ]);

  res.status(200).json({
    "KODEX 단기채권 (2ETF48)": etf48,
    "KODEX 단기채권PLUS (2ETF35)": etf35,
  });
};
