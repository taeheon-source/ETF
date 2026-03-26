const FIXED_START_DATE = "2025-12-01";
const EXTRA_DATE = "2025-02-25";
const CONCURRENCY = 5;
const ETF_NAME_ALIASES = {
  "ACE 종합채권(AA-이상)KIS액티브": "ACE 종합채권(AA-이상)액티브"
};
const ETF_GROUPS = {
  TOTAL_BOND: [
    "1Q 종합채권(AA-이상)액티브",
    "ACE 종합채권(AA-이상)액티브",
    "PLUS 종합채권(AA-이상)액티브",
    "RISE 종합채권(A-이상)액티브",
    "KODEX 종합채권(AA-이상)액티브",
    "SOL 종합채권(AA-이상)액티브",
    "TIGER 종합채권(AA-이상)액티브",
    "HK 종합채권(AA-이상)액티브",
    "KIWOOM 종합채권(AA-이상)액티브",
    "파워 종합채권(AA-이상)액티브"
  ],
  CREDIT_SHORT: [
    "1Q 중단기회사채(A-이상)액티브",
    "SOL 중단기회사채(A-이상)액티브"
  ],
  SHORT_TERM: [
    "1Q 단기금융채액티브",
    "RISE 단기국공채액티브",
    "KODEX 단기채권",
    "KODEX 단기채권PLUS",
    "TIGER 단기채권액티브",
    "KOSEF 단기자금",
    "히어로즈 단기채권ESG액티브"
  ],
  SPECIAL_BANK: [
    "1Q 단기특수은행채액티브",
    "RISE 단기특수은행채액티브"
  ]
};
const TARGET_ETF_NAMES = [...new Set(Object.values(ETF_GROUPS).flat())];

const SAMPLE_ROWS = [
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.12", INVSTASST_NETASST_TOTAMT: "95400000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.55", INVSTASST_NETASST_TOTAMT: "95650000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1044.21", INVSTASST_NETASST_TOTAMT: "96719830000" },
  { BAS_DD: "2025-12-31", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1018.42", INVSTASST_NETASST_TOTAMT: "109800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1018.66", INVSTASST_NETASST_TOTAMT: "110050000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1025.61", INVSTASST_NETASST_TOTAMT: "110407010000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1012.18", INVSTASST_NETASST_TOTAMT: "41200000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1012.44", INVSTASST_NETASST_TOTAMT: "41250000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1015.72", INVSTASST_NETASST_TOTAMT: "42890000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1009.61", INVSTASST_NETASST_TOTAMT: "63300000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1009.88", INVSTASST_NETASST_TOTAMT: "63420000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1013.05", INVSTASST_NETASST_TOTAMT: "64970000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1008.52", INVSTASST_NETASST_TOTAMT: "31800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1008.66", INVSTASST_NETASST_TOTAMT: "31920000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1010.08", INVSTASST_NETASST_TOTAMT: "33270000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1007.92", INVSTASST_NETASST_TOTAMT: "28700000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1008.04", INVSTASST_NETASST_TOTAMT: "28750000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1009.31", INVSTASST_NETASST_TOTAMT: "29460000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1020.11", INVSTASST_NETASST_TOTAMT: "192000000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1020.26", INVSTASST_NETASST_TOTAMT: "192400000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1022.14", INVSTASST_NETASST_TOTAMT: "198700000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1015.08", INVSTASST_NETASST_TOTAMT: "58200000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1015.19", INVSTASST_NETASST_TOTAMT: "58340000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1016.61", INVSTASST_NETASST_TOTAMT: "59820000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1006.44", INVSTASST_NETASST_TOTAMT: "44300000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1006.58", INVSTASST_NETASST_TOTAMT: "44410000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1007.97", INVSTASST_NETASST_TOTAMT: "45180000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1024.28", INVSTASST_NETASST_TOTAMT: "86100000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1024.41", INVSTASST_NETASST_TOTAMT: "86250000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1025.90", INVSTASST_NETASST_TOTAMT: "87840000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1004.88", INVSTASST_NETASST_TOTAMT: "12600000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1005.03", INVSTASST_NETASST_TOTAMT: "12640000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1006.37", INVSTASST_NETASST_TOTAMT: "12910000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1009.84", INVSTASST_NETASST_TOTAMT: "35800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1010.01", INVSTASST_NETASST_TOTAMT: "35870000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1011.86", INVSTASST_NETASST_TOTAMT: "36950000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1008.63", INVSTASST_NETASST_TOTAMT: "27400000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1008.79", INVSTASST_NETASST_TOTAMT: "27460000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1010.42", INVSTASST_NETASST_TOTAMT: "28130000000" }
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

  const dates = [...new Set([...buildWeekdayRange(from, to), EXTRA_DATE])].sort();
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
    .map((row) => {
      const normalizedName = normalizeEtfName(row.ISU_NM);
      return {
        BAS_DD: normalizeDate(row.BAS_DD || date),
        ISU_CD: String(row.ISU_CD || "").trim(),
        ISU_NM: normalizedName,
        NAV: String(row.NAV || "").replaceAll(",", ""),
        INVSTASST_NETASST_TOTAMT: String(row.INVSTASST_NETASST_TOTAMT || "").replaceAll(",", "")
      };
    })
    .filter((row) => TARGET_ETF_NAMES.includes(row.ISU_NM))
    .filter((row) => row.BAS_DD && row.ISU_CD && row.ISU_NM && row.NAV && row.NAV !== "-");
}

function normalizeEtfName(name) {
  const raw = String(name || "").trim();
  return ETF_NAME_ALIASES[raw] || raw;
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
