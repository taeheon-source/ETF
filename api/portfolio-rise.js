const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.riseetf.co.kr";
const FUND_CODE = "4460";
const DETAIL_URL = `${BASE}/prod/finderDetail/${FUND_CODE}`;

/* RISE는 지표를 표가 아니라 제목 줄에 문장으로 적어 둔다.
   "(2026.09.11 기준 ETF YTM: 3.87, 듀레이션: 1.00)" 같은 형태라
   마크업 대신 문장에서 뽑는다. 기준일도 여기서 같이 얻는다. */
const YTM_PATTERN = /YTM\s*[:：]\s*(-?[\d.,]+)/;
const DURATION_PATTERN = /듀레이션\s*[:：]\s*(-?[\d.,]+)/;
const AS_OF_PATTERN = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*기준/;

/* 쉼표나 눈에 안 보이는 공백이 섞여 와도 숫자로 읽는다.
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

function matchNumber(html, pattern) {
  const match = html.match(pattern);
  return match ? toNumber(match[1]) : null;
}

function readAsOf(html) {
  const match = html.match(AS_OF_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function readMetrics(html) {
  return {
    duration: matchNumber(html, DURATION_PATTERN),
    ytm: matchNumber(html, YTM_PATTERN),
    asOf: readAsOf(html),
  };
}

module.exports = async function handler(req, res) {
  /* 값이 하루에 한 번 바뀌므로 한 시간 캐시로 운용사 사이트를 아낀다.
     다만 만료 뒤 옛날 값을 먼저 내주면 아침 첫 조회에 어제 값이 보인다.
     그 동작(stale-while-revalidate)은 쓰지 않는다. */
  res.setHeader("Cache-Control", "s-maxage=3600");

  try {
    const response = await fetch(DETAIL_URL, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
    const html = await response.text();

    const { duration, ytm, asOf } = readMetrics(html);

    res.status(200).json({
      name: "RISE 단기국공채액티브",
      ticker: "272560",
      // 페이지가 기준일을 밝히므로 오늘 날짜로 갈음하지 않는다
      updatedAt: asOf || new Date().toISOString().slice(0, 10),
      duration,
      ytm,
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: e.message });
  }
};
