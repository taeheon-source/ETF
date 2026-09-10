const FIXED_START_DATE = "2025-12-01";
const FEATURED_ETF_PREFIX = "1Q ";
const ETF_NAME_ALIASES = {
  "ACE 종합채권(AA-이상)KIS액티브": "ACE 종합채권(AA-이상)액티브",
  "KTOP 단기금융채액티브": "1Q 단기금융채액티브",
  "KBSTAR 단기국공채액티브": "RISE 단기국공채액티브",
  "KIWOOM 단기자금": "KOSEF 단기자금",
  "KIWOOM 단기채권ESG액티브": "히어로즈 단기채권ESG액티브"
};
const ETF_GROUPS = {
  TOTAL_BOND: {
    label: "종합채권",
    featuredName: "1Q 종합채권(AA-이상)액티브",
    chartStartDate: "2026-01-02",
    fixedCompareDate: "2025-02-25",
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
    fixedCompareDate: "2025-05-27",
    etfNames: [
      "1Q 중단기회사채(A-이상)액티브",
      "SOL 중단기회사채(A-이상)액티브"
    ]
  },
  SHORT_TERM: {
    label: "단기형",
    featuredName: "1Q 단기금융채액티브",
    chartStartDate: "2026-01-02",
    fixedCompareDate: "2023-08-03",
    etfNames: [
      "1Q 단기금융채액티브",
      "RISE 단기국공채액티브",
      "KODEX 단기채권",
      "KODEX 단기채권PLUS",
      "TIGER 단기채권액티브",
      "KOSEF 단기자금",
      "히어로즈 단기채권ESG액티브"
    ]
  },
  SPECIAL_BANK: {
    label: "단기 특은채형",
    featuredName: "1Q 단기특수은행채액티브",
    chartStartDate: "2026-01-02",
    fixedCompareDate: "2025-11-25",
    etfNames: [
      "1Q 단기특수은행채액티브",
      "RISE 단기특수은행채액티브"
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
  "SOL 중단기회사채(A-이상)액티브": "SOL",
  "1Q 단기금융채액티브": "1Q",
  "RISE 단기국공채액티브": "RISE",
  "KODEX 단기채권": "KODEX",
  "KODEX 단기채권PLUS": "KODEX+",
  "TIGER 단기채권액티브": "TIGER",
  "KOSEF 단기자금": "KOSEF",
  "히어로즈 단기채권ESG액티브": "히어로즈",
  "1Q 단기특수은행채액티브": "1Q",
  "RISE 단기특수은행채액티브": "RISE"
};
const ALL_TARGET_ETF_NAMES = [...new Set(Object.values(ETF_GROUPS).flatMap((group) => group.etfNames))];

/* 분배락 판정 기준. 고정 폭을 쓰면 듀레이션이 긴 ETF에서 평범한 금리
   하락일까지 분배락으로 오인한다. 그래서 각 ETF의 일간 변동폭(MAD)에
   맞춰 임계값을 잡고, 변동이 아주 작은 ETF를 위해 하한만 둔다.
   변동폭에 묻히는 분배금은 잡지 못한다. 그 경우 보정 없이 원본과 같아진다. */
const EX_DATE_MIN_DROP = 0.0005;
const EX_DATE_MAD_MULTIPLE = 8;

function medianOf(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/* NAV만으로는 분배금이 수익률에서 빠져 분배하는 ETF가 불리하게 잡힌다.
   분배락으로 보이는 날의 일간 수익률을 그 ETF의 평소 수준으로 되돌려
   총수익 지수(navTr)를 다시 쌓는다. 분배금 액수를 알 수 없어 쓰는 근사다.
   원본 nav는 그대로 두므로 껐다 켜도 같은 결과가 나온다. */
function buildTotalReturnSeries(series) {
  if (!state.adjustExDate || series.length < 2) {
    return series.map((point) => ({ ...point, navTr: point.nav, isExDate: false }));
  }

  const returns = series.slice(1).map((point, index) => point.nav / series[index].nav - 1);
  const median = medianOf(returns);
  const deviation = medianOf(returns.map((value) => Math.abs(value - median)));
  const cutoff = Math.max(EX_DATE_MIN_DROP, EX_DATE_MAD_MULTIPLE * deviation);
  let level = series[0].nav;
  const output = [{ ...series[0], navTr: level, isExDate: false }];

  series.slice(1).forEach((point, index) => {
    const isExDate = returns[index] < median - cutoff;
    level *= 1 + (isExDate ? median : returns[index]);
    output.push({ ...point, navTr: level, isExDate });
  });
  return output;
}

function setExDateAdjustment(enabled) {
  if (state.adjustExDate === enabled) {
    return;
  }
  state.adjustExDate = enabled;
  applyExDateAdjustment();
  syncExDateToggles();
  render();
}

function syncExDateToggles() {
  document.querySelectorAll("[data-gap-adjust]").forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.gapAdjust === "on") === state.adjustExDate);
  });
}

function describeExDates() {
  if (!state.adjustExDate) {
    return "원본 NAV 그대로입니다. 분배금이 빠져 있어 분배하는 ETF의 수익률이 실제보다 낮게 나옵니다.";
  }
  if (!state.exDates.length) {
    return "분배락으로 볼 만한 날이 잡히지 않았습니다.";
  }
  return `보정한 분배락: ${state.exDates.map((entry) => `${entry.name} ${entry.dates.length}회`).join(" · ")}`;
}

