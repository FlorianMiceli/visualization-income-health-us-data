import {dsvFormat} from "npm:d3-dsv";

const semi = dsvFormat(";");

/** @param {string} text */
export function parseSemicolonCsv(text) {
  // Fichiers INCA3 en UTF-8 avec BOM : sans ça, la 1re colonne devient "\uFEFFPOPULATION" et les jointures Pop2/Pop3 échouent.
  const t = text.replace(/^\uFEFF/, "");
  return semi.parse(t);
}

/** @param {string|number|undefined} v */
export function toNum(v) {
  if (v === undefined || v === null || v === "") return NaN;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Individual weight for Pop2 (AA): adult vs child from `ech`.
 * @param {Record<string, string>} row description-indiv row
 */
export function weightPop2(row) {
  const ech = String(row.ech ?? "");
  const w =
    ech === "2"
      ? toNum(row.pond_indiv_enf_pop2)
      : toNum(row.pond_indiv_adu_pop2);
  return w > 0 && Number.isFinite(w) ? w : NaN;
}

/**
 * Individual weight for Pop3 (24h recalls).
 * @param {Record<string, string>} row description-indiv row
 */
export function weightPop3(row) {
  const ech = String(row.ech ?? "");
  const w =
    ech === "2"
      ? toNum(row.pond_indiv_enf_pop3)
      : toNum(row.pond_indiv_adu_pop3);
  return w > 0 && Number.isFinite(w) ? w : NaN;
}

/** @param {Record<string, string>} row */
export function isPop2(row) {
  return String(row.pop2 ?? "") === "1";
}

/** @param {Record<string, string>} row */
export function isPop3(row) {
  return String(row.pop3 ?? "") === "1";
}

/** @param {Record<string, string>} row */
export function isChild(row) {
  return String(row.ech ?? "") === "2";
}

/**
 * @param {Record<string, string>[]} descRows
 * @param {Record<string, string>[]} habRows
 */
export function mergeDescHabitudes(descRows, habRows) {
  const habByNoind = new Map();
  for (const h of habRows) {
    const pop = String(h.POPULATION ?? "");
    if (!pop.includes("Pop2")) continue;
    habByNoind.set(String(h.NOIND), h);
  }
  return descRows.map((d) => {
    const noind = String(d.NOIND);
    const h = habByNoind.get(noind);
    return h ? { ...d, ...h, NOIND: d.NOIND } : { ...d };
  });
}

/**
 * @param {Record<string, string>[]} descRows
 * @param {Record<string, string>[]} consoRows
 */
export function mergeDescConso(descRows, consoRows) {
  const cByNoind = new Map();
  for (const c of consoRows) {
    if (String(c.POPULATION ?? "").toLowerCase().includes("pop3")) {
      cByNoind.set(String(c.NOIND), c);
    }
  }
  return descRows.map((d) => {
    const c = cByNoind.get(String(d.NOIND));
    return c ? { ...d, ...c, NOIND: d.NOIND } : { ...d };
  });
}

/**
 * @param {Record<string, string>[]} descRows
 * @param {Record<string, string>[]} apportsRows
 */
export function mergeDescApports(descRows, apportsRows) {
  const aByNoind = new Map();
  for (const a of apportsRows) {
    if (String(a.POPULATION ?? "").toLowerCase().includes("pop3")) {
      aByNoind.set(String(a.NOIND), a);
    }
  }
  return descRows.map((d) => {
    const a = aByNoind.get(String(d.NOIND));
    return a ? { ...d, ...a, NOIND: d.NOIND } : { ...d };
  });
}

/** Merge 24h group consumptions + nutrient intakes onto description rows (Pop3). */
export function mergePop3Data(descRows, consoRows, apportsRows) {
  return mergeDescApports(mergeDescConso(descRows, consoRows), apportsRows);
}

/**
 * Weighted distribution of `valueKey` within each `stratumKey` class.
 * @param {Record<string, unknown>[]} rows
 * @param {string} stratumKey
 * @param {string} valueKey
 * @param {(row: Record<string, unknown>) => number} weightFn
 * @param {number[]} stratumOrder
 * @param {(v: unknown) => string|number|null} valueParse
 * @param {string[]|null} allValueKeys if set, include every key (missing → 0 share)
 */
export function weightedStratumDistribution(
  rows,
  stratumKey,
  valueKey,
  weightFn,
  stratumOrder,
  valueParse = (v) => (v === "" || v == null ? null : v),
  allValueKeys = null
) {
  /** @type {Map<string, Map<string, number>>} */
  const acc = new Map();
  for (const s of stratumOrder) {
    acc.set(String(s), new Map());
  }
  for (const row of rows) {
    const w = weightFn(row);
    if (!Number.isFinite(w) || w <= 0) continue;
    const rawS = row[stratumKey];
    const s = toNum(rawS);
    if (!stratumOrder.includes(s)) continue;
    const parsed = valueParse(row[valueKey]);
    if (parsed === null || parsed === undefined) continue;
    const vk = String(parsed);
    const m = acc.get(String(s));
    m.set(vk, (m.get(vk) ?? 0) + w);
  }
  return stratumOrder.map((s) => {
    const m = acc.get(String(s));
    let total = 0;
    for (const v of m.values()) total += v;
    const keys = allValueKeys ?? [...m.keys()].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
    return {
      stratum: s,
      totalWeight: total,
      levels: keys.map((k) => ({
        key: k,
        weight: m.get(k) ?? 0,
        p: total > 0 ? (m.get(k) ?? 0) / total : 0
      }))
    };
  });
}

/**
 * @param {Record<string, unknown>[]} rows merged pop2 + weight as `_w`
 * @param {"RUC_4cl"|"PCS_4cl_PR"} stratumKey
 */
export function behaviorHighFreqByStratum(rows, stratumKey) {
  const stratumOrder =
    stratumKey === "RUC_4cl" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5];

  function pHigh(subset, predicate) {
    let wYes = 0;
    let wAll = 0;
    for (const row of subset) {
      const w = row._w;
      if (!Number.isFinite(w) || w <= 0) continue;
      wAll += w;
      if (predicate(row)) wYes += w;
    }
    return wAll > 0 ? wYes / wAll : null;
  }

  return stratumOrder.map((s) => {
    const subset = rows.filter((r) => toNum(r[stratumKey]) === s);
    const all = subset.filter((r) => Number.isFinite(r._w) && r._w > 0);
    const children = subset.filter((r) => isChild(r) && Number.isFinite(r._w) && r._w > 0);

    const fastFoodValid = all.filter((r) => Number.isFinite(toNum(r.restaurationrapide_freq)));
    const cantineValid = children.filter((r) => Number.isFinite(toNum(r.cantine_freq)));
    const organicValid = all.filter((r) => {
      const b = String(r.consommation_bio ?? "");
      return b === "0" || b === "1";
    });

    const fastFoodFreq = (r) => {
      const f = toNum(r.restaurationrapide_freq);
      return Number.isFinite(f) && f >= 6;
    };
    const cantineFreq = (r) => {
      const f = toNum(r.cantine_freq);
      return Number.isFinite(f) && f >= 6;
    };
    const organic = (r) => String(r.consommation_bio ?? "") === "1";

    return {
      stratum: s,
      fastFoodFrequent: pHigh(fastFoodValid, fastFoodFreq),
      organicAny: pHigh(organicValid, organic),
      cantineFrequentChildren: pHigh(cantineValid, cantineFreq),
      nWeightAll: sumWeights(all),
      nWeightChildren: sumWeights(children)
    };
  });
}

