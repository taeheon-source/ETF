const FIXED_START_DATE = "2025-12-01";
const FEATURED_ETF_PREFIX = "1Q ";
const NAV_TABLE_LABELS = {
  "1Q 종합채권(AA-이상)액티브": "1Q",
  "ACE 종합채권(AA-이상)KIS액티브": "ACE",
  "PLUS 종합채권(AA-이상)액티브": "PLUS",
  "RISE 종합채권(A-이상)액티브": "RISE",
  "KODEX 종합채권(AA-이상)액티브": "KODEX",
  "SOL 종합채권(AA-이상)액티브": "SOL",
  "TIGER 종합채권(AA-이상)액티브": "TIGER",
  "HK 종합채권(AA-이상)액티브": "HK",
  "히어로즈 종합채권(AA-이상)액티브": "히어로즈",
  "파워 종합채권(AA-이상)액티브": "파워"
};

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

const TARGET_ETF_ORDER = Object.fromEntries(TARGET_ETF_NAMES.map((name, index) => [name, index]));

const sampleDataset = [
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.12" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.55" },
  { BAS_DD: "2026-02-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1037.48" },
  { BAS_DD: "2026-03-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1041.34" },
  { BAS_DD: "2026-03-11", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.18" },
  { BAS_DD: "2026-03-12", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.44" },
  { BAS_DD: "2026-03-13", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.71" },
  { BAS_DD: "2026-03-16", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.10" },
  { BAS_DD: "2026-03-17", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.39" },
  { BAS_DD: "2026-03-18", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.68" },
  { BAS_DD: "2026-03-19", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.92" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1044.21" },
  { BAS_DD: "2025-12-31", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1018.42" },
  { BAS_DD: "2026-01-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1018.66" },
  { BAS_DD: "2026-02-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1020.94" },
  { BAS_DD: "2026-03-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1023.62" },
  { BAS_DD: "2026-03-11", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1024.11" },
  { BAS_DD: "2026-03-12", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1024.25" },
  { BAS_DD: "2026-03-13", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1024.41" },
  { BAS_DD: "2026-03-16", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1024.73" },
  { BAS_DD: "2026-03-17", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1024.96" },
  { BAS_DD: "2026-03-18", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1025.20" },
  { BAS_DD: "2026-03-19", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1025.36" },
  { BAS_DD: "2026-03-20", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)KIS액티브", NAV: "1025.61" },
  { BAS_DD: "2026-03-20", ISU_CD: "PLUS_BOND", ISU_NM: "PLUS 종합채권(AA-이상)액티브", NAV: "1032.44" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_BOND", ISU_NM: "RISE 종합채권(A-이상)액티브", NAV: "1019.82" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_BOND", ISU_NM: "KODEX 종합채권(AA-이상)액티브", NAV: "1038.15" },
  { BAS_DD: "2026-03-20", ISU_CD: "SOL_BOND", ISU_NM: "SOL 종합채권(AA-이상)액티브", NAV: "1030.77" },
  { BAS_DD: "2026-03-20", ISU_CD: "TIGER_BOND", ISU_NM: "TIGER 종합채권(AA-이상)액티브", NAV: "1031.24" },
  { BAS_DD: "2026-03-20", ISU_CD: "HK_BOND", ISU_NM: "HK 종합채권(AA-이상)액티브", NAV: "1028.64" },
  { BAS_DD: "2026-03-20", ISU_CD: "HERO_BOND", ISU_NM: "히어로즈 종합채권(AA-이상)액티브", NAV: "1027.58" },
  { BAS_DD: "2026-03-20", ISU_CD: "POWER_BOND", ISU_NM: "파워 종합채권(AA-이상)액티브", NAV: "1026.91" }
];

const state = {
  baseDate: "",
  compareDate: "",
  rankingMetric: "YTD",
  sortMetric: "YTD",
  selectedEtf: "",
  dataset: [],
  grouped: {},
  etfs: [],
  availableDates: []
};

const els = {
  baseDateSelect: document.querySelector("#baseDateSelect"),
  compareDateSelect: document.querySelector("#compareDateSelect"),
  rankingMetricSelect: document.querySelector("#rankingMetricSelect"),
  sortMetricSelect: document.querySelector("#sortMetricSelect"),
  returnsTableBody: document.querySelector("#returnsTableBody"),
  rankingList: document.querySelector("#rankingList"),
  compareHeader: document.querySelector("#compareHeader"),
  navTableHead: document.querySelector("#navTableHead"),
  navTableBody: document.querySelector("#navTableBody"),
  chartTitle: document.querySelector("#chartTitle"),
  chartMeta: document.querySelector("#chartMeta"),
  trendChart: document.querySelector("#trendChart"),
  refreshButton: document.querySelector("#refreshButton"),
  detailMetrics: document.querySelector("#detailMetrics")
};

init();

async function init() {
  bindEvents();
  await loadDataset();
}

function bindEvents() {
  els.baseDateSelect.addEventListener("change", (event) => {
    state.baseDate = event.target.value;
    if (state.compareDate >= state.baseDate) {
      state.compareDate = getFallbackCompareDate(state.baseDate);
    }
    render();
  });

  els.compareDateSelect.addEventListener("change", (event) => {
    state.compareDate = event.target.value;
    render();
  });

  els.rankingMetricSelect.addEventListener("change", (event) => {
    state.rankingMetric = event.target.value;
    renderRanking();
  });

  els.sortMetricSelect.addEventListener("change", (event) => {
    state.sortMetric = event.target.value;
    renderOverviewTable();
  });

  els.refreshButton.addEventListener("click", async () => {
    await loadDataset();
  });
}

async function loadDataset() {
  setLoading(true);
  try {
    const today = new Date();
    const to = toDateInput(today);
    const response = await fetch(`/api/nav-data?from=${encodeURIComponent(FIXED_START_DATE)}&to=${encodeURIComponent(to)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || `요청 실패 (${response.status})`);
    }

    applyDataset(Array.isArray(payload.rows) && payload.rows.length ? payload.rows : sampleDataset);
  } catch {
    applyDataset(sampleDataset);
  } finally {
    setLoading(false);
  }
}

function applyDataset(rows) {
  state.dataset = normalizeRows(rows);
  state.grouped = buildGroupedData(state.dataset);
  state.etfs = Object.values(state.grouped).sort(
    (a, b) =>
      (TARGET_ETF_ORDER[a.name] ?? Number.MAX_SAFE_INTEGER) -
      (TARGET_ETF_ORDER[b.name] ?? Number.MAX_SAFE_INTEGER)
  );
  state.availableDates = [...new Set(state.dataset.map((row) => row.BAS_DD))].sort();
  state.baseDate = state.availableDates[state.availableDates.length - 1] || "";
  state.compareDate = state.availableDates.find((date) => date < state.baseDate) || "";
  state.selectedEtf = state.selectedEtf && state.grouped[state.selectedEtf] ? state.selectedEtf : state.etfs[0]?.code || "";
  renderDateOptions();
  render();
}

function normalizeRows(rows) {
  return rows
    .map((row) => ({
      BAS_DD: normalizeDate(row.BAS_DD),
      ISU_CD: String(row.ISU_CD || "").trim(),
      ISU_NM: String(row.ISU_NM || "").trim(),
      NAV: String(row.NAV || "").replaceAll(",", "")
    }))
    .filter((row) => TARGET_ETF_NAMES.includes(row.ISU_NM))
    .filter((row) => row.BAS_DD && row.ISU_CD && row.ISU_NM && row.NAV && row.NAV !== "-")
    .sort((a, b) => a.BAS_DD.localeCompare(b.BAS_DD) || a.ISU_CD.localeCompare(b.ISU_CD));
}

function buildGroupedData(rows) {
  return rows.reduce((acc, row) => {
    if (!acc[row.ISU_CD]) {
      acc[row.ISU_CD] = { code: row.ISU_CD, name: row.ISU_NM, series: [] };
    }
    acc[row.ISU_CD].series.push({ date: row.BAS_DD, nav: parseNumber(row.NAV) });
    return acc;
  }, {});
}

function renderDateOptions() {
  els.baseDateSelect.innerHTML = state.availableDates.map((date) => `<option value="${date}">${date}</option>`).join("");
  els.baseDateSelect.value = state.baseDate;
  renderCompareDateOptions();
}

function renderCompareDateOptions() {
  const compareDates = state.availableDates.filter((date) => date < state.baseDate);
  if (!compareDates.includes(state.compareDate)) {
    state.compareDate = compareDates[compareDates.length - 1] || "";
  }
  els.compareDateSelect.innerHTML = compareDates.map((date) => `<option value="${date}">${date}</option>`).join("");
  els.compareDateSelect.value = state.compareDate;
}

function render() {
  renderCompareDateOptions();
  renderOverviewTable();
  renderRanking();
  renderDetailMetrics();
  renderNavTable();
  renderChart();
  els.compareHeader.textContent = state.compareDate ? `${state.compareDate} 대비` : "사용자 지정";
}

function getVisibleEtfs() {
  return state.etfs;
}

function renderOverviewTable() {
  const rows = getVisibleEtfs()
    .map((etf) => ({ etf, metrics: calculateMetrics(etf, state.baseDate, state.compareDate) }))
    .sort((a, b) => safeMetricValue(b.metrics[state.sortMetric]) - safeMetricValue(a.metrics[state.sortMetric]));

  if (!rows.length) {
    els.returnsTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">표시할 ETF 데이터가 없습니다.</td></tr>`;
    return;
  }

  if (!rows.some((row) => row.etf.code === state.selectedEtf)) {
    state.selectedEtf = rows[0].etf.code;
  }

  els.returnsTableBody.innerHTML = rows
    .map(({ etf, metrics }) => {
      const rowClasses = [
        etf.code === state.selectedEtf ? "is-selected" : "",
        isFeaturedEtf(etf) ? "is-featured" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <tr class="${rowClasses}" data-code="${etf.code}">
          <td>
            <div class="etf-name">
              <strong>${escapeHtml(etf.name)}</strong>
              <span class="etf-code">${escapeHtml(etf.code)}</span>
            </div>
          </td>
          <td>${formatMetric(metrics["1D"])}</td>
          <td>${formatMetric(metrics["7D"])}</td>
          <td>${formatMetric(metrics.MTD)}</td>
          <td>${formatMetric(metrics.QTD)}</td>
          <td>${formatMetric(metrics.YTD)}</td>
          <td>${formatMetric(metrics.CUSTOM)}</td>
        </tr>
      `;
    })
    .join("");

  els.returnsTableBody.querySelectorAll("tr[data-code]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedEtf = row.dataset.code;
      render();
    });
    });
}

function isFeaturedEtf(etf) {
  return etf?.name?.startsWith(FEATURED_ETF_PREFIX);
}

function renderRanking() {
  const ranking = getVisibleEtfs()
    .map((etf) => ({ etf, value: calculateMetrics(etf, state.baseDate, state.compareDate)[state.rankingMetric] }))
    .filter((item) => item.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (!ranking.length) {
    els.rankingList.innerHTML = `<div class="empty-state">랭킹을 계산할 수 있는 데이터가 부족합니다.</div>`;
    return;
  }

  els.rankingList.innerHTML = ranking
    .map((item, index) => {
      const cls = item.value >= 0 ? "positive" : "negative";
      return `
        <div class="ranking-item">
          <div class="rank">${index + 1}</div>
          <div>
            <div class="rank-name">${escapeHtml(item.etf.name)}</div>
            <div class="rank-code">${escapeHtml(item.etf.code)}</div>
          </div>
          <div class="metric ${cls}">${toPercent(item.value)}</div>
        </div>
      `;
    })
    .join("");
}

function renderDetailMetrics() {
  const etf = state.grouped[state.selectedEtf];
  if (!etf) {
    els.detailMetrics.innerHTML = "";
    return;
  }

  const metrics = calculateMetrics(etf, state.baseDate, state.compareDate);
  const latest = etf.series.find((point) => point.date === state.baseDate);
  const cards = [
    { label: "ETF", value: etf.name, meta: etf.code },
    { label: "기준일 NAV", value: latest ? latest.nav.toFixed(2) : "-", meta: state.baseDate || "-" },
    { label: "YTD", value: metrics.YTD === null ? "-" : toPercent(metrics.YTD), meta: "연초 이후" },
    { label: "사용자 지정", value: metrics.CUSTOM === null ? "-" : toPercent(metrics.CUSTOM), meta: state.compareDate || "-" }
  ];

  els.detailMetrics.innerHTML = cards
    .map(
      (card) => `
        <div class="detail-card">
          <span class="detail-label">${escapeHtml(card.label)}</span>
          <strong class="detail-value">${escapeHtml(card.value)}</strong>
          <span class="detail-meta">${escapeHtml(card.meta)}</span>
        </div>
      `
    )
    .join("");
}

function renderNavTable() {
  const visibleEtfs = getVisibleEtfs();
  els.navTableHead.innerHTML = `<tr><th>날짜</th>${visibleEtfs
    .map((etf) => `<th>${escapeHtml(getNavTableLabel(etf.name))}</th>`)
    .join("")}</tr>`;

  const datesDesc = [...state.availableDates].sort((a, b) => b.localeCompare(a));
  els.navTableBody.innerHTML = datesDesc
    .map((date) => {
      const cells = visibleEtfs
        .map((etf) => {
          const point = state.grouped[etf.code]?.series.find((item) => item.date === date);
          return `<td>${point ? point.nav.toFixed(2) : "-"}</td>`;
        })
        .join("");
      return `<tr><td>${date}</td>${cells}</tr>`;
    })
    .join("");
}

function getNavTableLabel(name) {
  return NAV_TABLE_LABELS[name] || name;
}

function renderChart() {
  const etf = state.grouped[state.selectedEtf];
  if (!etf || !etf.series.length) {
    els.chartTitle.textContent = "선택 ETF NAV 추이";
    els.chartMeta.textContent = "";
    els.trendChart.innerHTML = "";
    return;
  }

  const series = etf.series.filter((point) => point.date <= state.baseDate);
  const basePoint = series[0];
  const values = series.map((point) => ((point.nav / basePoint.nav) - 1) * 100);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 640;
  const height = 280;
  const padding = 26;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2 - 18;
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = padding + (chartWidth * index) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / span) * chartHeight;
    return `${x},${y}`;
  });

  const lastValue = values[values.length - 1];
  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);

  els.chartTitle.textContent = `${etf.name} NAV 누적수익률 추이`;
  els.chartMeta.textContent = `${series[0].date} ~ ${state.baseDate}`;
  els.trendChart.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(244,184,96,0.40)"></stop>
        <stop offset="100%" stop-color="rgba(244,184,96,0.00)"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#111317"></rect>
    ${buildGridLines(min, max, padding, width, height, chartHeight, span)}
    <polygon fill="url(#chartFill)" points="${buildAreaPoints(points, height, padding)}"></polygon>
    <polyline fill="none" stroke="#f4b860" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="${points.join(" ")}"></polyline>
    <circle cx="${lastX}" cy="${lastY}" r="6" fill="#ffffff"></circle>
    <g>
      <rect x="${Math.max(lastX - 36, 16)}" y="${lastY - 46}" width="82" height="34" rx="10" fill="#242933"></rect>
      <text x="${Math.max(lastX + 4, 24)}" y="${lastY - 23}" fill="#ffffff" font-size="18" font-weight="700">${lastValue.toFixed(1)}%</text>
    </g>
    ${buildXAxisLabels(series, padding, chartWidth, height)}
  `;
}

function calculateMetrics(etf, baseDate, compareDate) {
  const baseIndex = etf.series.findIndex((point) => point.date === baseDate);
  if (baseIndex === -1) {
    return makeEmptyMetrics();
  }

  const basePoint = etf.series[baseIndex];
  const previousPoint = etf.series[baseIndex - 1];
  const point7D = etf.series[baseIndex - 7];
  const monthReference = getMonthReference(etf.series, baseDate);
  const quarterReference = getQuarterReference(etf.series, baseDate);
  const yearReference = getYearReference(etf.series, baseDate);
  const customReference = etf.series.find((point) => point.date === compareDate);

  return {
    "1D": computeReturn(basePoint, previousPoint),
    "7D": computeReturn(basePoint, point7D),
    MTD: computeReturn(basePoint, monthReference),
    QTD: computeReturn(basePoint, quarterReference),
    YTD: computeReturn(basePoint, yearReference),
    CUSTOM: computeReturn(basePoint, customReference)
  };
}

function getMonthReference(series, baseDate) {
  const prefix = baseDate.slice(0, 7);
  const firstInMonth = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInMonth?.date);
  return index > 0 ? series[index - 1] : null;
}

function getQuarterReference(series, baseDate) {
  const [year, month] = baseDate.split("-").map(Number);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const prefix = `${year}-${String(quarterStartMonth).padStart(2, "0")}`;
  const firstInQuarter = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInQuarter?.date);
  return index > 0 ? series[index - 1] : null;
}

function getYearReference(series, baseDate) {
  const prefix = baseDate.slice(0, 4);
  const firstInYear = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInYear?.date);
  return index > 0 ? series[index - 1] : null;
}

function computeReturn(basePoint, referencePoint) {
  if (!basePoint || !referencePoint || referencePoint.nav === 0) {
    return null;
  }
  return basePoint.nav / referencePoint.nav - 1;
}

function buildGridLines(min, max, padding, width, height, chartHeight, span) {
  let output = "";
  for (let i = 0; i <= 4; i += 1) {
    const ratio = i / 4;
    const y = height - padding - ratio * chartHeight;
    const value = min + ratio * span;
    output += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="4 6"></line>`;
    output += `<text x="8" y="${y + 5}" fill="#aeb7c4" font-size="13">${value.toFixed(1)}%</text>`;
  }
  return output;
}

function buildAreaPoints(points, height, padding) {
  const first = points[0];
  const last = points[points.length - 1];
  return `${first} ${points.join(" ")} ${last.split(",")[0]},${height - padding} ${first.split(",")[0]},${height - padding}`;
}

function buildXAxisLabels(series, padding, chartWidth, height) {
  let output = "";
  const steps = Math.min(4, Math.max(series.length - 1, 1));
  for (let i = 0; i <= steps; i += 1) {
    const pointIndex = Math.round((series.length - 1) * (i / Math.max(steps, 1)));
    const x = padding + (chartWidth * pointIndex) / Math.max(series.length - 1, 1);
    output += `<text x="${x - 18}" y="${height - 8}" fill="#aeb7c4" font-size="13">${series[pointIndex].date.slice(5)}</text>`;
  }
  return output;
}

function makeEmptyMetrics() {
  return { "1D": null, "7D": null, MTD: null, QTD: null, YTD: null, CUSTOM: null };
}

function formatMetric(value) {
  if (value === null) {
    return `<span class="metric empty">-</span>`;
  }
  return `<span class="metric ${value >= 0 ? "positive" : "negative"}">${toPercent(value)}</span>`;
}

function toPercent(value) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function safeMetricValue(value) {
  return value === null ? Number.NEGATIVE_INFINITY : value;
}

function parseNumber(value) {
  return Number(String(value).replaceAll(",", ""));
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

function getFallbackCompareDate(baseDate) {
  const candidates = state.availableDates.filter((date) => date < baseDate);
  return candidates[candidates.length - 1] || "";
}

function setLoading(loading) {
  els.refreshButton.disabled = loading;
  els.refreshButton.textContent = loading ? "불러오는 중..." : "KRX 데이터 새로고침";
}

function toDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
