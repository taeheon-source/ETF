const ISIN = "KR7272580002";
const ISU_CD2 = "272580";
const ETF_NAME = "TIGER 단기채권액티브";
const TRD_DD = "20250519";

const PORTAL_BASE = "https://data.krx.co.kr";
const DATA_URL = `${PORTAL_BASE}/comm/bldAttendant/getJsonData.cmd`;
const SEED_URL = `${PORTAL_BASE}/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0301`;

module.exports = async function handler(req, res) {
  try {
    // 1단계: 메인 페이지 접근해서 세션 쿠키 획득
    const seedRes = await fetch(SEED_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      redirect: "follow",
    });

    const rawCookies = seedRes.headers.get("set-cookie") || "";
    // set-cookie 헤더에서 쿠키값만 추출
    const cookieStr = rawCookies
      .split(",")
      .map((c) => c.trim().split(";")[0])
      .join("; ");

    // 2단계: 세션 쿠키 포함해서 데이터 요청
    const params = new URLSearchParams({
      bld: "MDCSTAT05001",
      locale: "ko_KR",
      tboxisuCd_finder_secuprodisu2_3: ISU_CD2,
      isuCd: ISIN,
      isuCd2: ISU_CD2,
      codeNmisuCd_finder_secuprodisu2_3: ETF_NAME,
      trdDd: TRD_DD,
      share: "1",
      money: "1",
      csvxls_isNo: "false",
    });

    const dataRes = await fetch(DATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": SEED_URL,
        "Origin": PORTAL_BASE,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        ...(cookieStr ? { Cookie: cookieStr } : {}),
      },
      body: params.toString(),
    });

    const text = await dataRes.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    res.status(200).json({
      seedStatus: seedRes.status,
      cookies: cookieStr,
      dataStatus: dataRes.status,
      isHtml: text.trimStart().startsWith("<"),
      rowCount: json?.output?.length ?? null,
      firstRow: json?.output?.[0] ?? null,
      preview: text.slice(0, 300),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
