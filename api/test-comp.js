const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://www.samsungfund.com";

async function get(url, headers = {}) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "application/json, text/html, */*", ...headers },
  });
  const text = await r.text();
  const isJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, isJson, text, json };
}

module.exports = async function handler(req, res) {
  // 1) 삼성펀드 ETF 목록 API로 단기채권 관련 상품 ID 탐색
  const listRes = await get(`${BASE}/api/v1/kodex/product/list.do`);
  const listRes2 = await get(`${BASE}/api/v1/kodex/products.do`);
  const listRes3 = await get(`${BASE}/api/v1/kodex/etf/list.do`);

  // 2) 알려진 2ETF48.do가 어떤 JSON 구조를 반환하는지 확인
  const productRes = await get(`${BASE}/api/v1/kodex/product/2ETF48.do`, {
    "Referer": `${BASE}/etf/product/view.do?id=2ETF48`,
    "X-Requested-With": "XMLHttpRequest",
  });

  res.status(200).json({
    listDo: {
      status: listRes.status, isJson: listRes.isJson,
      preview: listRes.text.slice(0, 300),
      keys: listRes.json && !Array.isArray(listRes.json) ? Object.keys(listRes.json) : null,
    },
    productsDo: {
      status: listRes2.status, isJson: listRes2.isJson,
      preview: listRes2.text.slice(0, 300),
    },
    etfListDo: {
      status: listRes3.status, isJson: listRes3.isJson,
      preview: listRes3.text.slice(0, 300),
    },
    product2ETF48: {
      status: productRes.status, isJson: productRes.isJson,
      preview: productRes.text.slice(0, 600),
      keys: productRes.json && !Array.isArray(productRes.json) ? Object.keys(productRes.json) : null,
    },
  });
};
