const MAX_BUSINESS_DAYS = 70;
const CONCURRENCY = 5;

const SAMPLE_ROWS = [
  { BAS_DD: "2025-12-31", ISU_CD: "069500", ISU_NM: "KODEX 200", NAV: "42.10" },
  { BAS_DD: "2026-01-02", ISU_CD: "069500", ISU_NM: "KODEX 200", NAV: "42.55" },
  { BAS_DD: "2026-03-20", ISU_CD: "069500", ISU_NM: "KODEX 200", NAV: "47.20" },
  { BAS_DD: "2025-12-31", ISU_CD: "360750", ISU_NM: "TIGER 미국S&P500", NAV: "21.90" },
  { BAS_DD: "2026-01-02", ISU_CD: "360750", ISU_NM: "TIGER 미국S&P500", NAV: "22.15" },
  { BAS_DD: "2026-03-20", ISU_CD: "360750", ISU_NM: "TIGER 미국S&P500", NAV: "24.36" }
];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);

  if (!from || !to || from > to) {
    res.status(400).json({ error: "Invalid date range. Use YYYY-MM-DD." });
    return;
  }

  const dates = buildWeekdayRange(from, to);
  if (dates.length > MAX_BUSINESS_DAYS) {
    res.status(400).json({
      error: `Requested range is too large. Please keep it within ${MAX_BUSINESS_DAYS} business days.`
    });
    return;
  }

  const upstreamUrl = process.env.KRX_UPSTREAM_URL;
  const authKey = process.env.KRX_AUTH_KEY;
  const authHeaderName = process.env.KRX_AUTH_HEADER || "AUTH_KEY";

  if (!upstreamUrl || !authKey) {
    res.status(200).json({
      source: "sample",
      message: "KRX 환경변수가 없어 샘플 데이터를 표시합니다.",
      rows: SAMPLE_ROWS,
      failures: []
    });
    return;
  }

  const rows = [];
  const failures = [];

  for (let index = 0; index < dates.length; index += CONCURRENCY) {
    const chunk = dates.slice(index, index + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((date) => fetchForDate({ upstreamUrl, authKey, authHeaderName, date }))
    );

    settled.forEach((result, offset) => {
      const date = chunk[offset];
      if (result.status === "fulfilled") {
        rows.push(...result.value);
      } else {
        failures.push({ date, error: result.reason.message });
      }
    });
  }

  if (!rows.length) {
    res.status(200).json({
      source: "sample",
      message: "KRX 응답이 비어 있어 샘플 데이터를 표시합니다.",
      rows: SAMPLE_ROWS,
      failures
    });
    return;
  }

  res.status(200).json({
    source: "upstream",
    message: `${rows.length}건의 NAV 데이터를 KRX에서 불러왔습니다.`,
    rows,
    failures
  });
};

async function fetchForDate({ upstreamUrl, authKey, authHeaderName, date }) {
  const response = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeaderName]: authKey
    },
    body: JSON.stringify({ basDd: date.replaceAll("-", "") })
  });

  if (!response.ok) {
    throw new Error(`KRX request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload.OutBlock_1) ? payload.OutBlock_1 : [];

  return rows
    .map((row) => ({
      BAS_DD: normalizeDate(row.BAS_DD || date),
      ISU_CD: String(row.ISU_CD || "").trim(),
      ISU_NM: String(row.ISU_NM || "").trim(),
      NAV: String(row.NAV || "").replaceAll(",", "")
    }))
    .filter((row) => row.BAS_DD && row.ISU_CD && row.ISU_NM && row.NAV && row.NAV !== "-");
}

function buildWeekdayRange(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.push(formatDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  return "";
}

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}
