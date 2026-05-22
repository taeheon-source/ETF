// 각 ETF 운용사 사이트에서 구성종목 API 접근 가능 여부 테스트
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function probe(name, url, opts = {}) {
  try {
    const r = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        ...(opts.referer ? { Referer: opts.referer } : {}),
        ...(opts.headers || {}),
      },
      ...(opts.body ? { body: opts.body } : {}),
    });
    const text = await r.text();
    const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      name,
      status: r.status,
      isJson,
      preview: text.slice(0, 200),
      rowCount: Array.isArray(json) ? json.length : (json?.list?.length ?? json?.data?.length ?? json?.items?.length ?? null),
    };
  } catch (e) {
    return { name, status: "err", error: e.message };
  }
}

module.exports = async function handler(req, res) {
  const results = await Promise.all([
    // ── 삼성자산운용 KODEX ──
    probe("kodex-main", "https://www.kodex.com/product_etf_details.do?fId=2AAIG&menuId=201", {
      referer: "https://www.kodex.com",
    }),
    probe("kodex-portfolio-api", "https://www.kodex.com/etf_portfolio_deposit_file.do?isinCd=KR7153130000", {
      referer: "https://www.kodex.com",
    }),
    probe("samsungfund-portfolio", "https://www.samsungfund.com/etf/product/view.do?id=2AAIG", {
      referer: "https://www.samsungfund.com",
    }),

    // ── 미래에셋 TIGER ──
    probe("tiger-detail", "https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002", {
      referer: "https://investments.miraeasset.com",
    }),
    probe("tiger-portfolio-ajax", "https://investments.miraeasset.com/tigeretf/ko/product/search/portfolio.do?ksdFund=KR7272580002", {
      referer: "https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002",
    }),
    probe("tiger-api-portfolio", "https://investments.miraeasset.com/api/tigeretf/portfolio?ksdFund=KR7272580002", {
      referer: "https://investments.miraeasset.com",
    }),

    // ── KB자산운용 RISE ──
    probe("kbam-rise", "https://www.kbam.co.kr/etf/view?id=272560", {
      referer: "https://www.kbam.co.kr",
    }),
    probe("kbam-portfolio", "https://www.kbam.co.kr/etf/portfolio?id=272560", {
      referer: "https://www.kbam.co.kr",
    }),

    // ── 한국투자신탁 1Q ──
    probe("1qetf-main", "https://www.1qetf.com/etf/view?code=463290", {
      referer: "https://www.1qetf.com",
    }),

    // ── 키움 KOSEF / 히어로즈 ──
    probe("kiwoom-kosef", "https://www.kiwoomasset.com/etf/product/detail?isinCd=KR7130730003", {
      referer: "https://www.kiwoomasset.com",
    }),
    probe("kiwoom-heroes", "https://www.kiwoomasset.com/heroes/etf/product/detail?isinCd=KR7419890007", {
      referer: "https://www.kiwoomasset.com",
    }),
  ]);

  res.status(200).json(results);
};
