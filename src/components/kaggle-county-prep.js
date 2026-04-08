import { csvParse, autoType } from "d3-dsv";

/** Trim and collapse internal whitespace for geography keys. */
export function normalizeGeography(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/** 5-digit county FIPS from household file columns (state 2 digits + county 3 digits). */
export function fips5FromParts(statefips, countyfips) {
  const s = String(Number(statefips)).padStart(2, "0");
  const c = String(Number(countyfips)).padStart(3, "0");
  return s + c;
}

/**
 * Inner join cancer_reg rows to avg-household-size on normalized geography (exact match).
 * @param {string} cancerCsvText
 * @param {string} householdCsvText
 */
export function parseAndJoinCounty(cancerCsvText, householdCsvText) {
  return parseJoinCountyDetailed(cancerCsvText, householdCsvText).joined;
}

/**
 * Same join as {@link parseAndJoinCounty}, plus rows from cancer_reg with no household match and `fips5` on joined rows.
 * @param {string} cancerCsvText
 * @param {string} householdCsvText
 * @returns {{ joined: object[], unmatchedCancer: { geography: string }[] }}
 */
export function parseJoinCountyDetailed(cancerCsvText, householdCsvText) {
  const cancer = csvParse(cancerCsvText, autoType);
  const house = csvParse(householdCsvText, autoType);
  const byGeo = new Map();
  for (const row of house) {
    const g = normalizeGeography(row.geography);
    if (!g) continue;
    byGeo.set(g, row);
  }
  const joined = [];
  const unmatchedCancer = [];
  for (const row of cancer) {
    const g = normalizeGeography(row.geography);
    const h = byGeo.get(g);
    if (!h) {
      unmatchedCancer.push({ geography: row.geography });
      continue;
    }
    joined.push({
      ...row,
      avghouseholdsize: h.avghouseholdsize,
      statefips: h.statefips,
      countyfips: h.countyfips,
      fips5: fips5FromParts(h.statefips, h.countyfips)
    });
  }
  return { joined, unmatchedCancer };
}

/** Parse lower bound from binnedinc strings like "(61494.5, 125635]" for ordering. */
export function binnedincOrderKey(bin) {
  const m = String(bin ?? "").match(/\(([\d.]+)/);
  return m ? parseFloat(m[1]) : NaN;
}

/** Pearson r on pairwise-complete pairs; returns NaN if too few points. */
export function pearsonPair(rows, getX, getY, minN = 30) {
  const pairs = rows
    .map((r) => [getX(r), getY(r)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pairs.length < minN) return NaN;
  const mx = pairs.reduce((s, [x]) => s + x, 0) / pairs.length;
  const my = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den > 0 ? num / den : NaN;
}

/**
 * @param {{ key: string, label: string }[]} variables
 * @param {object[]} rows
 * @returns {{ xi: string, xj: string, r: number }[]}
 */
export function correlationCells(variables, rows) {
  const cells = [];
  const acc = variables.map((v) => (r) => r[v.key]);
  for (let i = 0; i < variables.length; i++) {
    for (let j = 0; j < variables.length; j++) {
      const r = pearsonPair(rows, acc[i], acc[j], 30);
      cells.push({
        xi: variables[i].label,
        xj: variables[j].label,
        r: Number.isFinite(r) ? r : NaN
      });
    }
  }
  return cells;
}