function sumWeights(rows) {
  let t = 0;
  for (const r of rows) {
    const w = r._w;
    if (Number.isFinite(w) && w > 0) t += w;
  }
  return t;
}

/**
 * Weighted means of numeric columns by stratum.
 * @param {Record<string, unknown>[]} rows with `_w`
 * @param {string} stratumKey
 * @param {number[]} stratumOrder
 * @param {string[]} valueKeys
 */
export function weightedMeansByStratum(rows, stratumKey, stratumOrder, valueKeys) {
  return stratumOrder.map((s) => {
    const subset = rows.filter((r) => toNum(r[stratumKey]) === s);
    const out = { stratum: s, totalWeight: 0, means: /** @type {Record<string, number|null>} */ ({}) };
    let wSum = 0;
    for (const r of subset) {
      const w = r._w;
      if (!Number.isFinite(w) || w <= 0) continue;
      wSum += w;
    }
    out.totalWeight = wSum;
    for (const key of valueKeys) {
      let num = 0;
      let den = 0;
      for (const r of subset) {
        const w = r._w;
        if (!Number.isFinite(w) || w <= 0) continue;
        const x = toNum(r[key]);
        if (!Number.isFinite(x)) continue;
        num += w * x;
        den += w;
      }
      out.means[key] = den > 0 ? num / den : null;
    }
    return out;
  });
}

