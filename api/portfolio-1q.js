const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://1qetf.com";
const PAGE_URL = `${BASE}/pages/ETFproducts/ETF_items.view.php?etf_no=2`;
const AJAX_URL = `${BASE}/pages/ETFproducts/ajax/process.php`;
const INFO_URL = `${BASE}/pages/ETFproducts/ETF_info.view.php?etf_no=2`;

/* 상품정보 페이지는 값을 HTML에 그대로 박아 내려준다. 라벨 span 뒤에
   데이터 span이 붙는 구조라, 짝을 통째로 훑어 라벨로 찾아 쓴다. */
const INFO_PAIR = /etfinfo__item-label[^>]*>([\s\S]*?)<\/span>[\s\S]{0,400}?etfinfo__item-data[^>]*>([\s\S]*?)<\/span>/gi;

function stripTags(value) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function readInfoPairs(html) {
  const pairs = {};
  INFO_PAIR.lastIndex = 0;
  let match = INFO_PAIR.exec(html);
  while (match) {
    const label = stripTags(match[1]);
    // 같은 라벨이 여러 번 나오면 먼저 나온 값을 쓴다
    if (label && !(label in pairs)) {
      pairs[label] = stripTags(match[2]);
    }
    match = INFO_PAIR.exec(html);
  }
  return pairs;
}

// 라벨 표기가 바뀔 수 있어 앞부분만 맞춰 찾는다
function pickByPrefix(pairs, prefix) {
  const key = Object.keys(pairs).find((name) => name.startsWith(prefix));
  return key ? pairs[key] : null;
}

/* 퍼센트 기호나 눈에 안 보이는 공백이 섞여 와도 숫자로 읽는다.
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

// 상품정보를 못 가져와도 구성종목은 그대로 내려간다
async function fetchMetrics() {
  try {
    const response = await fetch(INFO_URL, {
      headers: { "User-Agent": UA, "Referer": BASE, "Accept": "text/html,application/xhtml+xml" },
    });
    if (!response.ok) {
      return { duration: null, ytm: null, diag: { status: response.status } };
    }
    const html = await response.text();
    const pairs = readInfoPairs(html);
    return {
      duration: toNumber(pickByPrefix(pairs, "듀레이션")),
      ytm: toNumber(pickByPrefix(pairs, "YTM")),
      diag: {
        status: response.status,
        htmlLength: html.length,
        hasMarker: /etfinfo__item-label/i.test(html),
        labels: Object.keys(pairs).slice(0, 12),
      },
    };
  } catch (e) {
    return { duration: null, ytm: null, diag: { error: e.message } };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const metricsPromise = fetchMetrics();
    const ajaxRes = await fetch(AJAX_URL, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": PAGE_URL,
        "Origin": BASE,
      },
      body: "mode=get.pdf&etf_code=463290",
    });

    const json = await ajaxRes.json();
    if (!json.success) throw new Error("API returned success=false");

    const holdings = json.results
      .filter(r => r.F16004 !== "설정현금액" && r.F16004 !== "원화현금")
      .sort((a, b) => Number(b.F34743) - Number(a.F34743))
      .map(r => ({
        code: r.F16316 || "-",
        name: r.F16004 || "-",
        quantity: r.F16499 || "-",
        value: Number(r.F34840).toLocaleString("ko-KR"),
        weight: (Number(r.F34743) / 100).toFixed(2),
      }));

    const { duration, ytm, diag } = await metricsPromise;

    // 진단용. 원인을 잡은 뒤 제거한다.
    if (req.query?.debug) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ infoUrl: INFO_URL, duration, ytm, diag });
    }

    res.status(200).json({
      name: "1Q 단기금융채액티브",
      ticker: "463290",
      updatedAt: new Date().toISOString().slice(0, 10),
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
