const FIXED_START_DATE = "2025-12-01";
const EXTRA_RAW_DATE = "2025-02-25";
const FEATURED_ETF_PREFIX = "1Q ";
const ETF_NAME_ALIASES = {
  "ACE 종합채권(AA-이상)KIS액티브": "ACE 종합채권(AA-이상)액티브"
};
const ETF_GROUPS = {
  TOTAL_BOND: {
    label: "종합채권",
    featuredName: "1Q 종합채권(AA-이상)액티브",
    chartStartDate: "2026-01-02",
    etfNames: [
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
    ]
  },
  CREDIT_SHORT: {
    label: "중단기회사채",
    featuredName: "1Q 중단기회사채(A-이상)액티브",
    chartStartDate: "2026-01-02",
    etfNames: [
      "1Q 중단기회사채(A-이상)액티브",
      "SOL 중단기회사채(A-이상)액티브"
    ]
  }
};
const NAV_TABLE_LABELS = {
  "1Q 종합채권(AA-이상)액티브": "1Q",
  "ACE 종합채권(AA-이상)액티브": "ACE",
  "PLUS 종합채권(AA-이상)액티브": "PLUS",
  "RISE 종합채권(A-이상)액티브": "RISE",
  "KODEX 종합채권(AA-이상)액티브": "KODEX",
  "SOL 종합채권(AA-이상)액티브": "SOL",
  "TIGER 종합채권(AA-이상)액티브": "TIGER",
  "HK 종합채권(AA-이상)액티브": "HK",
  "KIWOOM 종합채권(AA-이상)액티브": "KIWOOM",
  "파워 종합채권(AA-이상)액티브": "파워",
  "1Q 중단기회사채(A-이상)액티브": "1Q",
  "SOL 중단기회사채(A-이상)액티브": "SOL"
};
const ALL_TARGET_ETF_NAMES = [...new Set(Object.values(ETF_GROUPS).flatMap((group) => group.etfNames))];