/** National weighted mean for baseline (heatmap center). */
export function nationalWeightedMean(rows, key, weightFn) {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const w = weightFn(r);
    if (!Number.isFinite(w) || w <= 0) continue;
    const x = toNum(r[key]);
    if (!Number.isFinite(x)) continue;
    num += w * x;
    den += w;
  }
  return den > 0 ? num / den : null;
}

export const GPE_HEATMAP_KEYS = [
  { key: "conso_gpe21", label: "Vegetables" },
  { key: "conso_gpe24", label: "Fresh & dried fruit" },
  { key: "conso_gpe17", label: "Charcuterie" },
  { key: "conso_gpe40", label: "Sandwiches, pizza, salty bakery" },
  { key: "conso_gpe31", label: "Sweet drinks (BRSA)" },
  { key: "conso_gpe6", label: "Pastries, biscuits, cakes" }
];

export const NUTRIENT_KEYS = [
  { key: "nutriment8", label: "Fiber (g/d)" },
  { key: "nutriment31", label: "Salt (g/d)" }
];

/**
 * Cinq grandes familles (hors eaux et boissons `conso_gpe29`…`34`) : regroupe les 38 autres groupes INCA3.
 */
export const GPE_MACRO_GROUPS = [
  {
    id: "plant_fruit_leg",
    label: "Fruits, légumes, pommes de terre & noix",
    keys: [
      "conso_gpe21",
      "conso_gpe22",
      "conso_gpe23",
      "conso_gpe24",
      "conso_gpe25",
      "conso_gpe26"
    ]
  },
  {
    id: "cereals_sweet",
    label: "Pain, céréales & produits sucrés",
    keys: ["conso_gpe1", "conso_gpe2", "conso_gpe3", "conso_gpe4", "conso_gpe5", "conso_gpe6", "conso_gpe27", "conso_gpe28"]
  },
  {
    id: "dairy",
    label: "Laits, yaourts, fromages, desserts lactés, glaces",
    keys: ["conso_gpe7", "conso_gpe8", "conso_gpe9", "conso_gpe10", "conso_gpe11"]
  },
  {
    id: "animal_protein",
    label: "Viandes, poissons & œufs",
    keys: [
      "conso_gpe14",
      "conso_gpe15",
      "conso_gpe16",
      "conso_gpe17",
      "conso_gpe18",
      "conso_gpe19",
      "conso_gpe20"
    ]
  },
  {
    id: "prepared_other",
    label: "Plats composés, lipides, condiments & autres",
    keys: [
      "conso_gpe12",
      "conso_gpe13",
      "conso_gpe35",
      "conso_gpe36",
      "conso_gpe37",
      "conso_gpe38",
      "conso_gpe39",
      "conso_gpe40",
      "conso_gpe41",
      "conso_gpe42",
      "conso_gpe43",
      "conso_gpe44"
    ]
  }
];