function exDateDetail() {
  return state.exDates.map((entry) => `${entry.name}: ${entry.dates.join(", ")}`).join("\n");
}

// 모든 수익률 계산이 같은 시계열을 보도록 한 곳에서 붙인다
function applyExDateAdjustment() {
  state.exDates = [];
  Object.values(state.grouped).forEach((etf) => {
    etf.series = buildTotalReturnSeries(etf.series);
    const dates = etf.series.filter((point) => point.isExDate).map((point) => point.date);
    if (dates.length) {
      state.exDates.push({ name: etf.name, dates });
    }
  });
}

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
  { BAS_DD: "2026-03-20", ISU_CD: "SOL_SHORT", ISU_NM: "SOL 중단기회사채(A-이상)액티브", NAV: "1013.05", ASSET_TOTAL: "64970000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1008.52", ASSET_TOTAL: "31800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1008.66", ASSET_TOTAL: "31920000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1010.28", ASSET_TOTAL: "32480000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1011.42", ASSET_TOTAL: "32960000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1011.96", ASSET_TOTAL: "33150000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SHORT_TERM", ISU_NM: "1Q 단기금융채액티브", NAV: "1012.63", ASSET_TOTAL: "33270000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1007.92", ASSET_TOTAL: "28700000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1008.04", ASSET_TOTAL: "28750000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1008.67", ASSET_TOTAL: "29010000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1009.11", ASSET_TOTAL: "29230000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1009.26", ASSET_TOTAL: "29370000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_GOV_SHORT", ISU_NM: "RISE 단기국공채액티브", NAV: "1009.31", ASSET_TOTAL: "29460000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1020.11", ASSET_TOTAL: "192000000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1020.26", ASSET_TOTAL: "192400000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1020.98", ASSET_TOTAL: "195300000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1021.64", ASSET_TOTAL: "197100000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1021.98", ASSET_TOTAL: "198200000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_SHORT", ISU_NM: "KODEX 단기채권", NAV: "1022.14", ASSET_TOTAL: "198700000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1015.08", ASSET_TOTAL: "58200000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1015.19", ASSET_TOTAL: "58340000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1015.84", ASSET_TOTAL: "58910000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1016.27", ASSET_TOTAL: "59420000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1016.51", ASSET_TOTAL: "59670000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KODEX_SHORT_PLUS", ISU_NM: "KODEX 단기채권PLUS", NAV: "1016.61", ASSET_TOTAL: "59820000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1006.44", ASSET_TOTAL: "44300000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1006.58", ASSET_TOTAL: "44410000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1007.03", ASSET_TOTAL: "44760000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1007.56", ASSET_TOTAL: "45020000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1007.84", ASSET_TOTAL: "45110000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "TIGER_SHORT_ACTIVE", ISU_NM: "TIGER 단기채권액티브", NAV: "1007.97", ASSET_TOTAL: "45180000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1024.28", ASSET_TOTAL: "86100000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1024.41", ASSET_TOTAL: "86250000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1024.92", ASSET_TOTAL: "86980000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1025.44", ASSET_TOTAL: "87530000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1025.73", ASSET_TOTAL: "87760000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "KOSEF_SHORT_CASH", ISU_NM: "KOSEF 단기자금", NAV: "1025.90", ASSET_TOTAL: "87840000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1004.88", ASSET_TOTAL: "12600000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1005.03", ASSET_TOTAL: "12640000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1005.58", ASSET_TOTAL: "12740000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1006.01", ASSET_TOTAL: "12850000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1006.24", ASSET_TOTAL: "12890000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "HEROES_SHORT_ESG", ISU_NM: "히어로즈 단기채권ESG액티브", NAV: "1006.37", ASSET_TOTAL: "12910000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1009.84", ASSET_TOTAL: "35800000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1010.01", ASSET_TOTAL: "35870000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1010.72", ASSET_TOTAL: "36320000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1011.29", ASSET_TOTAL: "36710000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1011.61", ASSET_TOTAL: "36860000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "1Q_SPECIAL_BANK", ISU_NM: "1Q 단기특수은행채액티브", NAV: "1011.86", ASSET_TOTAL: "36950000000" },
  { BAS_DD: "2025-12-31", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1008.63", ASSET_TOTAL: "27400000000" },
  { BAS_DD: "2026-01-02", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1008.79", ASSET_TOTAL: "27460000000" },
  { BAS_DD: "2026-02-02", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1009.34", ASSET_TOTAL: "27830000000" },
  { BAS_DD: "2026-03-02", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1009.96", ASSET_TOTAL: "28010000000" },
  { BAS_DD: "2026-03-13", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1010.26", ASSET_TOTAL: "28090000000" },
  { BAS_DD: "2026-03-20", ISU_CD: "RISE_SPECIAL_BANK", ISU_NM: "RISE 단기특수은행채액티브", NAV: "1010.42", ASSET_TOTAL: "28130000000" }
];

const state = {
  etfGroup: "TOTAL_BOND",
  baseDate: "",
  compareDatesByGroup: {},
  overviewMode: "RETURNS",
  rankingMetric: "YTD",
  sortMetric: "YTD",
  rawMetric: "NAV",
  selectedEtf: "",
  dataset: [],
  grouped: {},
  etfs: [],
  availableDates: [],
  adjustExDate: true,
  exDates: []
};

const els = {
  groupTotalBondButton: document.querySelector("#groupTotalBondButton"),
  groupCreditShortButton: document.querySelector("#groupCreditShortButton"),
  groupShortTermButton: document.querySelector("#groupShortTermButton"),
  groupSpecialBankButton: document.querySelector("#groupSpecialBankButton"),
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
  returnBasisNote: document.querySelector("#returnBasisNote"),
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
  ensureCompareDateForCurrentGroup();
  render();
}

function bindEvents() {
  // 수익률 탭과 GAP 탭 양쪽에 같은 토글이 있어 위임으로 한 번에 처리한다
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gap-adjust]");
    if (button) {
      setExDateAdjustment(button.dataset.gapAdjust === "on");
    }
  });

  els.groupTotalBondButton.addEventListener("click", () => {
    setEtfGroup("TOTAL_BOND");
  });

  els.groupCreditShortButton.addEventListener("click", () => {
    setEtfGroup("CREDIT_SHORT");
  });

  els.groupShortTermButton.addEventListener("click", () => {
    setEtfGroup("SHORT_TERM");
  });

  els.groupSpecialBankButton.addEventListener("click", () => {
    setEtfGroup("SPECIAL_BANK");
  });

  els.baseDateSelect.addEventListener("change", (event) => {
    state.baseDate = event.target.value;
    if (getCurrentCompareDate() >= state.baseDate) {
      state.compareDatesByGroup[state.etfGroup] = getFallbackCompareDate(state.baseDate);
    }
    render();
  });

  els.compareDateSelect.addEventListener("change", (event) => {
    state.compareDatesByGroup[state.etfGroup] = event.target.value;
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
  applyExDateAdjustment();
  state.etfs = Object.values(state.grouped);
  state.availableDates = [...new Set(state.dataset.map((row) => row.BAS_DD))].sort();
  state.baseDate = state.availableDates[state.availableDates.length - 1] || "";
  state.selectedEtf = state.selectedEtf && state.grouped[state.selectedEtf] ? state.selectedEtf : getFeaturedEtf()?.code || "";
  initializeGroupCompareDates();
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
  ensureCompareDateForCurrentGroup(compareDates);
  els.compareDateSelect.innerHTML = compareDates.map((date) => `<option value="${date}">${date}</option>`).join("");
  els.compareDateSelect.value = getCurrentCompareDate();
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
  renderGapChart();
  renderReturnBasisNote();
  els.compareHeader.textContent = "비교일 대비";
}

function renderReturnBasisNote() {
  els.returnBasisNote.textContent = describeExDates();
  els.returnBasisNote.title = exDateDetail();
}

function getCurrentGroupMeta() {
  return ETF_GROUPS[state.etfGroup] || ETF_GROUPS.TOTAL_BOND;
}

function initializeGroupCompareDates() {
  const compareDates = state.availableDates.filter((date) => date < state.baseDate);
  const defaultCompareDate = compareDates.includes(FIXED_START_DATE)
    ? FIXED_START_DATE
    : compareDates[compareDates.length - 1] || "";

  Object.keys(ETF_GROUPS).forEach((groupKey) => {
    const current = state.compareDatesByGroup[groupKey];
    state.compareDatesByGroup[groupKey] = compareDates.includes(current) ? current : defaultCompareDate;
  });
}

function getCurrentCompareDate() {
  return state.compareDatesByGroup[state.etfGroup] || "";
}

function ensureCompareDateForCurrentGroup(compareDates = state.availableDates.filter((date) => date < state.baseDate)) {
  const current = getCurrentCompareDate();
  if (compareDates.includes(current)) {
    return;
  }
  state.compareDatesByGroup[state.etfGroup] = compareDates.includes(FIXED_START_DATE)
    ? FIXED_START_DATE
    : compareDates[compareDates.length - 1] || "";
}

function renderGroupControls() {
  els.groupTotalBondButton.classList.toggle("is-active", state.etfGroup === "TOTAL_BOND");
  els.groupCreditShortButton.classList.toggle("is-active", state.etfGroup === "CREDIT_SHORT");
  els.groupShortTermButton.classList.toggle("is-active", state.etfGroup === "SHORT_TERM");
  els.groupSpecialBankButton.classList.toggle("is-active", state.etfGroup === "SPECIAL_BANK");
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
          ? calculateAssetMetrics(etf, state.baseDate, getCurrentCompareDate())
          : calculateMetrics(etf, state.baseDate, getCurrentCompareDate())
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
          <td>${formatOverviewMetric(metrics["5D"])}</td>
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
    metrics: calculateMetrics(etf, state.baseDate, getCurrentCompareDate())
  }));

  const rankRow = {
    "1D": getMetricRank(peers, featuredEtf.code, "1D"),
    "5D": getMetricRank(peers, featuredEtf.code, "5D"),
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
      <td>${formatRankCell(rankRow["5D"])}</td>
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
    .map((etf) => ({ etf, value: calculateMetrics(etf, state.baseDate, getCurrentCompareDate())[state.rankingMetric] }))
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

  const metrics = calculateMetrics(etf, state.baseDate, getCurrentCompareDate());
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
  return [...state.availableDates]
    .filter((date) => date >= FIXED_START_DATE)
    .sort((a, b) => b.localeCompare(a));
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
  const baseNav = basePoint.navTr ?? basePoint.nav;
  const values = series.map((point) => (((point.navTr ?? point.nav) / baseNav) - 1) * 100);
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
        <stop offset="0%" stop-color="rgba(1,145,120,0.40)"></stop>
        <stop offset="100%" stop-color="rgba(1,145,120,0.00)"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#111317"></rect>
    ${buildGridLines(min, max, paddingLeft, width - paddingRight, height, paddingTop, paddingBottom, chartHeight, span)}
    <polygon fill="url(#chartFill)" points="${buildAreaPoints(points, height, paddingBottom)}"></polygon>
    <polyline fill="none" stroke="#019178" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="${points.join(" ")}"></polyline>
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
  const groupMeta = getCurrentGroupMeta();
  const baseIndex = etf.series.findIndex((point) => point.date === baseDate);
  if (baseIndex === -1) {
    return makeEmptyMetrics();
  }

  const basePoint = etf.series[baseIndex];
  const previousPoint = etf.series[baseIndex - 1];
  const point5D = etf.series[baseIndex - 5];
  const monthReference = getMonthReference(etf.series, baseDate);
  const quarterReference = getQuarterReference(etf.series, baseDate);
  const yearReference = getYearReference(etf.series, baseDate);
  const fixedReference = etf.series.find((point) => point.date === groupMeta.fixedCompareDate);
  const customReference = etf.series.find((point) => point.date === compareDate);

  return {
    "1D": computeReturn(basePoint, previousPoint),
    "5D": computeReturn(basePoint, point5D),
    MTD: computeReturn(basePoint, monthReference),
    QTD: computeReturn(basePoint, quarterReference),
    YTD: computeReturn(basePoint, yearReference),
    SINCE_1Q: computeReturn(basePoint, fixedReference),
    CUSTOM: computeReturn(basePoint, customReference)
  };
}

function calculateAssetMetrics(etf, baseDate, compareDate) {
  const groupMeta = getCurrentGroupMeta();
  const series = state.grouped[etf.code]?.series || [];
  const basePoint = getEffectiveAssetPoint(series, baseDate);
  if (!basePoint) {
    return makeEmptyMetrics();
  }

  const previousPoint = getPreviousEffectiveAssetPoint(series, basePoint.date);
  const point5D = getNthPreviousEffectiveAssetPoint(series, basePoint.date, 5);
  const monthReference = getEffectiveAssetReference(series, getMonthReferenceDate(series, baseDate));
  const quarterReference = getEffectiveAssetReference(series, getQuarterReferenceDate(series, baseDate));
  const yearReference = getEffectiveAssetReference(series, getYearReferenceDate(series, baseDate));
  const fixedReference = getEffectiveAssetReference(series, groupMeta.fixedCompareDate);
  const customReference = getEffectiveAssetReference(series, compareDate);

  return {
    "1D": computeAssetReturn(basePoint, previousPoint),
    "5D": computeAssetReturn(basePoint, point5D),
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

// 수익률은 분배락 보정된 총수익 지수 기준이다. 원본 NAV는 원자료 표에만 쓴다.
function computeReturn(basePoint, referencePoint) {
  if (!basePoint || !referencePoint) {
    return null;
  }
  const base = basePoint.navTr ?? basePoint.nav;
  const reference = referencePoint.navTr ?? referencePoint.nav;
  if (!reference) {
    return null;
  }
  return base / reference - 1;
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
  return { "1D": null, "5D": null, MTD: null, QTD: null, YTD: null, SINCE_1Q: null, CUSTOM: null };
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

/* ── PEER 분석 탭 ── */
const peerState = { currentKey: "tiger", cache: {} };

const PEER_API = {
  "1q":         "/api/portfolio-1q",
  "tiger":      "/api/portfolio-tiger",
  "kodex-plus": "/api/portfolio-kodex?ticker=476050",
  "kodex":      "/api/portfolio-kodex?ticker=152380",
};

function initPeerTab() {
  document.querySelectorAll(".peer-etf-tabs .toggle-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".peer-etf-tabs .toggle-button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      peerState.currentKey = btn.dataset.peerEtf;
      loadPeerPortfolio(peerState.currentKey);
    });
  });

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "peer") {
        loadPeerPortfolio(peerState.currentKey);
      }
    });
  });
}

