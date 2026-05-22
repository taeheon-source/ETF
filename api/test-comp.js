const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PAGE_URL = "https://1qetf.com/pages/ETFproducts/ETF_items.view.php?etf_no=2";
const BASE = "https://1qetf.com";

module.exports = async function handler(req, res) {
  const r = await fetch(PAGE_URL, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", Referer: BASE },
  });
  const html = await r.text();

  // 스크립트 URL 추출
  const scripts = [...html.matchAll(/src=["']([^"']*\.js[^"'?#]*)/g)]
    .map(m => m[1].startsWith("http") ? m[1] : BASE + m[1])
    .filter(u => !u.includes("jquery") && !u.includes("google") && !u.includes("analytics"));

  // fetch/ajax/XMLHttpRequest 패턴 추출
  const fetchPatterns = [...html.matchAll(/fetch\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]);
  const ajaxUrls = [...html.matchAll(/(?:url|src)\s*[:=]\s*["'`]([^"'`\n]{5,150})/g)]
    .map(m => m[1]).filter(u => u.includes("/") && !u.includes("font") && !u.includes("css"));
  const phpUrls = [...new Set([...html.matchAll(/["'`](\/[^"'`\s]*\.php[^"'`\s]*)/g)].map(m => m[1]))];
  const apiUrls = [...new Set([...html.matchAll(/["'`](\/[^"'`\s]*(?:api|ajax|data|portfolio|component|pdf|holding)[^"'`\s]*)/gi)].map(m => m[1]))];

  res.status(200).json({
    status: r.status,
    htmlLength: html.length,
    hasPortfolioText: html.includes("구성종목") || html.includes("portfolio") || html.includes("PDF"),
    scripts: scripts.slice(0, 10),
    fetchPatterns,
    ajaxUrls: ajaxUrls.slice(0, 20),
    phpUrls: phpUrls.slice(0, 20),
    apiUrls,
    // 인라인 스크립트 내용 미리보기
    inlineScripts: [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
      .map(m => m[1].trim()).filter(s => s.length > 50).slice(0, 5).map(s => s.slice(0, 300)),
  });
};
