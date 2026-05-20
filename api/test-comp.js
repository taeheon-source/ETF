// TIGER 단기채권액티브 구성종목 테스트
// data.krx.co.kr 구형 포털의 AJAX 엔드포인트를 직접 호출 (pykrx 방식)
const ISIN = "KR7272580002";
const ISU_CD2 = "272580";
const ETF_NAME = "TIGER 단기채권액티브";
const TRD_DD = "20250519";

const KRX_PORTAL = "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";
const REFERER = "https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0301";

module.exports = async function handler(req, res) {
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

  try {
    const r = await fetch(KRX_PORTAL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": REFERER,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Origin": "https://data.krx.co.kr",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: params.toString(),
    });

    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    res.status(200).json({
      httpStatus: r.status,
      preview: text.slice(0, 500),
      rowCount: json?.output?.length ?? null,
      firstRow: json?.output?.[0] ?? null,
      json,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