/**
 * Parts relatives (somme = 1 par strate) : Σ(w × g/j dans le groupe) / Σ(w × total g/j)
 * sur l’ensemble des macro-groupes (équivalent au mélange des apports au sein de la strate).
 * @param {Record<string, unknown>[]} rows lignes Pop3 fusionnées avec `_w`
 * @param {string} stratumKey ex. `RUC_4cl` ou `PCS_4cl_PR`
 * @param {number[]} stratumOrder ex. [1,2,3,4]
 */
export function weightedGpeMacroCompositionByStratum(rows, stratumKey, stratumOrder) {
  const macroIds = GPE_MACRO_GROUPS.map((g) => g.id);
  /** @type {Map<string, Map<string, number>>} */
  const acc = new Map();
  for (const s of stratumOrder) acc.set(String(s), new Map(macroIds.map((id) => [id, 0])));

  for (const row of rows) {
    const w = row._w;
    if (!Number.isFinite(w) || w <= 0) continue;
    const s = toNum(row[stratumKey]);
    if (!stratumOrder.includes(s)) continue;

    let rowTotal = 0;
    /** @type {Record<string, number>} */
    const grams = {};
    for (const g of GPE_MACRO_GROUPS) {
      let sub = 0;
      for (const k of g.keys) {
        const x = toNum(row[k]);
        if (Number.isFinite(x) && x >= 0) sub += x;
      }
      grams[g.id] = sub;
      rowTotal += sub;
    }
    if (rowTotal <= 0) continue;

    const m = acc.get(String(s));
    for (const id of macroIds) {
      m.set(id, (m.get(id) ?? 0) + w * grams[id]);
    }
  }

  return stratumOrder.map((s) => {
    const m = acc.get(String(s));
    let total = 0;
    for (const v of m.values()) total += v;
    const keys = macroIds;
    return {
      stratum: s,
      totalWeight: total,
      levels: keys.map((k) => ({
        key: k,
        weight: m.get(k) ?? 0,
        p: total > 0 ? (m.get(k) ?? 0) / total : 0
      }))
    };
  });
}

/**
 * Indice composite Pop3 : apports 24 h (≈72 % du poids) + facteurs hors alimentation (≈28 %).
 * Chaque terme : w_k × s_k × z_k (z national, plafonné ±3). Σ w_k = 1. Plus le brut est élevé, plus le profil est favorable.
 * Les variables « contexte » sont issues du questionnaire individuel (pas des R24) ; tabac vérifié vs consommation déclarée.
 */
export const HEALTH_SCORE_SPEC = [
  { id: "conso_gpe21", group: "diet", source: "column", column: "conso_gpe21", weight: 0.1224, direction: 1, label: "Légumes (g/j)", role: "protective" },
  { id: "conso_gpe24", group: "diet", source: "column", column: "conso_gpe24", weight: 0.108, direction: 1, label: "Fruits frais & secs (g/j)", role: "protective" },
  { id: "nutriment8", group: "diet", source: "column", column: "nutriment8", weight: 0.1296, direction: 1, label: "Fibres (g/j)", role: "protective" },
  { id: "conso_gpe17", group: "diet", source: "column", column: "conso_gpe17", weight: 0.0792, direction: -1, label: "Charcuterie (g/j)", role: "risk" },
  { id: "conso_gpe40", group: "diet", source: "column", column: "conso_gpe40", weight: 0.0792, direction: -1, label: "Sandwichs, pizza, boul. salée (g/j)", role: "risk" },
  { id: "conso_gpe31", group: "diet", source: "column", column: "conso_gpe31", weight: 0.0864, direction: -1, label: "Boissons sucrées BRSA (g/j)", role: "risk" },
  { id: "conso_gpe6", group: "diet", source: "column", column: "conso_gpe6", weight: 0.0792, direction: -1, label: "Viennoiseries, biscuits, gâteaux (g/j)", role: "risk" },
  { id: "nutriment31", group: "diet", source: "column", column: "nutriment31", weight: 0.036, direction: -1, label: "Sel (g/j)", role: "risk" },
  { id: "ctx_tabac", group: "context", source: "derived", weight: 0.09, direction: 1, label: "Tabac (usage déclaré)", role: "context" },
  { id: "ctx_imc", group: "context", source: "derived", weight: 0.09, direction: 1, label: "IMC adultes (−|IMC−22,5|)", role: "context" },
  { id: "ctx_ia", group: "context", source: "derived", weight: 0.05, direction: 1, label: "Sécurité alimentaire (IA_statut)", role: "context" },
  { id: "ctx_soins", group: "context", source: "derived", weight: 0.025, direction: 1, label: "Accès aux soins (non-renoncement)", role: "context" },
  { id: "ctx_fin", group: "context", source: "derived", weight: 0.025, direction: 1, label: "Situation financière perçue", role: "context" }
];

