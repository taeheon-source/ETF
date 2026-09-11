const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL_URL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;
const LIST_URL = `${BASE}/tigeretf/ko/product/search/detail/pdfListAjax.ajax`;

const HEADERS = ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"];

/* 상세 페이지가 지표를 HTML에 그대로 담아 내려준다. title 다음에 amount가
   붙는 구조라 짝을 통째로 훑어 라벨로 찾아 쓴다. amount는 수익률 같은 다른
   항목에도 쓰이므로 반드시 라벨로 골라야 한다. */
const INFO_PAIR = /class="title[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]{0,400}?class="amount"[^>]*>([\s\S]*?)<\/span>/gi;

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

/* % 기호나 눈에 안 보이는 공백이 섞여 와도 숫자로 읽는다.
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

function readMetrics(html) {
  const pairs = readInfoPairs(html);
  return {
    duration: toNumber(pickByPrefix(pairs, "듀레이션")),
    ytm: toNumber(pickByPrefix(pairs, "YTM")),
  };
}
const PAGE_SIZE = 10;

function parseRows(html) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(r => [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()))
    .filter(cells => cells.length >= 5)
    .map(cells => cells.slice(0, 5)); // 종목코드, 종목명, 수량, 평가금액, 비중만
}

function getTotalCount(html) {
  const m = html.match(/data-tot-cnt="(\d+)"/);
  return m ? parseInt(m[1]) : 0;
}

async function fetchPage(pageIndex, cookieStr) {
  const r = await fetch(LIST_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": DETAIL_URL,
      "Origin": BASE,
      Cookie: cookieStr,
    },
    body: `ksdFund=KR7272580002&pageIndex=${pageIndex}&firstIndex=${(pageIndex - 1) * PAGE_SIZE}`,
  });
  return r.text();
}

module.exports = async function handler(req, res) {
  /* 값이 하루에 한 번 바뀌므로 한 시간 캐시로 운용사 사이트를 아낀다.
     다만 만료 뒤 옛날 값을 먼저 내주면 아침 첫 조회에 어제 값이 보인다.
     그 동작(stale-while-revalidate)은 쓰지 않는다. */
  res.setHeader("Cache-Control", "s-maxage=3600");

  try {
    // 세션 쿠키 획득
    const seedRes = await fetch(DETAIL_URL, { headers: { "User-Agent": UA } });
    const cookieStr = (seedRes.headers.get("set-cookie") || "")
      .split(",").map(c => c.trim().split(";")[0]).join("; ");
    const detailHtml = await seedRes.text();


    // 1페이지로 총 건수 파악
    const page1Html = await fetchPage(1, cookieStr);
    const totalCount = getTotalCount(page1Html);
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 나머지 페이지 병렬 요청
    const restHtmls = totalPages > 1
      ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2, cookieStr)))
      : [];

    // 파싱 후 중복 제거 (종목코드+종목명 기준)
    const seen = new Set();
    const rows = [page1Html, ...restHtmls]
      .flatMap(parseRows)
      .filter(cells => {
        const key = cells[0] + "|" + cells[1];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const { duration, ytm } = readMetrics(detailHtml);

    res.status(200).json({
      name: "TIGER 단기채권액티브",
      ticker: "272580",
      updatedAt: new Date().toISOString().slice(0, 10),
      duration,
      ytm,
      headers: HEADERS,
      totalCount: rows.length,
      holdings: rows.map(cells => ({
        code: cells[0],
        name: cells[1],
        quantity: cells[2],
        value: cells[3],
        weight: cells[4],
      })),
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: e.message });
  }
};