const sampleDataset = [
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.12", ASSET_TOTAL: "95400000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1034.55", ASSET_TOTAL: "95650000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1037.48", ASSET_TOTAL: "96220000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1041.34", ASSET_TOTAL: "96510000000" },
  { BAS_DD: "2026-03-11", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.18", ASSET_TOTAL: "96610000000" },
  { BAS_DD: "2026-03-12", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.44", ASSET_TOTAL: "96635000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1042.71", ASSET_TOTAL: "96693810000" },
  { BAS_DD: "2026-03-16", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.10", ASSET_TOTAL: "96787990000" },
  { BAS_DD: "2026-03-17", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.39", ASSET_TOTAL: "96787320000" },
  { BAS_DD: "2026-03-18", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.68", ASSET_TOTAL: "97214930000" },
  { BAS_DD: "2026-03-19", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1043.92", ASSET_TOTAL: "96895090000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_BOND", ISU_NM: "1Q 종합채권(AA-이상)액티브", NAV: "1044.21", ASSET_TOTAL: "96719830000" },
  { BAS_DD: "2025-12-31", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1018.42", ASSET_TOTAL: "109800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1018.66", ASSET_TOTAL: "110050000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1020.94", ASSET_TOTAL: "110220000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1023.62", ASSET_TOTAL: "110280000000" },
  { BAS_DD: "2026-03-11", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1024.11", ASSET_TOTAL: "110300000000" },
  { BAS_DD: "2026-03-12", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1024.25", ASSET_TOTAL: "110320000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1024.41", ASSET_TOTAL: "110340000000" },
  { BAS_DD: "2026-03-16", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1024.73", ASSET_TOTAL: "110360000000" },
  { BAS_DD: "2026-03-17", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1024.96", ASSET_TOTAL: "110380000000" },
  { BAS_DD: "2026-03-18", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1025.20", ASSET_TOTAL: "110390000000" },
  { BAS_DD: "2026-03-19", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1025.36", ASSET_TOTAL: "110405000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "ACE_BOND", ISU_NM: "ACE 종합채권(AA-이상)액티브", NAV: "1025.61", ASSET_TOTAL: "110407010000" },
  { BAS_DD: "2026-03-20", ISU_CD: "PLUS_BOND", ISU_NM: "PLUS 종합채권(AA-이상)액티브", NAV: "1032.44", ASSET_TOTAL: "110407010000" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_BOND", ISU_NM: "RISE 종합채권(A-이상)액티브", NAV: "1019.82", ASSET_TOTAL: "105669540000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_BOND", ISU_NM: "KODEX 종합채권(AA-이상)액티브", NAV: "1038.15", ASSET_TOTAL: "113009680000" },
  { BAS_DD: "2026-03-20", ISU_CD: "SOL_BOND", ISU_NM: "SOL 종합채권(AA-이상)액티브", NAV: "1030.77", ASSET_TOTAL: "108980130000" },
  { BAS_DD: "2026-03-20", ISU_CD: "TIGER_BOND", ISU_NM: "TIGER 종합채권(AA-이상)액티브", NAV: "1031.24", ASSET_TOTAL: "54319360000" },
  { BAS_DD: "2026-03-20", ISU_CD: "HK_BOND", ISU_NM: "HK 종합채권(AA-이상)액티브", NAV: "1028.64", ASSET_TOTAL: "100673020000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KIWOOM_BOND", ISU_NM: "KIWOOM 종합채권(AA-이상)액티브", NAV: "1027.58", ASSET_TOTAL: "98012540000" },
  { BAS_DD: "2026-03-20", ISU_CD: "POWER_BOND", ISU_NM: "파워 종합채권(AA-이상)액티브", NAV: "1026.91", ASSET_TOTAL: "95888950000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1012.18", ASSET_TOTAL: "41200000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1012.44", ASSET_TOTAL: "41250000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1013.28", ASSET_TOTAL: "41840000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1014.42", ASSET_TOTAL: "42360000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1015.04", ASSET_TOTAL: "42780000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SHORT", ISU_NM: "1Q 중단기회사채(A-이상)액티브", NAV: "1015.72", ASSET_TOTAL: "42890000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1009.61", ASSET_TOTAL: "63300000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1009.88", ASSET_TOTAL: "63420000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1010.62", ASSET_TOTAL: "64070000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1011.74", ASSET_TOTAL: "64610000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1012.51", ASSET_TOTAL: "64890000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1013.05", ASSET_TOTAL: "64970000000" }
];

const state = {
  etfGroup: "TOTAL_BOND",
  baseDate: "",
  compareDate: "",
  overviewMode: "RETURNS",
  rankingMetric: "YTD",
  sortMetric: "YTD",
  rawMetric: "NAV",
  selectedEtf: "",
  dataset: [],
  grouped: {},
  etfs: [],
  availableDates: []
};

const els = {
  groupTotalBondButton: document.querySelector("#groupTotalBondButton"),
  groupCreditShortButton: document.querySelector("#groupCreditShortButton"),
  baseDateSelect: document.querySelector("#baseDateSelect"),
  compareDateSelect: document.querySelector("#compareDateSelect"),
  rankingMetricSelect: document.querySelector("#rankingMetricSelect"),
  sortMetricSelect: document.querySelector("#sortMetricSelect"),
  overviewTitle: document.querySelector("#overviewTitle"),
  overviewReturnsButton: document.querySelector("#overviewReturnsButton"),
  overviewAssetButton: document.querySelector("#overviewAssetButton"),
  returnsTableBody: document.querySelector("#returnsTableBody"),
  peerRankingSection: document.querySelector("#peerRankingSection"),
  peerRankTableBody: document.querySelector("#peerRankTableBody"),
  rankingList: document.querySelector("#rankingList"),
  compareHeader: document.querySelector("#compareHeader"),
  rawDataTitle: document.querySelector("#rawDataTitle"),
  navTableHead: document.querySelector("#navTableHead"),
  navTableBody: document.querySelector("#navTableBody"),
  rawNavButton: document.querySelector("#rawNavButton"),
  rawAssetButton: document.querySelector("#rawAssetButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
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

function setEtfGroup(groupKey) {
  if (!ETF_GROUPS[groupKey] || state.etfGroup === groupKey) {
    return;
  }

  state.etfGroup = groupKey;
  const featuredEtf = getFeaturedEtf();
  state.selectedEtf = featuredEtf?.code || getVisibleEtfs()[0]?.code || "";
  render();
}

function bindEvents() {
  els.groupTotalBondButton.addEventListener("click", () => {
    setEtfGroup("TOTAL_BOND");
  });

  els.groupCreditShortButton.addEventListener("click", () => {
    setEtfGroup("CREDIT_SHORT");
  });

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

  els.overviewReturnsButton.addEventListener("click", () => {
    state.overviewMode = "RETURNS";
    renderOverviewControls();
    renderOverviewTable();
  });

  els.overviewAssetButton.addEventListener("click", () => {
    state.overviewMode = "ASSET";
    renderOverviewControls();
    renderOverviewTable();
  });

  els.refreshButton.addEventListener("click", async () => {
    await loadDataset();
  });

  els.rawNavButton.addEventListener("click", () => {
    state.rawMetric = "NAV";
    renderRawMetricControls();
    renderNavTable();
  });

  els.rawAssetButton.addEventListener("click", () => {
    state.rawMetric = "ASSET_TOTAL";
    renderRawMetricControls();
    renderNavTable();
  });

  els.exportCsvButton.addEventListener("click", () => {
    exportRawDataCsv();
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
  state.etfs = Object.values(state.grouped);
  state.availableDates = [...new Set(state.dataset.map((row) => row.BAS_DD))].sort();
  state.baseDate = state.availableDates[state.availableDates.length - 1] || "";
  state.compareDate = state.availableDates.find((date) => date < state.baseDate) || "";
  state.selectedEtf = state.selectedEtf && state.grouped[state.selectedEtf] ? state.selectedEtf : getFeaturedEtf()?.code || "";
  renderDateOptions();
  render();
}

function normalizeRows(rows) {
  return rows
    .map((row) => {
      const normalizedName = normalizeEtfName(row.ISU_NM);
      return {
        BAS_DD: normalizeDate(row.BAS_DD),
        ISU_CD: String(row.ISU_CD || "").trim(),
        ISU_NM: normalizedName,
        NAV: String(row.NAV || "").replaceAll(",", ""),
        ASSET_TOTAL: String(row.INVSTASST_NETASST_TOTAMT || row.ASSET_TOTAL || "").replaceAll(",", "")
      };
    })
    .filter((row) => ALL_TARGET_ETF_NAMES.includes(row.ISU_NM))
    .filter((row) => row.BAS_DD && row.ISU_CD && row.ISU_NM && row.NAV && row.NAV !== "-")
    .sort((a, b) => a.BAS_DD.localeCompare(b.BAS_DD) || a.ISU_CD.localeCompare(b.ISU_CD));
}

function normalizeEtfName(name) {
  const raw = String(name || "").trim();
  return ETF_NAME_ALIASES[raw] || raw;
}

function buildGroupedData(rows) {
  return rows.reduce((acc, row) => {
    if (!acc[row.ISU_CD]) {
      acc[row.ISU_CD] = { code: row.ISU_CD, name: row.ISU_NM, series: [] };
    }
    acc[row.ISU_CD].series.push({
      date: row.BAS_DD,
      nav: parseNumber(row.NAV),
      assetTotal: parseNullableNumber(row.ASSET_TOTAL)
    });
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
  renderGroupControls();
  renderOverviewControls();
  renderOverviewTable();
  renderPeerRankingTable();
  renderRanking();
  renderDetailMetrics();
  renderRawMetricControls();
  renderNavTable();
  renderChart();
  els.compareHeader.textContent = "비교일 대비";
}

function getCurrentGroupMeta() {
  return ETF_GROUPS[state.etfGroup] || ETF_GROUPS.TOTAL_BOND;
}

function renderGroupControls() {
  els.groupTotalBondButton.classList.toggle("is-active", state.etfGroup === "TOTAL_BOND");
  els.groupCreditShortButton.classList.toggle("is-active", state.etfGroup === "CREDIT_SHORT");
}

function getVisibleEtfs() {
  const groupMeta = getCurrentGroupMeta();
  return groupMeta.etfNames
    .map((name) => state.etfs.find((etf) => etf.name === name))
    .filter(Boolean);
}

function renderOverviewControls() {
  const isReturns = state.overviewMode === "RETURNS";
  els.overviewReturnsButton.classList.toggle("is-active", isReturns);
  els.overviewAssetButton.classList.toggle("is-active", !isReturns);
  els.overviewTitle.textContent = isReturns ? "ETF 수익률 현황" : "순자산총액";
  els.peerRankingSection.classList.toggle("is-hidden", !isReturns);
}

function renderOverviewTable() {
  const rows = getVisibleEtfs()
    .map((etf) => ({
      etf,
      metrics:
        state.overviewMode === "ASSET"
          ? calculateAssetMetrics(etf, state.baseDate, state.compareDate)
          : calculateMetrics(etf, state.baseDate, state.compareDate)
    }))
    .sort((a, b) => safeMetricValue(b.metrics[state.sortMetric]) - safeMetricValue(a.metrics[state.sortMetric]));

  if (!rows.length) {
    els.returnsTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">표시할 ETF 데이터가 없습니다.</td></tr>`;
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
          <td>${formatOverviewMetric(metrics["1D"])}</td>
          <td>${formatOverviewMetric(metrics["7D"])}</td>
          <td>${formatOverviewMetric(metrics.MTD)}</td>
          <td>${formatOverviewMetric(metrics.QTD)}</td>
          <td>${formatOverviewMetric(metrics.YTD)}</td>
          <td>${formatOverviewMetric(metrics.SINCE_1Q)}</td>
          <td>${formatOverviewMetric(metrics.CUSTOM)}</td>
          <td>${formatAssetTotalInEok(getAssetTotalAtOrBefore(etf, state.baseDate))}</td>
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

function renderPeerRankingTable() {
  if (state.overviewMode !== "RETURNS") {
    els.peerRankTableBody.innerHTML = "";
    return;
  }

  const featuredEtf = getFeaturedEtf();
  if (!featuredEtf) {
    els.peerRankTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">표시할 ETF 데이터가 없습니다.</td></tr>`;
    return;
  }

  const peers = getVisibleEtfs().map((etf) => ({
    etf,
    metrics: calculateMetrics(etf, state.baseDate, state.compareDate)
  }));

  const rankRow = {
    "1D": getMetricRank(peers, featuredEtf.code, "1D"),
    "7D": getMetricRank(peers, featuredEtf.code, "7D"),
    MTD: getMetricRank(peers, featuredEtf.code, "MTD"),
    QTD: getMetricRank(peers, featuredEtf.code, "QTD"),
    YTD: getMetricRank(peers, featuredEtf.code, "YTD"),
    SINCE_1Q: getMetricRank(peers, featuredEtf.code, "SINCE_1Q"),
    CUSTOM: getMetricRank(peers, featuredEtf.code, "CUSTOM")
  };

  els.peerRankTableBody.innerHTML = `
    <tr>
      <td>${escapeHtml(featuredEtf.name)}</td>
      <td>${formatRankCell(rankRow["1D"])}</td>
      <td>${formatRankCell(rankRow["7D"])}</td>
      <td>${formatRankCell(rankRow.MTD)}</td>
      <td>${formatRankCell(rankRow.QTD)}</td>
      <td>${formatRankCell(rankRow.YTD)}</td>
      <td>${formatRankCell(rankRow.SINCE_1Q)}</td>
      <td>${formatRankCell(rankRow.CUSTOM)}</td>
      <td>${formatAssetTotalInEok(getAssetTotalAtOrBefore(featuredEtf, state.baseDate))}</td>
    </tr>
  `;
}

function renderRawMetricControls() {
  els.rawNavButton.classList.toggle("is-active", state.rawMetric === "NAV");
  els.rawAssetButton.classList.toggle("is-active", state.rawMetric === "ASSET_TOTAL");
  els.rawDataTitle.textContent =
    state.rawMetric === "NAV" ? "ETF NAV 원본 데이터" : "ETF 순자산총액 원본 데이터";
}

function isFeaturedEtf(etf) {
  return etf?.name === getCurrentGroupMeta().featuredName || etf?.name?.startsWith(FEATURED_ETF_PREFIX);
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
  const etf = getFeaturedEtf();
  if (!etf) {
    els.detailMetrics.innerHTML = "";
    return;
  }

  const metrics = calculateMetrics(etf, state.baseDate, state.compareDate);
  const latest = etf.series.find((point) => point.date === state.baseDate);
  const cards = [
    { label: "ETF", value: etf.name, meta: etf.code },
    { label: "기준일 NAV", value: latest ? latest.nav.toFixed(2) : "-", meta: state.baseDate || "-" },
    { label: "YTD", value: metrics.YTD === null ? "-" : toPercent(metrics.YTD), meta: "연초 이후" }
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

  const datesDesc = getRawDataDates();
  els.navTableBody.innerHTML = datesDesc
    .map((date) => {
      const cells = visibleEtfs
        .map((etf) => {
          const point = getSeriesPoint(etf, date);
          return `<td>${formatRawMetricCell(etf, date, point)}</td>`;
        })
        .join("");
      return `<tr><td>${date}</td>${cells}</tr>`;
    })
    .join("");
}

function getNavTableLabel(name) {
  return NAV_TABLE_LABELS[name] || name;
}

function exportRawDataCsv() {
  const visibleEtfs = getVisibleEtfs();
  const datesDesc = getRawDataDates();
  const header = ["날짜", ...visibleEtfs.map((etf) => getNavTableLabel(etf.name))];
  const rows = datesDesc.map((date) => [
    date,
    ...visibleEtfs.map((etf) => {
      const point = getSeriesPoint(etf, date);
      return getRawMetricCsvValue(etf, date, point);
    })
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => toCsvCell(value)).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hana-bond-etf-${state.rawMetric === "NAV" ? "nav" : "asset-total"}-${state.baseDate || toDateInput(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getRawDataDates() {
  const datesDesc = [...state.availableDates].sort((a, b) => b.localeCompare(a));
  if (!datesDesc.includes(EXTRA_RAW_DATE)) {
    datesDesc.push(EXTRA_RAW_DATE);
  }
  return datesDesc;
}

function getSeriesPoint(etf, date) {
  return state.grouped[etf.code]?.series.find((item) => item.date === date) || null;
}

function formatRawMetricCell(etf, date, point) {
  if (state.rawMetric === "ASSET_TOTAL") {
    return formatAssetTotalInEok(getAssetTotalAtOrBefore(etf, date));
  }
  if (!point) {
    return "-";
  }
  return Number.isFinite(point.nav) ? point.nav.toFixed(2) : "-";
}

function getRawMetricCsvValue(etf, date, point) {
  if (state.rawMetric === "ASSET_TOTAL") {
    const assetTotal = getAssetTotalAtOrBefore(etf, date);
    return Number.isFinite(assetTotal) ? formatAssetTotalInEok(assetTotal, false) : "-";
  }
  if (!point) {
    return "-";
  }
  return Number.isFinite(point.nav) ? point.nav.toFixed(2) : "-";
}

function renderChart() {
  const etf = getFeaturedEtf();
  const groupMeta = getCurrentGroupMeta();
  if (!etf || !etf.series.length) {
    els.chartTitle.textContent = groupMeta.featuredName;
    els.chartMeta.textContent = "";
    els.trendChart.innerHTML = "";
    return;
  }

  const series = etf.series.filter(
    (point) => point.date >= groupMeta.chartStartDate && point.date <= state.baseDate
  );
  if (!series.length) {
    els.chartTitle.textContent = groupMeta.featuredName;
    els.chartMeta.textContent = `${groupMeta.chartStartDate} ~ ${state.baseDate}`;
    els.trendChart.innerHTML = "";
    return;
  }

  const basePoint = series[0];
  const values = series.map((point) => ((point.nav / basePoint.nav) - 1) * 100);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 700;
  const height = 320;
  const paddingLeft = 56;
  const paddingRight = 88;
  const paddingTop = 24;
  const paddingBottom = 44;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = paddingLeft + (chartWidth * index) / Math.max(values.length - 1, 1);
    const y = height - paddingBottom - ((value - min) / span) * chartHeight;
    return `${x},${y}`;
  });

  const lastValue = values[values.length - 1];
  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);
  const bubbleWidth = 92;
  const bubbleHeight = 36;
  const bubbleX = Math.max(Math.min(lastX - bubbleWidth - 12, width - bubbleWidth - 12), 12);
  const bubbleY = Math.max(lastY - bubbleHeight - 10, 12);
  const bubbleTextX = bubbleX + 14;
  const bubbleTextY = bubbleY + 23;

  els.chartTitle.textContent = etf.name;
  els.chartMeta.textContent = `${groupMeta.chartStartDate} ~ ${state.baseDate}`;
  els.trendChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  els.trendChart.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(244,184,96,0.40)"></stop>
        <stop offset="100%" stop-color="rgba(244,184,96,0.00)"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#111317"></rect>
    ${buildGridLines(min, max, paddingLeft, width - paddingRight, height, paddingTop, paddingBottom, chartHeight, span)}
    <polygon fill="url(#chartFill)" points="${buildAreaPoints(points, height, paddingBottom)}"></polygon>
    <polyline fill="none" stroke="#f4b860" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="${points.join(" ")}"></polyline>
    <circle cx="${lastX}" cy="${lastY}" r="6" fill="#ffffff"></circle>
    <g>
      <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="10" fill="#242933"></rect>
      <text x="${bubbleTextX}" y="${bubbleTextY}" fill="#ffffff" font-size="18" font-weight="700">${lastValue.toFixed(1)}%</text>
    </g>
    ${buildXAxisLabels(series, paddingLeft, chartWidth, height, paddingBottom)}
  `;
}

function getFeaturedEtf() {
  const groupMeta = getCurrentGroupMeta();
  return (
    getVisibleEtfs().find((etf) => etf.name === groupMeta.featuredName) ||
    getVisibleEtfs().find((etf) => etf.code === state.selectedEtf) ||
    getVisibleEtfs()[0] ||
    null
  );
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
  const fixedReference = etf.series.find((point) => point.date === EXTRA_RAW_DATE);
  const customReference = etf.series.find((point) => point.date === compareDate);

  return {
    "1D": computeReturn(basePoint, previousPoint),
    "7D": computeReturn(basePoint, point7D),
    MTD: computeReturn(basePoint, monthReference),
    QTD: computeReturn(basePoint, quarterReference),
    YTD: computeReturn(basePoint, yearReference),
    SINCE_1Q: computeReturn(basePoint, fixedReference),
    CUSTOM: computeReturn(basePoint, customReference)
  };
}

function calculateAssetMetrics(etf, baseDate, compareDate) {
  const series = state.grouped[etf.code]?.series || [];
  const basePoint = getEffectiveAssetPoint(series, baseDate);
  if (!basePoint) {
    return makeEmptyMetrics();
  }

  const previousPoint = getPreviousEffectiveAssetPoint(series, basePoint.date);
  const point7D = getNthPreviousEffectiveAssetPoint(series, basePoint.date, 7);
  const monthReference = getEffectiveAssetReference(series, getMonthReferenceDate(series, baseDate));
  const quarterReference = getEffectiveAssetReference(series, getQuarterReferenceDate(series, baseDate));
  const yearReference = getEffectiveAssetReference(series, getYearReferenceDate(series, baseDate));
  const fixedReference = getEffectiveAssetReference(series, EXTRA_RAW_DATE);
  const customReference = getEffectiveAssetReference(series, compareDate);

  return {
    "1D": computeAssetReturn(basePoint, previousPoint),
    "7D": computeAssetReturn(basePoint, point7D),
    MTD: computeAssetReturn(basePoint, monthReference),
    QTD: computeAssetReturn(basePoint, quarterReference),
    YTD: computeAssetReturn(basePoint, yearReference),
    SINCE_1Q: computeAssetReturn(basePoint, fixedReference),
    CUSTOM: computeAssetReturn(basePoint, customReference)
  };
}

function getMonthReference(series, baseDate) {
  const prefix = baseDate.slice(0, 7);
  const firstInMonth = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInMonth?.date);
  return index > 0 ? series[index - 1] : null;
}

function getMonthReferenceDate(series, baseDate) {
  const prefix = baseDate.slice(0, 7);
  const firstInMonth = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInMonth?.date);
  return index > 0 ? series[index - 1]?.date ?? null : null;
}

function getQuarterReference(series, baseDate) {
  const [year, month] = baseDate.split("-").map(Number);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const prefix = `${year}-${String(quarterStartMonth).padStart(2, "0")}`;
  const firstInQuarter = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInQuarter?.date);
  return index > 0 ? series[index - 1] : null;
}

function getQuarterReferenceDate(series, baseDate) {
  const [year, month] = baseDate.split("-").map(Number);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const prefix = `${year}-${String(quarterStartMonth).padStart(2, "0")}`;
  const firstInQuarter = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInQuarter?.date);
  return index > 0 ? series[index - 1]?.date ?? null : null;
}

function getYearReference(series, baseDate) {
  const prefix = baseDate.slice(0, 4);
  const firstInYear = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInYear?.date);
  return index > 0 ? series[index - 1] : null;
}

function getYearReferenceDate(series, baseDate) {
  const prefix = baseDate.slice(0, 4);
  const firstInYear = series.find((point) => point.date.startsWith(prefix));
  const index = series.findIndex((point) => point.date === firstInYear?.date);
  return index > 0 ? series[index - 1]?.date ?? null : null;
}

function computeReturn(basePoint, referencePoint) {
  if (!basePoint || !referencePoint || referencePoint.nav === 0) {
    return null;
  }
  return basePoint.nav / referencePoint.nav - 1;
}

function computeAssetReturn(basePoint, referencePoint) {
  if (!basePoint || !referencePoint || !Number.isFinite(referencePoint.assetTotal)) {
    return null;
  }
  return basePoint.assetTotal - referencePoint.assetTotal;
}

function buildGridLines(min, max, xStart, xEnd, height, paddingTop, paddingBottom, chartHeight, span) {
  let output = "";
  for (let i = 0; i <= 4; i += 1) {
    const ratio = i / 4;
    const y = height - paddingBottom - ratio * chartHeight;
    const value = min + ratio * span;
    output += `<line x1="${xStart}" y1="${y}" x2="${xEnd}" y2="${y}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="4 6"></line>`;
    output += `<text x="14" y="${y + 5}" fill="#aeb7c4" font-size="13">${value.toFixed(1)}%</text>`;
  }
  return output;
}

function buildAreaPoints(points, height, paddingBottom) {
  const first = points[0];
  const last = points[points.length - 1];
  return `${first} ${points.join(" ")} ${last.split(",")[0]},${height - paddingBottom} ${first.split(",")[0]},${height - paddingBottom}`;
}

function buildXAxisLabels(series, paddingLeft, chartWidth, height, paddingBottom) {
  let output = "";
  const steps = Math.min(4, Math.max(series.length - 1, 1));
  for (let i = 0; i <= steps; i += 1) {
    const pointIndex = Math.round((series.length - 1) * (i / Math.max(steps, 1)));
    const x = paddingLeft + (chartWidth * pointIndex) / Math.max(series.length - 1, 1);
    output += `<text x="${x - 18}" y="${height - Math.max(paddingBottom - 28, 8)}" fill="#aeb7c4" font-size="13">${series[pointIndex].date.slice(5)}</text>`;
  }
  return output;
}

function makeEmptyMetrics() {
  return { "1D": null, "7D": null, MTD: null, QTD: null, YTD: null, SINCE_1Q: null, CUSTOM: null };
}

function formatMetric(value) {
  if (value === null) {
    return `<span class="metric empty">-</span>`;
  }
  return `<span class="metric ${value >= 0 ? "positive" : "negative"}">${toPercent(value)}</span>`;
}

function formatOverviewMetric(value) {
  return state.overviewMode === "ASSET" ? formatAssetDelta(value) : formatMetric(value);
}

function formatAssetDelta(value) {
  if (value === null || !Number.isFinite(value)) {
    return `<span class="metric empty">-</span>`;
  }
  const cls = value >= 0 ? "positive" : "negative";
  return `<span class="metric ${cls}">${formatSignedAssetDeltaInEok(value)}</span>`;
}

function formatAssetTotal(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString("ko-KR");
}

function formatAssetTotalInEok(value, withGrouping = true) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  const converted = value / 100000000;
  const formatted = converted.toFixed(1);
  return withGrouping ? Number(formatted).toLocaleString("ko-KR") : formatted;
}

function formatSignedAssetDeltaInEok(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  const converted = Math.abs(value) / 100000000;
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${converted.toFixed(1)}`;
}

function formatRankCell(rank) {
  if (!Number.isFinite(rank)) {
    return `<span class="metric empty">-</span>`;
  }
  return `<span class="metric">${rank}위</span>`;
}

function toPercent(value) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(3)}%`;
}

function safeMetricValue(value) {
  return value === null ? Number.NEGATIVE_INFINITY : value;
}

function parseNumber(value) {
  return Number(String(value).replaceAll(",", ""));
}

function parseNullableNumber(value) {
  const normalized = String(value ?? "").replaceAll(",", "").trim();
  if (!normalized || normalized === "-") {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getAssetTotalAtOrBefore(etf, date) {
  const series = state.grouped[etf.code]?.series || [];

  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index];
    if (point.date > date) {
      continue;
    }
    if (Number.isFinite(point.assetTotal) && point.assetTotal !== 0) {
      return point.assetTotal;
    }
  }

  return null;
}

function getEffectiveAssetPoint(series, date) {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index];
    if (point.date > date) {
      continue;
    }
    if (Number.isFinite(point.assetTotal) && point.assetTotal !== 0) {
      return point;
    }
  }
  return null;
}

function getPreviousEffectiveAssetPoint(series, date) {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index];
    if (point.date >= date) {
      continue;
    }
    if (Number.isFinite(point.assetTotal) && point.assetTotal !== 0) {
      return point;
    }
  }
  return null;
}

function getNthPreviousEffectiveAssetPoint(series, date, steps) {
  let cursorDate = date;
  let point = null;
  for (let step = 0; step < steps; step += 1) {
    point = getPreviousEffectiveAssetPoint(series, cursorDate);
    if (!point) {
      return null;
    }
    cursorDate = point.date;
  }
  return point;
}

function getEffectiveAssetReference(series, referenceDate) {
  if (!referenceDate) {
    return null;
  }
  return getEffectiveAssetPoint(series, referenceDate);
}

function getMetricRank(peers, targetCode, metricKey) {
  const ranked = peers
    .map((item) => ({
      code: item.etf.code,
      value: item.metrics[metricKey]
    }))
    .filter((item) => item.value !== null)
    .sort((a, b) => b.value - a.value);

  const index = ranked.findIndex((item) => item.code === targetCode);
  return index === -1 ? null : index + 1;
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

function toCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
