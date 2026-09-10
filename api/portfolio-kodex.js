const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

const PRODUCTS = {
  "152380": { id: "2ETF35", name: "KODEX 단기채권" },
  "476050": { id: "2ETF48", name: "KODEX 단기채권PLUS" },
};

const SKIP_CODES = new Set(["CASH00000001", "KRD010010001"]);

/* 삼성 응답에서 편입물 가중평균 듀레이션과 YTM을 담는 키.
   보수·헤지비용·세금 차감 전 기준이고 기준일은 전일이다. */
const DURATION_KEY = "itemDur";
const YTM_KEY = "mkprcPrfr";

/* 지표는 ytm.tab8Info에 실린다. 두 상품 모두 같은 자리인 것을 응답에서
   직접 확인했다. 경로를 알고 있으니 헤매지 않고 그대로 읽는다.
   tab8Info와 그 안의 productYTMInfoMap이 같은 값을 반올림만 달리해
   담고 있어, 소수 자리가 많은 쪽을 먼저 쓴다. */
const YTM_TAB_PATH = ["ytm", "tab8Info"];

function readPath(node, path) {
  return path.reduce(
    (current, key) => (current && typeof current === "object" ? current[key] : undefined),
    node
  );
}

/* 천단위 쉼표나 눈에 안 보이는 공백이 섞여 와도 숫자로 읽는다.
   Number()는 그런 문자 하나에 NaN을 내고, NaN은 값 없음과 구분되지 않는다. */
function toNumber(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }
  const cleaned = String(raw).replace(/[,\s\u00a0%]/g, "");
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function readMetrics(json) {
  const tab = readPath(json, YTM_TAB_PATH);
  const fallback = tab?.productYTMInfoMap;
  return {
    duration: toNumber(tab?.[DURATION_KEY]) ?? toNumber(fallback?.[DURATION_KEY]),
    ytm: toNumber(tab?.[YTM_KEY]) ?? toNumber(fallback?.[YTM_KEY]),
  };
}

async function fetchHoldings(productId, etfId) {
  const r = await fetch(`${BASE}/api/v1/kodex/product/${productId}.do`, {
    headers: {
      "User-Agent": UA,
      "Referer": `${BASE}/etf/product/view.do?id=${productId}`,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const json = await r.json();

  /* 지표를 먼저 꺼낸다. 구성종목 구조가 상품마다 달라 파싱이 실패하더라도
     듀레이션과 YTM은 살려서 내보내기 위함이다. */
  const { duration, ytm } = readMetrics(json);

  const pdf = json.pdf;
  if (!pdf?.list) {
    return { updatedAt: null, duration, ytm, holdings: [] };
  }

  const holdings = pdf.list
    .filter(r => !SKIP_CODES.has(r.itmNo))
    .sort((a, b) => Number(b.ratio) - Number(a.ratio))
    .map(r => ({
      code: r.itmNo,
      name: r.secNm,
      quantity: Number(r.applyQ).toLocaleString("ko-KR"),
      value: Number(r.evalA).toLocaleString("ko-KR"),
      weight: Number(r.ratio).toFixed(2),
    }));

  return {
    updatedAt: pdf.gijunYMD
      ? `${pdf.gijunYMD.slice(0, 4)}-${pdf.gijunYMD.slice(4, 6)}-${pdf.gijunYMD.slice(6, 8)}`
      : new Date().toISOString(),
    duration,
    ytm,
    holdings,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  const ticker = req.query?.ticker || "152380";
  const product = PRODUCTS[ticker];
  if (!product) {
    return res.status(400).json({ error: `Unknown ticker: ${ticker}` });
  }

  try {
    const { updatedAt, duration, ytm, holdings } = await fetchHoldings(product.id, ticker);
    res.status(200).json({
      name: product.name,
      ticker,
      updatedAt,
      duration,
      ytm,
      headers: ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"],
      totalCount: holdings.length,
      holdings,
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: e.message });
  }
};
