const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const FUND = "KR7272580002";

async function get(url, headers = {}) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", ...headers } });
  const text = await r.text();
  const cookies = r.headers.get("set-cookie") || "";
  return { status: r.status, text, cookies };
}

module.exports = async function handler(req, res) {
  const detailUrl = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=${FUND}`;

  // 1. 상세 페이지 접근 → jsessionid 추출
  const { text: html, cookies } = await get(detailUrl, { Referer: BASE });
  const sessionMatch = html.match(/jsessionid=([A-Za-z0-9+/=._-]+)/);
  const jsessionid = sessionMatch ? sessionMatch[1] : "";
  const cookieStr = cookies.split(",").map(c => c.trim().split(";")[0]).join("; ");

  // 2. HTML <script> 태그에서 JSON 데이터 블롭 탐색
  const scriptBlocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1])
    .filter(s => s.includes("{") && s.length > 100);

  const jsonBlobs = scriptBlocks
    .map(s => {
      const m = s.match(/\{[\s\S]{50,}/);
      return m ? m[0].slice(0, 300) : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  // 3. jsessionid 포함해서 AJAX 후보 엔드포인트 시도
  const sessionSuffix = jsessionid ? `;jsessionid=${jsessionid}` : "";
  const ajaxCandidates = [
    `/tigeretf/ko/product/search/detail/portfolioList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/pdfList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/componentList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/pdf/portfolioList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/etfPdfList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/holdingList.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/fundHolding.do${sessionSuffix}?ksdFund=${FUND}`,
    `/tigeretf/ko/product/search/detail/etfPortfolio.do${sessionSuffix}?ksdFund=${FUND}`,
  ];

  const ajaxResults = await Promise.all(
    ajaxCandidates.map(async path => {
      try {
        const r = await fetch(BASE + path, {
          headers: { "User-Agent": UA, Referer: detailUrl, "X-Requested-With": "XMLHttpRequest", ...(cookieStr ? { Cookie: cookieStr } : {}) }
        });
        const text = await r.text();
        const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
        return { path: path.replace(sessionSuffix, ""), status: r.status, isJson, preview: text.slice(0, 150) };
      } catch(e) {
        return { path, error: e.message };
      }
    })
  );

  // 4. HTML에서 fund 관련 데이터 테이블 패턴 탐색
  const tableSection = html.indexOf("구성종목");
  const tableContext = tableSection > -1 ? html.slice(tableSection, tableSection + 2000) : null;

  res.status(200).json({
    jsessionid: jsessionid || "없음",
    cookieStr,
    jsonBlobCount: jsonBlobs.length,
    jsonBlobPreviews: jsonBlobs,
    ajaxResults,
    tableContext: tableContext ? tableContext.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500) : null,
  });
};
