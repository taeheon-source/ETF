const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE_TIGER = "https://investments.miraeasset.com";

async function get(url, referer) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Referer: referer || url, "Accept-Language": "ko-KR,ko;q=0.9" } });
  return { status: r.status, text: await r.text() };
}

module.exports = async function handler(req, res) {
  const detailUrl = `${BASE_TIGER}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;
  const { text: html } = await get(detailUrl, BASE_TIGER);

  // 1. HTML 안에 포트폴리오 관련 데이터 직접 탐색
  const tableMatch = html.match(/구성종목[\s\S]{0,5000}/);
  const pdfMatch = html.match(/pdf[\s\S]{0,2000}/i);

  // 2. HTML에서 모든 .do URL 추출
  const doUrls = [...new Set([...html.matchAll(/["'](\/tigeretf[^"'\s]*\.do[^"'\s]*)/g)].map(m => m[1]))];

  // 3. JS 파일 목록 추출해서 product/detail 관련 JS 파일 스캔
  const scriptUrls = [...html.matchAll(/src=["']([^"']*\.js[^"'?#]*)/g)]
    .map(m => m[1].startsWith("http") ? m[1] : BASE_TIGER + m[1])
    .filter(u => !u.includes("jquery") && !u.includes("swiper") && !u.includes("masonry") && !u.includes("sns") && !u.includes("tracking"));

  // 4. 나머지 JS 파일 전체 스캔 - .do URL 패턴
  const jsScans = await Promise.allSettled(
    scriptUrls.map(async (url) => {
      const { text } = await get(url, BASE_TIGER);
      const doHits = [...new Set([...text.matchAll(/["'`](\/tigeretf[^"'`\s]{5,200})/g)].map(m => m[1]))]
        .filter(u => /portfolio|pdf|component|deposit|holding|composition|search\/detail/i.test(u));
      const allDos = [...new Set([...text.matchAll(/["'`](\/tigeretf\/ko[^"'`\s]{5,150}\.do[^"'`\s]*)/g)].map(m => m[1]))];
      return { url: url.replace(BASE_TIGER, ""), doHits, allDos: allDos.slice(0, 10) };
    })
  );

  const jsHits = jsScans
    .filter(r => r.status === "fulfilled" && (r.value.doHits.length > 0 || r.value.allDos.length > 0))
    .map(r => r.value);

  res.status(200).json({
    htmlLength: html.length,
    hasPortfolioText: html.includes("구성종목") || html.includes("portfolio"),
    tablePreview: tableMatch ? tableMatch[0].slice(0, 500) : null,
    doUrlsInHtml: doUrls.slice(0, 30),
    scannedJsFiles: scriptUrls.length,
    jsHits,
  });
};
