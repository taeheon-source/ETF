const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://1qetf.com";
const PAGE_URL = `${BASE}/pages/ETFproducts/ETF_items.view.php?etf_no=2`;
const AJAX_URL = `${BASE}/pages/ETFproducts/ajax/process.php`;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const ajaxRes = await fetch(AJAX_URL, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": PAGE_URL,
        "Origin": BASE,
      },
      body: "mode=get.pdf&etf_code=463290",
    });

    const json = await ajaxRes.json();
    if (!json.success) throw new Error("API returned success=false");

    const holdings = json.results
      .filter(r => r.F16004 !== "설정현금액" && r.F16004 !== "원화현금")
      .sort((a, b) => Number(b.F34743) - Number(a.F34743))
      .map(r => ({
        code: r.F16316 || "-",
        name: r.F16004 || "-",
        quantity: r.F16499 || "-",
        value: Number(r.F34840).toLocaleString("ko-KR"),
        weight: (Number(r.F34743) / 100).toFixed(2),
      }));

    res.status(200).json({
      name: "1Q 단기금융채액티브",
      ticker: "463290",
      updatedAt: new Date().toISOString(),
      headers: ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"],
      totalCount: holdings.length,
      holdings,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
