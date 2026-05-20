const ISIN = "KR7272580002"; // TIGER 단기채권액티브
const TODAY = "20250519";

// 더 넓은 범위의 후보 엔드포인트 시도
function buildCandidates(base) {
  const paths = [
    "etp/etf_comp_with_idx",
    "etp/etf_isu_comp",
    "etp/etf_comp",
    "etp/etf_pdf",
    "etp/etp_comp",
    "etp/etf_bydd_comp",
    "etp/etf_pddt_isu_comp",
    "etp/etf_portfolio",
    "etp/etf_isu_pdf",
    "etp/etf_daily_pdf",
    "etp/etf_port_comp",
    "etp/etf_comp_info",
    "etp/etf_bydd_port",
  ];
  return paths.map((p) => ({
    name: p,
    url: `${base}/${p}`,
    body: { basDd: TODAY, isuCd: ISIN },
  }));
}

module.exports = async function handler(req, res) {
  const authKey = process.env.KRX_AUTH_KEY;
  const authHeader = process.env.KRX_AUTH_HEADER || "AUTH_KEY";
  const upstreamUrl = process.env.KRX_UPSTREAM_URL || "";

  if (!authKey) {
    res.status(500).json({ error: "KRX_AUTH_KEY 환경변수 없음" });
    return;
  }

  // 현재 NAV에 사용 중인 URL에서 base URL 추출
  // upstreamUrl 예시: https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd
  const urlParts = upstreamUrl.split("/");
  const baseUrl = urlParts.slice(0, -2).join("/"); // 마지막 두 세그먼트 제거 → .../svc/apis
  const navEndpointPath = urlParts.slice(-2).join("/"); // 예: etp/etf_bydd_trd

  const CANDIDATES = buildCandidates(baseUrl);

  const results = await Promise.allSettled(
    CANDIDATES.map(async ({ name, url, body }) => {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: authKey },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { name, status: r.status, preview: text.slice(0, 300), json };
    })
  );

  res.status(200).json({
    navEndpoint: navEndpointPath,
    baseUrl,
    candidates: results.map((r, i) => ({
      endpoint: CANDIDATES[i].name,
      url: CANDIDATES[i].url,
      ...(r.status === "fulfilled" ? r.value : { error: r.reason?.message }),
    })),
  });
};
