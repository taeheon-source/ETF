// 운용사 사이트 HTML에서 포트폴리오 API 엔드포인트 추출
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function extractApiHints(name, url, referer) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html", "Referer": referer || url },
    });
    const text = await r.text();

    // JS 파일 URL 추출
    const scriptUrls = [...text.matchAll(/src=["']([^"']*\.js[^"']*)/g)].map(m => m[1]).filter(u => !u.includes("google") && !u.includes("analytics"));

    // 인라인 JS에서 API 패턴 추출
    const apiPatterns = [
      ...text.matchAll(/["'`]([^"'`]*(?:portfolio|component|composition|holdings|pdf|etf)[^"'`]*\.(?:json|do|action|api)[^"'`]*)/gi)
    ].map(m => m[1]).filter(u => u.length < 200);

    const fetchPatterns = [
      ...text.matchAll(/fetch\s*\(\s*["'`]([^"'`]+)/g)
    ].map(m => m[1]);

    const ajaxPatterns = [
      ...text.matchAll(/url\s*:\s*["'`]([^"'`]+(?:portfolio|component|pdf|composition)[^"'`]*)/gi)
    ].map(m => m[1]);

    return { name, status: r.status, scriptCount: scriptUrls.length, scriptUrls: scriptUrls.slice(0, 5), apiPatterns, fetchPatterns, ajaxPatterns };
  } catch(e) {
    return { name, error: e.message };
  }
}

async function fetchScript(name, url, baseUrl) {
  try {
    const r = await fetch(url.startsWith("http") ? url : baseUrl + url, {
      headers: { "User-Agent": UA },
    });
    const text = await r.text();
    // 포트폴리오 관련 API 패턴 찾기
    const patterns = [
      ...text.matchAll(/["'`]([^"'`]*(?:portfolio|component|holdings|pdf|etf\/api)[^"'`]{0,100})/gi)
    ].map(m => m[1]).filter(u => u.includes("/") && u.length < 200);
    return { name, patterns: [...new Set(patterns)].slice(0, 20) };
  } catch(e) {
    return { name, error: e.message };
  }
}

module.exports = async function handler(req, res) {
  const [kodex, tiger, etf1q] = await Promise.all([
    extractApiHints("kodex", "https://www.kodex.com/product_etf_details.do?fId=2AAIG&menuId=201", "https://www.kodex.com"),
    extractApiHints("tiger", "https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002", "https://investments.miraeasset.com"),
    extractApiHints("1qetf", "https://www.1qetf.com/etf/view?code=463290", "https://www.1qetf.com"),
  ]);

  // KODEX JS 파일에서 추가 탐색
  const kodexBase = "https://www.kodex.com";
  const jsResults = await Promise.all(
    (kodex.scriptUrls || []).slice(0, 3).map(u => fetchScript("kodex-js", u, kodexBase))
  );

  res.status(200).json({ kodex, tiger, etf1q, kodexJsPatterns: jsResults });
};