async function loadPeerPortfolio(key) {
  const container = document.getElementById("peerPortfolioContainer");
  if (!container) return;

  if (peerState.cache[key]) {
    renderPeerPortfolio(peerState.cache[key]);
    return;
  }

  const apiUrl = PEER_API[key];
  if (!apiUrl) {
    container.innerHTML = `
      <div class="peer-empty">
        <div class="peer-empty-icon"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="17" cy="16" r="7" stroke="currentColor" stroke-width="2.5"/>
          <circle cx="33" cy="16" r="7" stroke="currentColor" stroke-width="2.5"/>
          <path d="M4 40c0-6 5-10 13-10s13 4 13 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M33 30c5 0 11 3 11 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg></div>
        <h2>준비 중</h2>
        <p>해당 ETF의 구성종목 데이터는 준비 중입니다.</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="peer-loading">구성종목 불러오는 중...</div>`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    peerState.cache[key] = data;
    renderPeerPortfolio(data);
  } catch (e) {
    container.innerHTML = `<div class="peer-empty"><h2>오류</h2><p>데이터를 불러올 수 없습니다: ${escapeHtml(e.message)}</p></div>`;
  }
}

function renderPeerPortfolio(data) {
  const container = document.getElementById("peerPortfolioContainer");
  if (!container) return;

  const { name, updatedAt, holdings, headers } = data;
  if (!holdings || holdings.length === 0) {
    container.innerHTML = `<div class="peer-empty"><h2>데이터 없음</h2><p>해당 ETF의 구성종목 데이터가 없습니다.</p></div>`;
    return;
  }

  const dateStr = updatedAt ? updatedAt.slice(0, 10) : "";
  const headerHtml = (headers || ["종목코드", "종목명", "수량(주)", "평가금액(원)", "비중(%)"])
    .map((h) => `<th>${escapeHtml(h)}</th>`).join("");

  const rowsHtml = holdings
    .map((row) => {
      const cells = [
        escapeHtml(row.code || "-"),
        escapeHtml(row.name || "-"),
        escapeHtml(row.quantity || "-"),
        escapeHtml(row.value || "-"),
        (() => {
          const w = parseFloat(String(row.weight || "").replaceAll(",", ""));
          const cls = isNaN(w) ? "" : w >= 0 ? " class=\"metric positive\"" : " class=\"metric negative\"";
          return `<td${cls}>${isNaN(w) ? escapeHtml(String(row.weight || "-")) : w.toFixed(2) + "%"}</td>`;
        })(),
      ];
      return `<tr><td>${cells[0]}</td><td>${cells[1]}</td><td>${cells[2]}</td><td>${cells[3]}</td>${cells[4]}</tr>`;
    })
    .join("");

  container.innerHTML = `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="panel-kicker">Portfolio</p>
          <h2>${escapeHtml(name)} 구성종목</h2>
        </div>
        <p class="panel-meta">${escapeHtml(dateStr)} 기준 &nbsp;·&nbsp; 총 ${holdings.length}개 종목</p>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    </section>`;
}

