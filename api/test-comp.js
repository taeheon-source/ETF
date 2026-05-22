const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PAGE_URL = "https://www.samsungfund.com/etf/product/view.do?id=2ETF48";
const BASE = "https://www.samsungfund.com";

module.exports = async function handler(req, res) {
  const pageRes = await fetch(PAGE_URL, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", Referer: BASE },
  });
  const html = await pageRes.text();

  // JS 파일 목록
  const scripts = [...html.matchAll(/src=["']([^"']*\.js[^"'?#]*)/g)]
    .map(m => m[1].startsWith("http") ? m[1] : BASE + m[1])
    .filter(u => !u.includes("google") && !u.includes("analytics") && !u.includes("kakao") && !u.includes("jquery"));

  // 인라인 스크립트에서 API 패턴
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1].trim()).filter(s => s.length > 30);

  const fetchCalls = inlineScripts.flatMap(s => [...s.matchAll(/fetch\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]));
  const ajaxCalls = inlineScripts.flatMap(s => [...s.matchAll(/\$\.(?:ajax|get|post)\s*\(\s*["'`]([^"'`\n]+)/g)].map(m => m[1]));
  const doUrls = [...new Set([...html.matchAll(/["'](\/etf\/[^"'\s]*\.do[^"'\s]*)/g)].map(m => m[1]))];
  const apiUrls = [...new Set([...html.matchAll(/["'](\/[^"'\s]*(?:api|ajax|portfolio|pdf|component|holding)[^"'\s]*)/gi)].map(m => m[1]))];

  res.status(200).json({
    status: pageRes.status,
    htmlLength: html.length,
    hasPortfolioText: html.includes("구성종목") || html.includes("PDF"),
    scripts: scripts.slice(0, 8),
    fetchCalls,
    ajaxCalls,
    doUrls: doUrls.slice(0, 20),
    apiUrls,
    inlineScriptCount: inlineScripts.length,
    inlinePreview: inlineScripts.slice(0, 3).map(s => s.slice(0, 200)),
  });
};
