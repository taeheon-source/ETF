const FIXED_START_DATE = "2025-12-01";
const CONCURRENCY = 5;
const TARGET_ETF_NAMES = [
  "1Q 종합채권(AA-이상)액티브",
  "ACE 종합채권(AA-이상)KIS액티브",
  "PLUS 종합채권(AA-이상)액티브",
  "RISE 종합채권(A-이상)액티브",
  "KODEX 종합채권(AA-이상)액티브",
  "SOL 종합채권(AA-이상)액티브",
  "TIGER 종합채권(AA-이상)액티브",
  "HK 종합채권(AA-이상)액티브",
  "히어로즈 종합채권(AA-이상)액티브",
  "파워 종합채권(AA-이상)액티브"
];

const SAMPLE_ROWS = [
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.12" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.55" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1044.21" },
  { BAS_DD: "2025-12-31", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1018.42" },
  { BAS_DD: "2026-01-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1018.66" },
  { BAS_DD: "2026-03-20", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1025.61" }
];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestedTo = normalizeDate(req.query.to);
  const to = requestedTo || todayInKst();
  const from = FIXED_START_DATE;

  if (from > to) {
    res.status(400).json({ error: "Invalid date range." });
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

  const dates = buildWeekdayRange(from, to);
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
    .filter((row) => TARGET_ETF_NAMES.includes(row.ISU_NM))
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

function todayInKst() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}
