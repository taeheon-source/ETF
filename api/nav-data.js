const { list, put } = require("@vercel/blob");

const CACHE_PATH = "cache/nav-data.json";
const CACHE_START_DATE = "2025-01-02";
const CONCURRENCY = 8;

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
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1044.21" },
  { BAS_DD: "2025-12-31", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1018.42" },
  { BAS_DD: "2026-03-20", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1025.61" }
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

  const upstreamUrl = process.env.KRX_UPSTREAM_URL;
  const authKey = process.env.KRX_AUTH_KEY;
  const authHeaderName = process.env.KRX_AUTH_HEADER || "AUTH_KEY";
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (!upstreamUrl || !authKey) {
    res.status(200).json({
      source: "sample",
      message: "KRX 환경변수가 없어 샘플 데이터를 표시합니다.",
      rows: SAMPLE_ROWS,
      failures: []
    });
    return;
  }

  try {
    const cache = hasBlob ? await readCache() : emptyCache();
    const syncTarget = maxDate(to, CACHE_START_DATE);
    const syncStart = getNextBusinessDay(cache.lastSyncedDate || dateBefore(CACHE_START_DATE));
    const missingDates = syncStart <= syncTarget ? buildWeekdayRange(syncStart, syncTarget) : [];

    const failures = [];
    if (missingDates.length) {
      const appendedRows = await fetchMissingRows({
        upstreamUrl,
        authKey,
        authHeaderName,
        dates: missingDates,
        failures
      });

      if (appendedRows.length) {
        const mergedRows = dedupeRows([...cache.rows, ...appendedRows]);
        cache.rows = mergedRows;
      }

      cache.lastSyncedDate = syncTarget;

      if (hasBlob) {
        await writeCache(cache);
      }
    }

    const rows = cache.rows.filter((row) => row.BAS_DD >= from && row.BAS_DD <= to);
    if (!rows.length) {
      res.status(200).json({
        source: hasBlob ? "blob-cache" : "live",
        message: "저장된 범위 안에 표시할 데이터가 없어 샘플 데이터를 반환합니다.",
        rows: SAMPLE_ROWS,
        failures
      });
      return;
    }

    res.status(200).json({
      source: hasBlob ? "blob-cache" : "live",
      message: `총 ${cache.rows.length}건 저장, 이번 요청에서 ${rows.length}건 조회`,
      rows,
      failures,
      lastSyncedDate: cache.lastSyncedDate
    });
  } catch (error) {
    res.status(200).json({
      source: "sample",
      message: `캐시 처리 중 문제가 있어 샘플 데이터를 표시합니다. ${error.message}`,
      rows: SAMPLE_ROWS,
      failures: []
    });
  }
};

async function fetchMissingRows({ upstreamUrl, authKey, authHeaderName, dates, failures }) {
  const rows = [];

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

  return rows;
}

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

async function readCache() {
  const { blobs } = await list({ prefix: CACHE_PATH, limit: 10 });
  const match = blobs.find((blob) => blob.pathname === CACHE_PATH);
  if (!match) {
    return emptyCache();
  }

  const response = await fetch(match.url);
  if (!response.ok) {
    return emptyCache();
  }

  const payload = await response.json();
  return {
    lastSyncedDate: normalizeDate(payload.lastSyncedDate) || "",
    rows: Array.isArray(payload.rows) ? dedupeRows(payload.rows.map(normalizeRow)) : []
  };
}

async function writeCache(cache) {
  await put(CACHE_PATH, JSON.stringify(cache), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json"
  });
}

function emptyCache() {
  return {
    lastSyncedDate: "",
    rows: []
  };
}

function dedupeRows(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const normalized = normalizeRow(row);
    if (!normalized.BAS_DD || !normalized.ISU_CD) {
      return;
    }
    map.set(`${normalized.BAS_DD}:${normalized.ISU_CD}`, normalized);
  });
  return [...map.values()].sort((a, b) => a.BAS_DD.localeCompare(b.BAS_DD) || a.ISU_CD.localeCompare(b.ISU_CD));
}

function normalizeRow(row) {
  return {
    BAS_DD: normalizeDate(row.BAS_DD),
    ISU_CD: String(row.ISU_CD || "").trim(),
    ISU_NM: String(row.ISU_NM || "").trim(),
    NAV: String(row.NAV || "").replaceAll(",", "")
  };
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

function getNextBusinessDay(dateString) {
  const cursor = new Date(`${dateString}T00:00:00`);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return formatDate(cursor);
}

function dateBefore(dateString) {
  const cursor = new Date(`${dateString}T00:00:00`);
  cursor.setDate(cursor.getDate() - 1);
  return formatDate(cursor);
}

function maxDate(a, b) {
  return a >= b ? a : b;
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
