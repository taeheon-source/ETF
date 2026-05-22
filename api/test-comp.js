const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE_TIGER = "https://investments.miraeasset.com";
const BASE_KODEX = "https://www.kodex.com";

async function get(url, referer) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Referer: referer || url } });
  return { status: r.status, text: await r.text() };
}

function extractScripts(html, base) {
  return [...html.matchAll(/src=["']([^"']*\.js[^"'?#]*)/g)]
    .map(m => m[1].startsWith("http") ? m[1] : base + m[1])
    .filter(u => !u.includes("google") && !u.includes("analytics") && !u.includes("kakao") && !u.includes("daum"));
}

function findPortfolioPatterns(js) {
  const hits = new Set();
  // URL 패턴
  for (const m of js.matchAll(/["'`](\/[^"'`\s]{5,150})/g)) {
    const u = m[1];
    if (/portfolio|component|composition|pdf|holding|etf.*detail|deposit/i.test(u)) hits.add(u);
  }
  // ajax/fetch 호출
  for (const m of js.matchAll(/(?:url|href|src)\s*[:=+]\s*["'`]([^"'`\n]{5,150})/g)) {
    const u = m[1];
    if (/portfolio|component|deposit|holding|\.do|\.json/i.test(u)) hits.add(u);
  }
  return [...hits];
}

module.exports = async function handler(req, res) {
  // 1. TIGER HTML에서 JS 파일 목록 추출
  const { text: tigerHtml } = await get(
    `${BASE_TIGER}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`,
    BASE_TIGER
  );
  const tigerScripts = extractScripts(tigerHtml, BASE_TIGER);

  // 2. TIGER JS 파일 병렬 스캔
  const tigerJsResults = await Promise.allSettled(
    tigerScripts.map(async (url) => {
      const { text } = await get(url, BASE_TIGER);
      const patterns = findPortfolioPatterns(text);
      return { url: url.replace(BASE_TIGER, ""), patterns };
    })
  );

  const tigerHits = tigerJsResults
    .filter(r => r.status === "fulfilled" && r.value.patterns.length > 0)
    .map(r => r.value);

  // 3. 직접 엔드포인트 후보 시도
  const candidates = [
    // TIGER 후보
    `${BASE_TIGER}/tigeretf/ko/product/search/detail/portfolioList.do?ksdFund=KR7272580002`,
    `${BASE_TIGER}/tigeretf/ko/product/pdf/list.do?ksdFund=KR7272580002`,
    `${BASE_TIGER}/tigeretf/ko/product/search/detail/component.do?ksdFund=KR7272580002`,
    `${BASE_TIGER}/tigeretf/ko/product/search/composition.do?ksdFund=KR7272580002`,
    `${BASE_TIGER}/tigeretf/ko/product/holding/list.do?ksdFund=KR7272580002`,
    // KODEX 후보
    `${BASE_KODEX}/etf/product/portfolioDepositFile.do?id=2AAIG`,
    `${BASE_KODEX}/etf/product/component.do?id=2AAIG`,
    `${BASE_KODEX}/etf/product/portfolio.do?id=2AAIG`,
    `${BASE_KODEX}/api/v1/etf/portfolio?id=2AAIG`,
    `${BASE_KODEX}/api/v1/etf/component?isinCd=KR7153130000`,
  ];

  const probeResults = await Promise.all(
    candidates.map(async (url) => {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": UA, Referer: url.includes("miraeasset") ? BASE_TIGER : BASE_KODEX },
        });
        const text = await r.text();
        const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
        return { url: url.replace(BASE_TIGER, "T").replace(BASE_KODEX, "K"), status: r.status, isJson, preview: text.slice(0, 100) };
      } catch(e) {
        return { url, error: e.message };
      }
    })
  );

  res.status(200).json({ tigerJsHits: tigerHits, probeResults });
};
