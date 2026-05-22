const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const PROD_NO = "4460"; // RISE 단기국공채액티브
const PAGE_URL = `${BASE}/prod/finderDetail/${PROD_NO}`;

module.exports = async function handler(req, res) {
  // 1) 세션 쿠키 획득
  const seedRes = await fetch(PAGE_URL, {
    redirect: "follow",
    headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" },
  });
  const rawCookie = seedRes.headers.get("set-cookie") || "";
  const cookieStr = rawCookie.split(/,(?=[^ ])/g)
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");
  const pageHtml = await seedRes.text();

  // 2) 페이지 HTML에서 script src 추출
  const scriptSrcs = [...pageHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
    .map(m => m[1])
    .filter(s => s.includes(".js"));

  // 3) inline JS 및 HTML에서 URL 패턴 추출
  const urlsInHtml = [
    ...[...pageHtml.matchAll(/["'`](\/[^"'`\s<>]{3,80})["'`]/g)].map(m => m[1]),
  ].filter(u =>
    /tab|ajax|api|json|pdf|comp|hold|finder|prod/i.test(u) &&
    !u.includes(".css") && !u.includes(".png") && !u.includes(".jpg")
  );
  const uniqueUrls = [...new Set(urlsInHtml)].slice(0, 30);

  // 4) script 파일에서 Tab4 관련 URL 추출
  const jsFindings = [];
  for (const src of scriptSrcs.slice(0, 8)) {
    const jsUrl = src.startsWith("http") ? src : `${BASE}${src}`;
    try {
      const r = await fetch(jsUrl, {
        headers: { "User-Agent": UA, "Referer": PAGE_URL, Cookie: cookieStr },
      });
      if (r.ok) {
        const text = await r.text();
        const hits = [...text.matchAll(/["'`](\/[^"'`\s<>]{5,100}(?:Tab|ajax|api|pdf|comp|hold)[^"'`\s<>]*)["'`]/gi)]
          .map(m => m[1]);
        if (hits.length) jsFindings.push({ src, hits: [...new Set(hits)].slice(0, 10) });
      }
    } catch { /* ignore */ }
  }

  // 5) 엔드포인트 프로브
  async function probe(label, url, body = `prodNo=${PROD_NO}`) {
    const headers = {
      "User-Agent": UA,
      "Referer": PAGE_URL,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookieStr,
    };
    const r = await fetch(url, { method: "POST", headers, body }).catch(e => ({ status: -1, text: async () => e.message }));
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    return { label, status: r.status, isJson, preview: text.slice(0, 300) };
  }

  const tab4Probes = await Promise.all([
    // 가장 유력한 경로들
    probe("prod/finder/Tab4",          `${BASE}/prod/finder/productViewFormTab4Jquery`),
    probe("prod/finderDetail/Tab4",    `${BASE}/prod/finderDetail/productViewFormTab4Jquery`),
    probe("prod/Tab4",                 `${BASE}/prod/productViewFormTab4Jquery`),
    probe("finderDetail/id/Tab4",      `${BASE}/prod/finderDetail/${PROD_NO}/productViewFormTab4Jquery`, ""),
    // 비교용 Tab1~3 (같은 base path)
    probe("prod/finder/Tab3",          `${BASE}/prod/finder/productViewFormTab3Jquery`),
    probe("prod/finder/Tab2",          `${BASE}/prod/finder/productViewFormTab2Jquery`),
    probe("prod/finder/Tab1",          `${BASE}/prod/finder/productViewFormTab1Jquery`),
    // GET 방식
    probe("GET finder/Tab4",           `${BASE}/prod/finder/productViewFormTab4Jquery?prodNo=${PROD_NO}`, null),
    // PDF/composition 대안 경로
    probe("api/prod/pdf",              `${BASE}/api/prod/${PROD_NO}/pdf`, ""),
    probe("prod/finder/comp",          `${BASE}/prod/finder/productViewFormComp`, `prodNo=${PROD_NO}`),
  ]);

  res.status(200).json({
    pageStatus: seedRes.status,
    pageSize: pageHtml.length,
    cookieStr,
    scriptSrcs: scriptSrcs.slice(0, 10),
    urlsFoundInHtml: uniqueUrls,
    jsFindings,
    tab4Probes,
  });
};
