const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PAGE_URL = `${BASE}/prod/finderDetail/4460`;

async function get(label, url, opts = {}) {
  try {
    const r = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        "User-Agent": UA,
        "Referer": PAGE_URL,
        "Accept": opts.accept || "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        ...(opts.headers || {}),
      },
      ...(opts.body ? { body: opts.body } : {}),
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      label, status: r.status, isJson,
      preview: text.slice(0, 400),
      keys: json && !Array.isArray(json) ? Object.keys(json) : null,
      rowCount: json?.list?.length ?? json?.data?.length ?? (Array.isArray(json) ? json.length : null),
    };
  } catch (e) {
    return { label, error: e.message };
  }
}

module.exports = async function handler(req, res) {
  // 1) 페이지 HTML에서 JS 파일 및 API 패턴 추출
  const html = await fetch(PAGE_URL, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
  }).then(r => r.text());

  // script src 추출
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  // API 패턴 추출 (ajax, api, fetch 포함 경로)
  const apiPaths = [...new Set([
    ...[...html.matchAll(/["'](\/[a-zA-Z0-9/_\-\.]+(?:ajax|api|json|data|pdf|comp|hold)[a-zA-Z0-9/_\-\.]*)["']/gi)].map(m => m[1]),
    ...[...html.matchAll(/fetch\(["']([^"']+)["']/g)].map(m => m[1]),
  ])];

  // 2) 일반적인 패턴 추측
  const guesses = await Promise.all([
    get("pdf list GET", `${BASE}/api/prod/4460/pdf`),
    get("pdf list GET v2", `${BASE}/api/v1/prod/4460/pdf`),
    get("holdings GET", `${BASE}/api/prod/finderDetail/4460/holdings`),
    get("comp GET", `${BASE}/api/prod/4460/comp`),
    get("portfolio GET", `${BASE}/api/portfolio/4460`),
    get("prod detail api", `${BASE}/api/prod/finderDetail/4460`),
  ]);

  res.status(200).json({
    html_length: html.length,
    scripts: scripts.slice(0, 10),
    api_paths_in_html: apiPaths.slice(0, 20),
    guesses,
  });
};