initPeerTab();

// PEER 분석 탭이 이미 활성화된 상태로 페이지가 로드된 경우 자동 로드
if (document.getElementById("tab-peer")?.classList.contains("is-active")) {
  loadPeerPortfolio(peerState.currentKey);
}

/* ── 1Q 단기금융채 YTD 격차 ──
   1Q 단기금융채와 그날 선두 ETF의 YTD 수익률 차이를 추적한다.
   1Q가 선두인 날은 2위를 상대로 삼으므로, 격차 부호가 그대로 우위/열위를 뜻한다.
   순위는 매일 바뀌기 때문에 비교 대상을 날짜마다 새로 고른다. */
const GAP_GROUP_KEY = "SHORT_TERM";
const GAP_FOCUS_NAME = "1Q 단기금융채액티브";
// 그날의 선두를 상대로 삼는 기본 모드. 나머지 값은 고정 비교 ETF명이다.
const GAP_LEADER_MODE = "LEADER";
// 세로축이 최소한 이만큼(bp)은 담게 해서 눈금이 전부 같은 숫자로 찍히지 않게 한다
const GAP_MIN_AXIS_SPAN_BP = 2;
const GAP_CHART = {
  width: 760,
  height: 300,
  paddingLeft: 62,
  paddingRight: 26,
  paddingTop: 20,
  paddingBottom: 34
};

