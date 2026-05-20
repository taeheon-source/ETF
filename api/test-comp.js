const ISIN = "KR7272580002"; // TIGER 단기채권액티브
const TODAY = "20250519";

const CANDIDATES = [
  { name: "etf_comp_with_idx",  url: "https://data-dbg.krx.co.kr/svc/apis/etp/etf_comp_with_idx",  body: { basDd: TODAY, isuCd: ISIN } },
  { name: "etf_isu_comp",       url: "https://data-dbg.krx.co.kr/svc/apis/etp/etf_isu_comp",        body: { basDd: TODAY, isuCd: ISIN } },
  { name: "etf_comp",           url: "https://data-dbg.krx.co.kr/svc/apis/etp/etf_comp",            body: { basDd: TODAY, isuCd: ISIN } },
  { name: "etf_pdf",            url: "https://data-dbg.krx.co.kr/svc/apis/etp/etf_pdf",             body: { basDd: TODAY, isuCd: ISIN } },
  { name: "etp_comp",           url: "https://data-dbg.krx.co.kr/svc/apis/etp/etp_comp",            body: { basDd: TODAY, isuCd: ISIN } },
  { name: "etf_bydd_comp",      url: "https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_comp",       body: { basDd: TODAY, isuCd: ISIN } },
];

module.exports = async function handler(req, res) {
  const authKey = process.env.KRX_AUTH_KEY;
  const authHeader = process.env.KRX_AUTH_HEADER || "AUTH_KEY";

  if (!authKey) {
    res.status(500).json({ error: "KRX_AUTH_KEY 환경변수 없음" });
    return;
  }

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

  res.status(200).json(
    results.map((r, i) => ({
      endpoint: CANDIDATES[i].name,
      ...(r.status === "fulfilled" ? r.value : { error: r.reason?.message }),
    }))
  );
};