/** Même pondérations que HEALTH_SCORE_SPEC, format attendu par le graphique « composition ». */
export const HEALTH_SCORE_COMPONENTS = HEALTH_SCORE_SPEC.map((s) => ({
  key: s.column ?? s.id,
  weight: s.weight,
  direction: s.direction,
  label: s.label,
  role: s.role
}));

/**
 * Tabac : 4 = sans tabac (meilleur score), 2 = occasionnel, 1 & 3 = fumeurs actifs (cf. nb cigarettes/j).
 * @param {Record<string, unknown>} row
 */
export function healthTabacOrdinal(row) {
  const f = String(row.fume ?? "");
  if (f === "4") return 2;
  if (f === "2") return 1;
  if (f === "1" || f === "3") return 0;
  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} id
 */
export function healthDerivedContextValue(row, id) {
  switch (id) {
    case "ctx_tabac":
      return healthTabacOrdinal(row);
    case "ctx_imc": {
      if (String(row.ech ?? "") !== "1") return null;
      const imc = toNum(row.imc);
      return Number.isFinite(imc) ? -Math.abs(imc - 22.5) : null;
    }
    case "ctx_ia": {
      const ia = toNum(row.IA_statut);
      return [0, 1, 2].includes(ia) ? 2 - ia : null;
    }
    case "ctx_soins": {
      const s = String(row.soins ?? "");
      if (s === "2") return 1;
      if (s === "1") return 0;
      return null;
    }
    case "ctx_fin": {
      const f = toNum(row.situ_fin_3cl);
      return Number.isFinite(f) && f >= 1 && f <= 4 ? 5 - f : null;
    }
    default:
      return null;
  }
}

/**
 * @param {Record<string, unknown>} row
 * @param {{ source: string, column?: string, id: string }} item
 */
export function healthComponentNumericValue(row, item) {
  if (item.source === "column" && item.column) return toNum(row[item.column]);
  return healthDerivedContextValue(row, item.id);
}

/**
 * Moyenne et écart-type pondérés sur les lignes où getter renvoie un nombre fini.
 * @param {Record<string, unknown>[]} rows
 * @param {(row: Record<string, unknown>) => number|null} getter
 * @param {(row: Record<string, unknown>) => number} weightFn
 */
export function nationalWeightedMeanStdForGetter(rows, getter, weightFn) {
  let mNum = 0;
  let mDen = 0;
  for (const r of rows) {
    const w = weightFn(r);
    if (!Number.isFinite(w) || w <= 0) continue;
    const x = getter(r);
    if (x == null || !Number.isFinite(x)) continue;
    mNum += w * x;
    mDen += w;
  }
  const mean = mDen > 0 ? mNum / mDen : null;
  if (mean == null) return { mean: null, std: null };
  let vNum = 0;
  let vDen = 0;
  for (const r of rows) {
    const w = weightFn(r);
    if (!Number.isFinite(w) || w <= 0) continue;
    const x = getter(r);
    if (x == null || !Number.isFinite(x)) continue;
    const d = x - mean;
    vNum += w * d * d;
    vDen += w;
  }
  if (vDen <= 0) return { mean, std: null };
  const v = vNum / vDen;
  const std = v > 0 ? Math.sqrt(v) : null;
  return { mean, std };
}

