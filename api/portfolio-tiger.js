const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://investments.miraeasset.com";
const DETAIL_URL = `${BASE}/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7272580002`;
const LIST_URL = `${BASE}/tigeretf/ko/product/search/detail/pdfListAjax.ajax`;

const HEADERS = ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"];
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

/* 진단용. 상세 페이지 HTML에 지표가 있는지, 있다면 어떤 마크업인지
   그대로 보기 위한 것이다. 파서를 쓴 뒤 제거한다. */
function snippetAround(html, needle, radius = 300) {
  const index = html.indexOf(needle);
  if (index === -1) {
    return null;
  }
  return html.slice(Math.max(0, index - radius), index + radius).replace(/\s+/g, " ");
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

    if (req.query?.debug) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        status: seedRes.status,
        htmlLength: detailHtml.length,
        duration: snippetAround(detailHtml, "듀레이션"),
        ytm: snippetAround(detailHtml, "YTM"),
      });
    }

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

    res.status(200).json({
      name: "TIGER 단기채권액티브",
      ticker: "272580",
      updatedAt: new Date().toISOString().slice(0, 10),
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
