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

// 구성종목 한 줄에서 값을 집어오지 않도록 종목 행을 알아본다
function isHoldingRow(node) {
  return (
    Object.prototype.hasOwnProperty.call(node, "secNm") ||
    Object.prototype.hasOwnProperty.call(node, "itmNo")
  );
}

/* 응답의 어느 깊이에 실릴지 확정할 수 없어 키로 찾는다. 상품마다 지표가
   객체로도 배열 원소로도 실려서 배열 안까지 본다. 대신 구성종목 행은
   건너뛴다. 원하는 값은 펀드 전체 수치이지 개별 종목 값이 아니다. */
function findNumber(node, key, depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) {
    return null;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNumber(child, key, depth + 1);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
  if (isHoldingRow(node)) {
    return null;
  }
  // Number(null)은 0이 된다. 응답에 null이 실려 오므로 숫자로 읽히는 값만 받는다.
  if (Object.prototype.hasOwnProperty.call(node, key)) {
    const raw = node[key];
    if (raw !== null && raw !== undefined && raw !== "") {
      const value = Number(raw);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }
  for (const child of Object.values(node)) {
    const found = findNumber(child, key, depth + 1);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

/* 진단용. 지표가 응답의 어느 경로에 있는지 그대로 찍어 본다.
   상품마다 위치가 달라 탐색이 빗나가는 지점을 눈으로 확인하기 위함이다. */
function findPaths(node, keys, path = "", out = [], depth = 0) {
  if (!node || typeof node !== "object" || depth > 10 || out.length >= 20) {
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => findPaths(child, keys, `${path}[${index}]`, out, depth + 1));
    return out;
  }
  for (const [name, value] of Object.entries(node)) {
    const next = path ? `${path}.${name}` : name;
    if (keys.includes(name)) {
      out.push({ path: next, value });
    }
    findPaths(value, keys, next, out, depth + 1);
  }
  return out;
}

async function fetchRaw(productId) {
  const r = await fetch(`${BASE}/api/v1/kodex/product/${productId}.do`, {
    headers: {
      "User-Agent": UA,
      "Referer": `${BASE}/etf/product/view.do?id=${productId}`,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  return r.json();
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
  const duration = findNumber(json, DURATION_KEY);
  const ytm = findNumber(json, YTM_KEY);

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
    if (req.query?.debug) {
      res.setHeader("Cache-Control", "no-store");
      const json = await fetchRaw(product.id);
      return res.status(200).json({
        productId: product.id,
        topLevelKeys: Object.keys(json),
        found: findPaths(json, [DURATION_KEY, YTM_KEY]),
        resolved: { duration: findNumber(json, DURATION_KEY), ytm: findNumber(json, YTM_KEY) },
      });
    }

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