/**
 * Stats nationales pour chaque composante de HEALTH_SCORE_SPEC.
 * @param {Record<string, unknown>[]} rows
 */
export function buildHealthScoreStats(rows, weightFn) {
  /** @type {Record<string, { mean: number|null, std: number|null }>} */
  const out = {};
  for (const item of HEALTH_SCORE_SPEC) {
    const getter = (r) => healthComponentNumericValue(r, item);
    out[item.id] = nationalWeightedMeanStdForGetter(rows, getter, weightFn);
  }
  return out;
}

/**
 * Weighted mean and population-style weighted standard deviation of one column.
 * @param {Record<string, unknown>[]} rows
 * @param {string} key
 * @param {(row: Record<string, unknown>) => number} weightFn
 */
export function nationalWeightedMeanStd(rows, key, weightFn) {
  const mean = nationalWeightedMean(rows, key, weightFn);
  if (mean == null) return { mean: null, std: null };
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const w = weightFn(r);
    if (!Number.isFinite(w) || w <= 0) continue;
    const x = toNum(r[key]);
    if (!Number.isFinite(x)) continue;
    const d = x - mean;
    num += w * d * d;
    den += w;
  }
  if (den <= 0) return { mean, std: null };
  const v = num / den;
  const std = v > 0 ? Math.sqrt(v) : null;
  return { mean, std };
}

const Z_CLIP = 3;

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, { mean: number|null, std: number|null }>} statsById
 * @returns {number|null}
 */
export function healthScoreRawForRow(row, statsById) {
  let sum = 0;
  for (const item of HEALTH_SCORE_SPEC) {
    const x = healthComponentNumericValue(row, item);
    const st = statsById[item.id];
    if (item.group === "diet") {
      if (x == null || !Number.isFinite(x)) return null;
      if (!st || st.mean == null || st.std == null || st.std <= 0) return null;
      let z = (x - st.mean) / st.std;
      if (z < -Z_CLIP) z = -Z_CLIP;
      if (z > Z_CLIP) z = Z_CLIP;
      sum += item.weight * item.direction * z;
    } else {
      if (x == null || !Number.isFinite(x)) continue;
      if (!st || st.mean == null || st.std == null || st.std <= 0) continue;
      let z = (x - st.mean) / st.std;
      if (z < -Z_CLIP) z = -Z_CLIP;
      if (z > Z_CLIP) z = Z_CLIP;
      sum += item.weight * item.direction * z;
    }
  }
  return sum;
}

/**
 * Adds `_healthRaw` and `_healthScore` (0–100, national weighted mean ≈ 50) on Pop3 merged rows.
 * @param {Record<string, unknown>[]} rows must have `_w` and intake columns
 */
export function attachHealthScores(rows) {
  const wf = (r) => /** @type {number} */ (r._w);
  const statsById = buildHealthScoreStats(rows, wf);

  const withRaw = rows.map((r) => {
    const raw = healthScoreRawForRow(r, statsById);
    return { ...r, _healthRaw: raw };
  });

  let mR = 0;
  let wR = 0;
  for (const r of withRaw) {
    const w = wf(r);
    const raw = r._healthRaw;
    if (!Number.isFinite(w) || w <= 0 || raw == null) continue;
    mR += w * raw;
    wR += w;
  }
  const meanRaw = wR > 0 ? mR / wR : 0;
  let vR = 0;
  for (const r of withRaw) {
    const w = wf(r);
    const raw = r._healthRaw;
    if (!Number.isFinite(w) || w <= 0 || raw == null) continue;
    vR += w * (raw - meanRaw) ** 2;
  }
  const stdRaw = wR > 0 && vR > 0 ? Math.sqrt(vR / wR) : 1;

  return withRaw.map((r) => {
    const raw = r._healthRaw;
    if (raw == null) return { ...r, _healthScore: null };
    let score = 50 + (10 * (raw - meanRaw)) / (stdRaw > 1e-9 ? stdRaw : 1);
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return { ...r, _healthScore: score };
  });
}

