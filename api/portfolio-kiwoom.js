const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.kiwoometf.com";

/* 키움투자자산운용은 KOSEF와 히어로즈를 같은 사이트에서 서비스한다.
   gcode가 곧 티커라 상품을 늘릴 때 한 줄만 추가하면 된다. */
const PRODUCTS = {
  "130730": { name: "KOSEF 단기자금" },
  "419890": { name: "히어로즈 단기채권ESG액티브" },
};

const detailUrl = (gcode) => `${BASE}/service/etf/KO02010200M?gcode=${gcode}`;

/* 진단용. 상품 페이지에 지표가 있는지, 있다면 어떤 마크업인지 그대로
   보기 위한 것이다. 파서를 쓴 뒤 제거한다. */
function snippetAround(html, needle, radius = 300) {
  const index = html.indexOf(needle);
  if (index === -1) {
    return null;
  }
  return html.slice(Math.max(0, index - radius), index + radius).replace(/\s+/g, " ");
}

module.exports = async function handler(req, res) {
  /* 값이 하루에 한 번 바뀌므로 한 시간 캐시로 운용사 사이트를 아낀다.
     다만 만료 뒤 옛날 값을 먼저 내주면 아침 첫 조회에 어제 값이 보인다.
     그 동작(stale-while-revalidate)은 쓰지 않는다. */
  res.setHeader("Cache-Control", "s-maxage=3600");

  const ticker = req.query?.ticker || "130730";
  const product = PRODUCTS[ticker];
  if (!product) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(400).json({ error: `Unknown ticker: ${ticker}` });
  }

  try {
    const url = detailUrl(ticker);
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    const html = await response.text();

    if (req.query?.debug) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        requestedUrl: url,
        status: response.status,
        finalUrl: response.url,
        htmlLength: html.length,
        duration: snippetAround(html, "듀레이션"),
        ytm: snippetAround(html, "YTM"),
      });
    }

    res.status(200).json({
      name: product.name,
      ticker,
      updatedAt: new Date().toISOString().slice(0, 10),
      duration: null,
      ytm: null,
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: e.message });
  }
};