const gapEls = {
  meta: document.querySelector("#gapChartMeta"),
  summary: document.querySelector("#gapSummary"),
  wrap: document.querySelector("#gapChartWrap"),
  svg: document.querySelector("#gapChart"),
  tooltip: document.querySelector("#gapTooltip"),
  empty: document.querySelector("#gapEmpty"),
  toggle: document.querySelector("#gapToggle"),
  adjustToggle: document.querySelector("#gapAdjustToggle"),
  note: document.querySelector("#gapNote"),
  exDates: document.querySelector("#gapExDates")
};

const gapChartState = { points: [], geometry: null, mode: GAP_LEADER_MODE };


function buildGapSeries() {
  const groupMeta = ETF_GROUPS[GAP_GROUP_KEY];
  const universe = groupMeta.etfNames
    .map((name) => state.etfs.find((etf) => etf.name === name))
    .filter(Boolean);
  const focus = universe.find((etf) => etf.name === GAP_FOCUS_NAME);
  if (!focus || !state.baseDate) {
    return [];
  }

  // YTD 기준값은 기준연도 첫 영업일의 직전 거래일, 즉 전년도 마지막 영업일이다
  const startNav = new Map();
  universe.forEach((etf) => {
    const reference = getYearReference(etf.series, state.baseDate);
    const nav = reference?.navTr ?? reference?.nav;
    if (nav) {
      startNav.set(etf.code, nav);
    }
  });
  if (!startNav.has(focus.code)) {
    return [];
  }

  const navLookup = new Map(
    universe.map((etf) => [
      etf.code,
      new Map(etf.series.map((point) => [point.date, point.navTr ?? point.nav]))
    ])
  );
  const year = state.baseDate.slice(0, 4);

  return focus.series
    .filter((point) => point.date.startsWith(year) && point.date <= state.baseDate)
    .map((point) => {
      const ranked = universe
        .map((etf) => {
          const nav = navLookup.get(etf.code).get(point.date);
          const start = startNav.get(etf.code);
          if (!Number.isFinite(nav) || !Number.isFinite(start) || !start) {
            return null;
          }
          return { code: etf.code, name: etf.name, ytd: nav / start - 1 };
        })
        .filter(Boolean)
        .sort((a, b) => b.ytd - a.ytd);

      const focusRow = ranked.find((row) => row.code === focus.code);
      if (!focusRow) {
        return null;
      }

      // 선두 모드에서는 1Q가 1위인 날만 2위를 상대로 삼는다
      const rival =
        gapChartState.mode === GAP_LEADER_MODE
          ? ranked[ranked[0].code === focus.code ? 1 : 0]
          : ranked.find((row) => row.name === gapChartState.mode);
      if (!rival || rival.code === focus.code) {
        return null;
      }

      return {
        date: point.date,
        focusYtd: focusRow.ytd,
        rivalName: rival.name,
        rivalYtd: rival.ytd,
        gap: focusRow.ytd - rival.ytd,
        rank: ranked.indexOf(focusRow) + 1,
        total: ranked.length
      };
    })
    .filter(Boolean);
}