/**
 * Weighted mean of `_healthScore` and `_healthRaw` by stratum (only rows with finite score).
 * @param {Record<string, unknown>[]} rows
 */
export function healthScoreMeansByStratum(rows, stratumKey, stratumOrder) {
  return stratumOrder.map((s) => {
    const subset = rows.filter((r) => toNum(r[stratumKey]) === s);
    let wSum = 0;
    let wScore = 0;
    let wRaw = 0;
    let nScore = 0;
    for (const r of subset) {
      const w = r._w;
      const sc = r._healthScore;
      const raw = r._healthRaw;
      if (!Number.isFinite(w) || w <= 0) continue;
      if (Number.isFinite(sc)) {
        wSum += w;
        wScore += w * sc;
        if (raw != null && Number.isFinite(raw)) wRaw += w * raw;
        nScore += 1;
      }
    }
    return {
      stratum: s,
      meanHealthScore: wSum > 0 ? wScore / wSum : null,
      meanRaw: wSum > 0 ? wRaw / wSum : null,
      totalWeight: wSum,
      nWithScore: nScore
    };
  });
}

/**
 * Décomposition de l'indice santé par composante et par strate (moyenne pondérée des contributions).
 * Chaque contribution = w_k * s_k * z_k, avec z_k standardisé national et plafonné ±3.
 * @param {Record<string, unknown>[]} rows lignes Pop3 avec _w, _healthRaw et _healthScore
 * @param {string} stratumKey clé de strate (ex: RUC_4cl)
 * @param {number[]} stratumOrder ordre des strates à retourner
 */
export function healthScoreContributionMeansByStratum(rows, stratumKey, stratumOrder) {
  const wf = (r) => /** @type {number} */ (r._w);
  const statsById = buildHealthScoreStats(rows, wf);

  return stratumOrder.map((s) => {
    const subset = rows.filter(
      (r) =>
        toNum(r[stratumKey]) === s &&
        Number.isFinite(r._healthScore) &&
        Number.isFinite(r._healthRaw) &&
        Number.isFinite(r._w) &&
        r._w > 0
    );

    const byId = new Map();
    for (const item of HEALTH_SCORE_SPEC) {
      byId.set(item.id, {
        id: item.id,
        key: item.column ?? item.id,
        label: item.label,
        role: item.role,
        direction: item.direction,
        weight: item.weight,
        num: 0,
        den: 0
      });
    }

    for (const r of subset) {
      const w = wf(r);
      for (const item of HEALTH_SCORE_SPEC) {
        const x = healthComponentNumericValue(r, item);
        const st = statsById[item.id];
        if (x == null || !Number.isFinite(x)) continue;
        if (!st || st.mean == null || st.std == null || st.std <= 0) continue;
        let z = (x - st.mean) / st.std;
        if (z < -Z_CLIP) z = -Z_CLIP;
        if (z > Z_CLIP) z = Z_CLIP;
        const c = item.weight * item.direction * z;
        const acc = byId.get(item.id);
        acc.num += w * c;
        acc.den += w;
      }
    }

    const components = HEALTH_SCORE_SPEC.map((item) => {
      const acc = byId.get(item.id);
      const meanContribution = acc.den > 0 ? acc.num / acc.den : null;
      return {
        id: item.id,
        key: item.column ?? item.id,
        label: item.label,
        role: item.role,
        direction: item.direction,
        weight: item.weight,
        meanContribution
      };
    });

    return {
      stratum: s,
      components
    };
  });
}
