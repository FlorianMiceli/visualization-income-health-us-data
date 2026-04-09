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

/**
 * Full Pearson matrix (same minN as {@link pearsonPair}).
 * @param {{ key: string, label: string }[]} variables
 * @param {object[]} rows
 * @returns {number[][]}
 */
export function pearsonMatrix(variables, rows, minN = 30) {
  const n = variables.length;
  const getters = variables.map((v) => (r) => r[v.key]);
  const M = Array.from({ length: n }, () => Array(n).fill(NaN));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const r = pearsonPair(rows, getters[i], getters[j], minN);
      M[i][j] = Number.isFinite(r) ? r : NaN;
    }
  }
  return M;
}

/** Average dissimilarity between two disjoint index sets using precomputed D. */
function clusterDistMatrix(A, B, D) {
  let s = 0;
  let c = 0;
  for (const i of A) {
    for (const j of B) {
      s += D[i][j];
      c++;
    }
  }
  return c ? s / c : 0;
}

function leafOrderFromTree(node) {
  if (node.leaf) return [node.index];
  return [...leafOrderFromTree(node.left), ...leafOrderFromTree(node.right)];
}

/**
 * Reorder variables so that strong |correlation| runs along the diagonal (blocks),
 * with the first cluster in the dendrogram at the top-left of the heatmap.
 * Uses average linkage on distance 1 − |r| (NaN treated as 1).
 *
 * @param {{ key: string, label: string }[]} variables
 * @param {object[]} rows
 * @returns {{ key: string, label: string }[]}
 */
export function orderVariablesByCorrelationClustering(variables, rows, minN = 30) {
  const n = variables.length;
  if (n <= 1) return [...variables];

  const M = pearsonMatrix(variables, rows, minN);
  const D = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      const r = M[i][j];
      return Number.isFinite(r) ? 1 - Math.abs(r) : 1;
    })
  );

  /** @type {{ leaf: boolean, index?: number, left?: object, right?: object, members: number[] }[]} */
  let nodes = variables.map((_, i) => ({
    leaf: true,
    index: i,
    members: [i]
  }));

  while (nodes.length > 1) {
    let bi = 0;
    let bj = 1;
    let best = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = clusterDistMatrix(nodes[i].members, nodes[j].members, D);
        if (d < best - 1e-15 || (Math.abs(d - best) <= 1e-15 && (i < bi || (i === bi && j < bj)))) {
          best = d;
          bi = i;
          bj = j;
        }
      }
    }
    const a = nodes[bi];
    const b = nodes[bj];
    const minA = Math.min(...a.members);
    const minB = Math.min(...b.members);
    const left = minA <= minB ? a : b;
    const right = left === a ? b : a;
    const merged = {
      leaf: false,
      left,
      right,
      members: [...left.members, ...right.members]
    };
    nodes = nodes.filter((_, k) => k !== bi && k !== bj);
    nodes.push(merged);
  }

  const order = leafOrderFromTree(nodes[0]);
  return order.map((i) => variables[i]);
}