function renderGapChart() {
  if (!gapEls.svg) {
    return;
  }

  const points = buildGapSeries();
  gapChartState.points = points;
  hideGapTooltip();

  // 빈 상태에서도 svg 요소는 남겨둬야 데이터가 들어온 뒤 다시 그릴 수 있다
  if (points.length < 2) {
    gapChartState.geometry = null;
    gapEls.meta.textContent = "";
    gapEls.note.textContent = "";
    gapEls.exDates.textContent = "";
    gapEls.summary.innerHTML = "";
    gapEls.svg.innerHTML = "";
    gapEls.svg.hidden = true;
    gapEls.empty.hidden = false;
    return;
  }

  gapEls.svg.hidden = false;
  gapEls.empty.hidden = true;

  const first = points[0];
  const last = points[points.length - 1];
  const isLeaderMode = gapChartState.mode === GAP_LEADER_MODE;
  gapEls.meta.textContent = isLeaderMode
    ? `${first.date} ~ ${last.date} · 단기형 ${last.total}종 기준`
    : `${first.date} ~ ${last.date} · ${last.rivalName} 대비`;
  gapEls.note.textContent = isLeaderMode
    ? "선두 ETF 대비 격차입니다. 1Q가 1위인 날은 2위와 비교합니다. 순위는 매일 바뀌므로 비교 대상도 날마다 달라집니다."
    : `${last.rivalName} 대비 격차입니다. 양수면 1Q가 앞선 폭입니다.`;
  renderGapExDates();
  renderGapSummary(last);

  const { width, height, paddingLeft, paddingRight, paddingTop, paddingBottom } = GAP_CHART;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 0을 항상 포함해야 우위/열위 전환이 보인다
  const values = points.map((point) => point.gap * 10000);
  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);
  const headroom = (max - min) * 0.12 || 1;
  min -= headroom;
  max += headroom;
  // 격차가 거의 없는 구간에서 소수점 잡음이 화면 전체로 확대되지 않게 한다
  if (max - min < GAP_MIN_AXIS_SPAN_BP) {
    const middle = (max + min) / 2;
    min = middle - GAP_MIN_AXIS_SPAN_BP / 2;
    max = middle + GAP_MIN_AXIS_SPAN_BP / 2;
  }
  const span = max - min;

  const toX = (index) => paddingLeft + (chartWidth * index) / (points.length - 1);
  const toY = (value) => height - paddingBottom - ((value - min) / span) * chartHeight;
  const zeroY = toY(0);

  gapChartState.geometry = { toX, toY, chartWidth, chartHeight };

  const linePoints = values.map((value, index) => `${toX(index).toFixed(2)},${toY(value).toFixed(2)}`);
  const areaPoints = [
    `${toX(0).toFixed(2)},${zeroY.toFixed(2)}`,
    ...linePoints,
    `${toX(points.length - 1).toFixed(2)},${zeroY.toFixed(2)}`
  ].join(" ");
  const polyline = linePoints.join(" ");

  const lastValue = values[values.length - 1];
  const lastX = toX(points.length - 1);
  const lastY = toY(lastValue);
  const lastClass = lastValue >= 0 ? "gap-line-up" : "gap-line-down";
  const labelAnchor = lastX > width - paddingRight - 60 ? "end" : "start";
  const labelX = labelAnchor === "end" ? lastX - 10 : lastX + 10;

  gapEls.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  gapEls.svg.innerHTML = `
    <defs>
      <clipPath id="gapClipAbove">
        <rect x="0" y="0" width="${width}" height="${zeroY.toFixed(2)}"></rect>
      </clipPath>
      <clipPath id="gapClipBelow">
        <rect x="0" y="${zeroY.toFixed(2)}" width="${width}" height="${(height - zeroY).toFixed(2)}"></rect>
      </clipPath>
    </defs>
    ${buildGapGrid(min, max, span)}
    <polygon class="gap-area-up" clip-path="url(#gapClipAbove)" points="${areaPoints}"></polygon>
    <polygon class="gap-area-down" clip-path="url(#gapClipBelow)" points="${areaPoints}"></polygon>
    <line class="gap-zero" x1="${paddingLeft}" y1="${zeroY.toFixed(2)}" x2="${width - paddingRight}" y2="${zeroY.toFixed(2)}"></line>
    <polyline class="gap-line-up" clip-path="url(#gapClipAbove)" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${polyline}"></polyline>
    <polyline class="gap-line-down" clip-path="url(#gapClipBelow)" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${polyline}"></polyline>
    ${buildGapXAxis(points, toX)}
    <circle class="gap-end-dot ${lastClass}" cx="${lastX.toFixed(2)}" cy="${lastY.toFixed(2)}" r="4.5" fill="currentColor"></circle>
    <text class="gap-end-label ${lastClass}" x="${labelX.toFixed(2)}" y="${(lastY - 12).toFixed(2)}" text-anchor="${labelAnchor}" fill="currentColor">${formatGapBp(last.gap)}</text>
    <g id="gapHoverLayer" style="display: none">
      <line class="gap-crosshair" y1="${paddingTop}" y2="${height - paddingBottom}"></line>
      <circle class="gap-hover-dot" r="5"></circle>
    </g>
    <rect x="${paddingLeft}" y="${paddingTop}" width="${chartWidth}" height="${chartHeight}" fill="transparent"></rect>
  `;
}

function buildGapGrid(min, max, span) {
  const { width, height, paddingLeft, paddingRight, paddingTop, paddingBottom } = GAP_CHART;
  const chartHeight = height - paddingTop - paddingBottom;
  let output = "";
  for (let i = 0; i <= 4; i += 1) {
    const ratio = i / 4;
    const y = height - paddingBottom - ratio * chartHeight;
    const value = min + ratio * span;
    output += `<line class="gap-grid" x1="${paddingLeft}" y1="${y.toFixed(2)}" x2="${width - paddingRight}" y2="${y.toFixed(2)}"></line>`;
    output += `<text class="gap-axis-text" x="${paddingLeft - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end">${value.toFixed(span < 5 ? 2 : 1)}</text>`;
  }
  output += `<text class="gap-axis-text" x="${paddingLeft - 10}" y="${paddingTop - 6}" text-anchor="end">bp</text>`;
  return output;
}

function buildGapXAxis(points, toX) {
  const { height, paddingBottom } = GAP_CHART;
  const tickCount = Math.min(6, points.length);
  const y = height - paddingBottom + 20;
  let output = "";
  for (let i = 0; i < tickCount; i += 1) {
    const index = Math.round((i * (points.length - 1)) / Math.max(tickCount - 1, 1));
    const anchor = i === 0 ? "start" : i === tickCount - 1 ? "end" : "middle";
    output += `<text class="gap-axis-text" x="${toX(index).toFixed(2)}" y="${y}" text-anchor="${anchor}">${points[index].date.slice(5)}</text>`;
  }
  return output;
}

function renderGapExDates() {
  gapEls.exDates.textContent = describeExDates();
  gapEls.exDates.title = exDateDetail();
}

function renderGapSummary(point) {
  const gapClass = point.gap >= 0 ? "gap-positive" : "gap-negative";
  gapEls.summary.innerHTML = `
    <div class="detail-card">
      <span class="detail-label">1Q 단기금융채 YTD</span>
      <span class="detail-value">${toPercent(point.focusYtd)}</span>
    </div>
    <div class="detail-card">
      <span class="detail-label">비교 대상 YTD</span>
      <span class="detail-value">${toPercent(point.rivalYtd)}</span>
      <p class="detail-meta">${escapeHtml(point.rivalName)}</p>
    </div>
    <div class="detail-card">
      <span class="detail-label">격차</span>
      <span class="detail-value ${gapClass}">${formatGapBp(point.gap)}</span>
      <p class="detail-meta">${formatGapPercentPoint(point.gap)}</p>
    </div>
    <div class="detail-card">
      <span class="detail-label">단기형 순위</span>
      <span class="detail-value">${point.rank}위 / ${point.total}종</span>
      <p class="detail-meta">${point.date} 기준</p>
    </div>
  `;
}

// 반올림해서 0이 되는 값에 부호를 붙이면 -0.0bp 같은 표기가 나온다
function signedFixed(value, digits, suffix) {
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${Math.abs(rounded).toFixed(digits)}${suffix}`;
}

function formatGapBp(value) {
  return signedFixed(value * 10000, 1, "bp");
}

function formatGapPercentPoint(value) {
  return signedFixed(value * 100, 3, "%p");
}

// 비교 대상 목록은 단기형 그룹 정의에서 그대로 끌어온다
function gapCompareOptions() {
  return [
    { value: GAP_LEADER_MODE, label: "최상위권" },
    ...ETF_GROUPS[GAP_GROUP_KEY].etfNames
      .filter((name) => name !== GAP_FOCUS_NAME)
      .map((name) => ({ value: name, label: NAV_TABLE_LABELS[name] || name }))
  ];
}

function renderGapToggle() {
  if (!gapEls.toggle) {
    return;
  }
  gapEls.toggle.innerHTML = gapCompareOptions()
    .map(
      (option) => `
        <button
          type="button"
          class="toggle-button${option.value === gapChartState.mode ? " is-active" : ""}"
          data-gap-mode="${escapeHtml(option.value)}"
        >${escapeHtml(option.label)}</button>
      `
    )
    .join("");
}

function bindGapChartEvents() {
  if (!gapEls.svg) {
    return;
  }

  gapEls.toggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gap-mode]");
    if (!button || button.dataset.gapMode === gapChartState.mode) {
      return;
    }
    gapChartState.mode = button.dataset.gapMode;
    renderGapToggle();
    renderGapChart();
  });

  gapEls.svg.addEventListener("pointermove", handleGapPointerMove);
  gapEls.svg.addEventListener("pointerleave", hideGapTooltip);
  gapEls.svg.addEventListener("pointercancel", hideGapTooltip);
}

function handleGapPointerMove(event) {
  const { points, geometry } = gapChartState;
  if (!geometry || points.length < 2) {
    return;
  }

  const rect = gapEls.svg.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const { width, paddingLeft, paddingTop, height, paddingBottom } = GAP_CHART;
  const viewX = ((event.clientX - rect.left) / rect.width) * width;
  const ratio = (viewX - paddingLeft) / geometry.chartWidth;
  const index = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
  const point = points[index];

  const x = geometry.toX(index);
  const y = geometry.toY(point.gap * 10000);
  const layer = gapEls.svg.querySelector("#gapHoverLayer");
  const line = layer.querySelector("line");
  const dot = layer.querySelector("circle");
  layer.style.display = "";
  line.setAttribute("x1", x.toFixed(2));
  line.setAttribute("x2", x.toFixed(2));
  line.setAttribute("y1", paddingTop);
  line.setAttribute("y2", height - paddingBottom);
  dot.setAttribute("cx", x.toFixed(2));
  dot.setAttribute("cy", y.toFixed(2));
  dot.setAttribute("fill", point.gap >= 0 ? "var(--positive)" : "var(--negative)");

  showGapTooltip(point, (x / width) * rect.width, (y / GAP_CHART.height) * rect.height);
}

function showGapTooltip(point, pixelX, pixelY) {
  const tooltip = gapEls.tooltip;
  tooltip.replaceChildren(
    gapTooltipDate(point.date),
    // 색은 대상을 따라가야 하므로 우열이 바뀌어도 키 색을 바꾸지 않는다
    gapTooltipRow(GAP_FOCUS_NAME, toPercent(point.focusYtd), "var(--brand)"),
    gapTooltipRow(point.rivalName, toPercent(point.rivalYtd), "var(--muted)"),
    gapTooltipGap(point),
    gapTooltipRank(point)
  );
  tooltip.hidden = false;

  // 좌우 끝에서 잘리지 않도록 가로 위치를 감싼 영역 안으로 되돌린다
  const wrapWidth = gapEls.wrap.clientWidth;
  const half = tooltip.offsetWidth / 2;
  const clampedX = Math.min(Math.max(pixelX, half + 4), wrapWidth - half - 4);
  tooltip.style.left = `${clampedX}px`;
  tooltip.style.top = `${Math.max(pixelY - 14, tooltip.offsetHeight + 4)}px`;
}

function gapTooltipDate(date) {
  const node = document.createElement("div");
  node.className = "gap-tooltip-date";
  node.textContent = date;
  return node;
}

// ETF명은 외부 데이터라 textContent로만 넣는다
function gapTooltipRow(name, value, keyColor) {
  const row = document.createElement("div");
  row.className = "gap-tooltip-row";

  const label = document.createElement("span");
  label.className = "gap-tooltip-name";
  const key = document.createElement("span");
  key.className = "gap-tooltip-key";
  key.style.background = keyColor;
  label.append(key, document.createTextNode(name));

  const amount = document.createElement("span");
  amount.className = "gap-tooltip-value";
  amount.textContent = value;

  row.append(label, amount);
  return row;
}

function gapTooltipGap(point) {
  const row = document.createElement("div");
  row.className = "gap-tooltip-row gap-tooltip-divider";

  const label = document.createElement("span");
  label.className = "gap-tooltip-name";
  label.textContent = "격차";

  const amount = document.createElement("span");
  amount.className = `gap-tooltip-value ${point.gap >= 0 ? "gap-positive" : "gap-negative"}`;
  amount.textContent = `${formatGapBp(point.gap)} (${formatGapPercentPoint(point.gap)})`;

  row.append(label, amount);
  return row;
}

function gapTooltipRank(point) {
  const node = document.createElement("div");
  node.className = "gap-tooltip-rank";
  node.textContent = `단기형 ${point.total}종 중 ${point.rank}위`;
  return node;
}

function hideGapTooltip() {
  if (!gapEls.tooltip) {
    return;
  }
  gapEls.tooltip.hidden = true;
  const layer = gapEls.svg?.querySelector("#gapHoverLayer");
  if (layer) {
    layer.style.display = "none";
  }
}

renderGapToggle();
bindGapChartEvents();
