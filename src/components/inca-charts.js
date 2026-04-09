import * as d3 from "npm:d3";
import { html } from "htl";
import { Swatches } from "./d3-color-legend.js";

/** Sequential blues for income / RUC quartiles (low → high). */
export const RUC_COLORS = ["#c6dbef", "#6baed6", "#2171b5", "#08306b"];

/** Food insecurity status (IA_statut): secure → severe (distinct hues, colorblind-friendly ordering). */
export const IA_COLORS = {
  0: "#2c7bb6",
  1: "#fdae61",
  2: "#d7191c"
};

export const LABELS = {
  IA_statut: {
    0: "Sécurité alimentaire",
    1: "Insécurité alimentaire (modérée)",
    2: "Insécurité alimentaire (sévère)"
  },
  RUC_4cl: {
    1: "Classe pauvre",
    2: "Classe moyenne modeste",
    3: "Classe moyenne aisée",
    4: "Classe riche"
  },
  /** Libellés indicatifs — codes 1–4 : PCS personne de référence (4 classes, notice INCA3). */
  PCS_4cl_PR: {
    1: "Agriculteurs, artisans, commerçants, chefs d’entreprise",
    2: "Cadres et professions intellectuelles supérieures",
    3: "Professions intermédiaires",
    4: "Employés et ouvriers"
  },
  situ_alim_statut: {
    1: "Suffisance alimentaire : toujours suffisante",
    2: "Parfois insuffisante",
    3: "Souvent insuffisante"
  }
};

/** Short column headers for heatmaps (full labels in tooltips). */
export const HEATMAP_SHORT_LABELS = {
  conso_gpe21: "Légumes",
  conso_gpe24: "Fruits",
  conso_gpe17: "Charcuterie",
  conso_gpe40: "Pizza / sandwich",
  conso_gpe31: "Boissons sucrées",
  conso_gpe6: "Gâteaux / biscuits",
  nutriment8: "Fibres",
  nutriment31: "Sel"
};

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function shortIncomeClassLabel(stratum, labels = LABELS.RUC_4cl) {
  const full = labels?.[Number(stratum)] ?? `Classe ${stratum}`;
  return full.replace(/^Classe\s+/i, "");
}

/** WCAG-style relative luminance for sRGB. */
function pickTextOnRgb(rgb) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = lin(rgb.r);
  const g = lin(rgb.g);
  const b = lin(rgb.b);
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.56 ? "#121212" : "#f6f6f6";
}

function textColorForFill(colorScale, rel) {
  if (rel == null) return "var(--theme-foreground, #111)";
  const hex = colorScale(rel);
  return pickTextOnRgb(d3.rgb(hex));
}

/** Readable label on colored bar (sequential blues). */
function barEndLabelFill(barColorHex) {
  return pickTextOnRgb(d3.rgb(barColorHex));
}

/**
 * Up to two lines for heatmap column titles (avoids clipped diagonal labels).
 * @param {string} text
 * @param {number} cellW
 */
function splitTitleForColumn(text, cellW) {
  const maxChars = Math.max(7, Math.min(16, Math.floor((cellW - 6) / 5.3)));
  const t = String(text);
  if (t.length <= maxChars) return [t];
  const mid = t.lastIndexOf(" ", maxChars);
  const splitAt = mid > maxChars * 0.4 ? mid : maxChars;
  const a = t.slice(0, splitAt).trim();
  let b = t.slice(splitAt).trim();
  if (b.length > maxChars) b = `${b.slice(0, maxChars - 1)}…`;
  return [a, b];
}

/** Wrap long chart footnotes to ~2 lines using preferred break at " · ". */
function splitFootnoteLines(text, maxChars) {
  const s = String(text);
  if (s.length <= maxChars) return [s];
  let breakAt = s.lastIndexOf(" · ", maxChars);
  if (breakAt < maxChars * 0.45) breakAt = s.lastIndexOf(" ", maxChars);
  if (breakAt < 12) breakAt = maxChars;
  const a = s.slice(0, breakAt).trim();
  const b = s.slice(breakAt).replace(/^[·\s]+/, "").trim();
  return b ? [a, b] : [a];
}

/** Thin halo on heatmap numbers for contrast on brown/teal mid-tones. */
function cellTextStroke(fillHex) {
  const rgb = d3.rgb(fillHex);
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
  return L > 0.52 ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.48)";
}

/**
 * @param {HTMLElement} container
 * @param {Array<{stratum: number, totalWeight: number, levels: {key: string, p: number}[]}>} dist
 * @param {{ width: number, stratumLabels?: Record<number|string, string>, valueLabels?: Record<string, string>, colors?: Record<string, string>, subtitle?: string|null }} opts
 */
export function chartStackedFoodInsecurity(container, dist, opts) {
  const width = opts.width ?? 640;
  const subtitle = opts.subtitle !== undefined ? opts.subtitle : null;
  const margin = { top: subtitle ? 52 : 38, right: 16, bottom: 36, left: 48 };
  const height = 360;
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const valueLabels = opts.valueLabels ?? LABELS.IA_statut;
  const colors = opts.colors ?? IA_COLORS;

  const strata = dist.map((d) => d.stratum);
  const allKeys = [...new Set(dist.flatMap((d) => d.levels.map((l) => l.key)))].sort(
    (a, b) => Number(a) - Number(b) || a.localeCompare(b)
  );

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"
  ></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Composition de la sécurité alimentaire par classe sociale. Chaque barre représente cent pour cent des répondants Pop2 pondérés de la classe. Comparer les proportions des segments colorés : bleu sécurité alimentaire, orange insécurité modérée, rouge insécurité sévère. Données descriptives pondérées, non causales."
    );

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(strata.map(String)).range([0, innerW]).padding(0.22);
  const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const stacked = dist.map((d) => {
    let y0 = 0;
    return allKeys.map((k) => {
      const lev = d.levels.find((l) => l.key === k);
      const p = lev ? lev.p * 100 : 0;
      const seg = { key: k, y0, y1: y0 + p, stratum: d.stratum, pct: p, w: d.totalWeight };
      y0 += p;
      return seg;
    });
  });

  const flat = stacked.flat();

  g.append("g")
    .attr("class", "grid-y")
    .selectAll("line")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.08)
    .attr("pointer-events", "none");

  g.selectAll("rect.stack")
    .data(flat)
    .join("rect")
    .attr("class", "stack")
    .attr("x", (d) => x(String(d.stratum)))
    .attr("y", (d) => y(d.y1))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1)))
    .attr("fill", (d) => colors[d.key] ?? "#888")
    .attr("stroke", "var(--theme-background, #0d1117)")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("mouseenter", function () {
      d3.select(this).attr("stroke-width", 2.5).attr("stroke-opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-width", 1).attr("stroke-opacity", 1);
    })
    .each(function (d) {
      const label = valueLabels[d.key] ?? d.key;
      const title = `${stratumLabels[d.stratum] ?? d.stratum}\n${label}: ${d.pct.toFixed(1)}% (pondéré Pop2)`;
      d3.select(this).append("title").text(title);
    });

  g.selectAll("text.segPct")
    .data(flat.filter((d) => {
      const h = Math.abs(y(d.y0) - y(d.y1));
      return d.pct >= 5 && h >= 16;
    }))
    .join("text")
    .attr("class", "segPct")
    .attr("x", (d) => x(String(d.stratum)) + x.bandwidth() / 2)
    .attr("y", (d) => (y(d.y0) + y(d.y1)) / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .attr("fill", (d) => pickTextOnRgb(d3.rgb(colors[d.key] ?? "#888")))
    .attr("pointer-events", "none")
    .text((d) => `${d.pct.toFixed(0)}%`);

  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat((d) => shortIncomeClassLabel(d, stratumLabels)));
  xAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "12px");
  xAxis.selectAll("line, path").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  const yAxis = g.append("g").call(
    d3.axisLeft(y).ticks(5).tickFormat((t) => `${t}%`).tickSizeOuter(0)
  );
  yAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "11px");
  yAxis.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);
  yAxis.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  const titleG = g.append("g").attr("class", "inca-chart-title");
  titleG
    .append("text")
    .attr("x", innerW / 2)
    .attr("y", subtitle ? -30 : -14)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .text("Part de chaque statut de sécurité alimentaire (%, pondéré)");
  if (subtitle) {
    titleG
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("opacity", 0.88)
      .text(subtitle);
  }

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -34)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "11px")
    .text("Pourcentage de la strate");

  const colorScale = d3
    .scaleOrdinal()
    .domain(allKeys)
    .range(allKeys.map((k) => colors[k] ?? "#999"));

  const leg = Swatches(colorScale, {
    columns: width >= 520 ? 3 : 1,
    format: (k) => valueLabels[k] ?? String(k),
    swatchWidth: 14,
    swatchHeight: 14
  });
  wrap.append(html`<div style="margin-top:10px;max-width:${width}px;"></div>`);
  wrap.append(leg);

  container.append(wrap);
}

/** Cinq couleurs pour le graphique de composition (grandes familles INCA3). */
const GPE_MACRO_COLOR_LIST = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"];

/**
 * Barres empilées à 100 % : parts de familles alimentaires par strate (poids survey).
 * L’ordre des segments suit la masse nationale décroissante (même empilement sur chaque barre).
 * @param {HTMLElement} container
 * @param {Array<{stratum: number, totalWeight: number, levels: {key: string, p: number, weight?: number}[]}>} dist
 * @param {{ width: number, stratumLabels?: Record<number|string, string>, valueLabels?: Record<string, string>, colors?: Record<string, string>, title?: string, subtitle?: string|null, xTickFormat?: (s: string) => string, footnote?: string|null }} opts
 */
export function chartStackedMacroComposition(container, dist, opts) {
  const wIn = Number(opts.width);
  const width = Math.max(360, Number.isFinite(wIn) && wIn > 0 ? wIn : 640);
  const subtitle = opts.subtitle !== undefined ? opts.subtitle : null;
  const footnote = opts.footnote !== undefined ? opts.footnote : null;
  const title =
    opts.title ?? "Structure de la consommation (parts relatives, 100 % par strate)";
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const valueLabels = opts.valueLabels ?? {};
  const xTickFormat = opts.xTickFormat ?? ((d) => String(d));

  const strata = dist.map((d) => d.stratum);
  const nationalGram = new Map();
  for (const d of dist) {
    for (const lev of d.levels) {
      const wgt = lev.weight ?? lev.p * (d.totalWeight || 1);
      nationalGram.set(lev.key, (nationalGram.get(lev.key) ?? 0) + wgt);
    }
  }
  const allKeys = [...nationalGram.keys()].sort(
    (a, b) => (nationalGram.get(b) ?? 0) - (nationalGram.get(a) ?? 0)
  );

  const colors =
    opts.colors ??
    Object.fromEntries(allKeys.map((k, i) => [k, GPE_MACRO_COLOR_LIST[i % GPE_MACRO_COLOR_LIST.length]]));

  const margin = { top: subtitle ? 58 : 42, right: 16, bottom: 38, left: 48 };
  const height = 400;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"
  ></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Barres empilées à cent pour cent par classe sociale : cinq grandes familles alimentaires, hors eaux et boissons (conso_gpe29–34). Comparer les proportions entre classe pauvre et classe riche. Pop3 pondéré."
    );

  const x = d3.scaleBand().domain(strata.map(String)).range([0, innerW]).padding(0.22);
  const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const stacked = dist.map((d) => {
    let y0 = 0;
    return allKeys.map((k) => {
      const lev = d.levels.find((l) => l.key === k);
      const p = lev ? lev.p * 100 : 0;
      const seg = { key: k, y0, y1: y0 + p, stratum: d.stratum, pct: p };
      y0 += p;
      return seg;
    });
  });

  const flat = stacked.flat();

  g.append("g")
    .attr("class", "grid-y")
    .selectAll("line")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.08)
    .attr("pointer-events", "none");

  g.selectAll("rect.stack")
    .data(flat)
    .join("rect")
    .attr("class", "stack")
    .attr("x", (d) => x(String(d.stratum)))
    .attr("y", (d) => y(d.y1))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1)))
    .attr("fill", (d) => colors[d.key] ?? "#888")
    .attr("stroke", "var(--theme-background, #0d1117)")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("mouseenter", function () {
      d3.select(this).attr("stroke-width", 2.5).attr("stroke-opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-width", 1).attr("stroke-opacity", 1);
    })
    .each(function (d) {
      const label = valueLabels[d.key] ?? d.key;
      const titleText = `${stratumLabels[d.stratum] ?? d.stratum}\n${label}: ${d.pct.toFixed(1)} % de la conso. totale (pondéré Pop3)`;
      d3.select(this).append("title").text(titleText);
    });

  g.selectAll("text.segPct")
    .data(flat.filter((d) => {
      const h = Math.abs(y(d.y0) - y(d.y1));
      return d.pct >= 4 && h >= 14;
    }))
    .join("text")
    .attr("class", "segPct")
    .attr("x", (d) => x(String(d.stratum)) + x.bandwidth() / 2)
    .attr("y", (d) => (y(d.y0) + y(d.y1)) / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "700")
    .attr("fill", (d) => pickTextOnRgb(d3.rgb(colors[d.key] ?? "#888")))
    .attr("pointer-events", "none")
    .text((d) => `${d.pct.toFixed(0)}%`);

  const xAxis = g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).tickFormat((d) => xTickFormat(String(d))));
  xAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "11px");
  xAxis.selectAll("line, path").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  const yAxis = g.append("g").call(
    d3.axisLeft(y).ticks(5).tickFormat((t) => `${t}%`).tickSizeOuter(0)
  );
  yAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "11px");
  yAxis.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);
  yAxis.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  const titleG = g.append("g").attr("class", "inca-chart-title");
  titleG
    .append("text")
    .attr("x", innerW / 2)
    .attr("y", subtitle ? -34 : -16)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .text(title);
  if (subtitle) {
    titleG
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", -14)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("opacity", 0.88)
      .text(subtitle);
  }

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -36)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "11px")
    .text("Part de la consommation (%)");

  const colorScale = d3
    .scaleOrdinal()
    .domain(allKeys)
    .range(allKeys.map((k) => colors[k] ?? "#999"));

  const leg = Swatches(colorScale, {
    columns: width >= 560 ? 3 : width >= 400 ? 2 : 1,
    format: (k) => valueLabels[k] ?? String(k),
    swatchWidth: 12,
    swatchHeight: 12
  });
  wrap.append(html`<div style="margin-top:10px;max-width:${width}px;"></div>`);
  wrap.append(leg);

  if (footnote) {
    const lines = splitFootnoteLines(footnote, Math.max(36, Math.floor((width - 24) / 5.4)));
    const fg = html`<div style="margin-top:10px;max-width:${width}px;font-size:10px;opacity:0.88;line-height:1.35;color:var(--theme-foreground,inherit);"></div>`;
    wrap.append(fg);
    for (const ln of lines) fg.append(html`<div>${ln}</div>`);
  }

  container.append(wrap);
}

/**
 * One SVG: left metric labels, shared % axis, light row separators (no repeated x-axes).
 * @param {HTMLElement} container
 * @param {Array<{stratum: number, fastFoodFrequent: number|null, organicAny: number|null, cantineFrequentChildren: number|null}>} series
 * @param {{ width: number }} opts
 */
export function chartBehaviorsGrouped(container, series, opts) {
  const width = opts.width ?? 640;
  const metrics = [
    {
      key: "fastFoodFrequent",
      line1: "Restauration rapide fréquente",
      line2: "Échelon d’échelle ≥ 6"
    },
    {
      key: "organicAny",
      line1: "Consommation de bio (au moins une)",
      line2: null
    },
    {
      key: "cantineFrequentChildren",
      line1: "Cantine scolaire fréquente",
      line2: "Enfants uniquement · échelon ≥ 6"
    }
  ];

  const maxP = Math.max(
    0.1,
    d3.max(series, (d) =>
      d3.max([d.fastFoodFrequent ?? 0, d.organicAny ?? 0, d.cantineFrequentChildren ?? 0])
    ) * 1.12 || 0.65
  );

  const labelColW = Math.min(210, Math.max(118, Math.round(width * 0.30)));
  const margin = { top: 8, right: 12, bottom: 32, left: labelColW + 10 };
  const blockInnerH = 70;
  const blockGap = 10;
  const innerTotalH = metrics.length * blockInnerH + (metrics.length - 1) * blockGap;
  const height = margin.top + innerTotalH + margin.bottom;
  const innerW = Math.max(160, width - margin.left - margin.right);

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap inca-behaviors"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);width:100%;max-width:${width}px;"
  ></div>`;

  const rucColor = d3.scaleOrdinal().domain(series.map((d) => String(d.stratum))).range(RUC_COLORS);
  const x = d3.scaleLinear().domain([0, maxP]).nice().range([0, innerW]);

  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Part pondérée de trois comportements alimentaires par classe sociale (bleu plus foncé = classe plus aisée). Lignes : restauration rapide fréquente (échelle six ou plus), consommation de bio (au moins une), cantine scolaire fréquente pour les enfants uniquement. Chaque barre inclut seulement les répondants ayant une réponse valide pour l’item. Échelle en pourcentage sur l’axe horizontal."
    );

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const pctTicks = x.ticks(6);
  g.selectAll("line.grid-v")
    .data(pctTicks)
    .join("line")
    .attr("class", "grid-v")
    .attr("x1", (t) => x(t))
    .attr("x2", (t) => x(t))
    .attr("y1", 0)
    .attr("y2", innerTotalH)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.07)
    .attr("pointer-events", "none");

  metrics.forEach((m, mi) => {
    const yOff = mi * (blockInnerH + blockGap);
    const gBlock = g.append("g").attr("transform", `translate(0,${yOff})`);

    if (mi > 0) {
      gBlock
        .append("line")
        .attr("x1", -6)
        .attr("x2", innerW)
        .attr("y1", -blockGap / 2)
        .attr("y2", -blockGap / 2)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.12);
    }

    const yStr = d3
      .scaleBand()
      .domain(series.map((d) => String(d.stratum)))
      .range([0, blockInnerH - 2])
      .padding(0.2);

    gBlock
      .selectAll("rect")
      .data(series)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d) => yStr(String(d.stratum)))
      .attr("width", (d) => x(d[m.key] ?? 0))
      .attr("height", yStr.bandwidth())
      .attr("rx", 2)
      .attr("fill", (d) => rucColor(String(d.stratum)))
      .attr("opacity", (d) => (d[m.key] == null ? 0.35 : 1))
      .attr("stroke", "transparent")
      .attr("stroke-width", 0)
      .style("cursor", "pointer")
      .on("mouseenter", function () {
        d3.select(this).attr("stroke", "currentColor").attr("stroke-width", 2).attr("stroke-opacity", 0.45);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "transparent").attr("stroke-width", 0);
      })
      .each(function (d) {
        const v = d[m.key];
        const metricNote =
          m.key === "cantineFrequentChildren"
            ? " Enfants uniquement : adultes exclus ; part parmi les enfants avec fréquence de cantine valide (échelle ≥ 6 = fréquent)."
            : m.key === "fastFoodFrequent"
              ? " Parmi les répondants avec fréquence de restauration rapide valide ; fréquent = échelon d’échelle ≥ 6."
              : " Parmi les répondants avec item bio valide ; au moins une consommation de bio.";
        const t =
          v == null
            ? `Aucune réponse valide pour cette ligne.${metricNote}`
            : `${(v * 100).toFixed(1)}% pondéré (${LABELS.RUC_4cl[d.stratum] ?? `Classe ${d.stratum}`}, Pop2).${metricNote}`;
        d3.select(this).append("title").text(t);
      });

    const labelPad = 4;
    gBlock
      .selectAll("text.barVal")
      .data(series.filter((d) => d[m.key] != null))
      .join("text")
      .attr("class", "barVal")
      .attr("y", (d) => yStr(String(d.stratum)) + yStr.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .each(function (d) {
        const v = d[m.key];
        const bw = x(v);
        const barHex = rucColor(String(d.stratum));
        const inside = bw >= 36;
        const tx = d3.select(this);
        if (inside) {
          tx.attr("x", bw - labelPad)
            .attr("text-anchor", "end")
            .attr("fill", barEndLabelFill(barHex));
        } else {
          tx.attr("x", bw + labelPad)
            .attr("text-anchor", "start")
            .attr("fill", "currentColor");
        }
        tx.text(`${(v * 100).toFixed(0)}%`);
      });

    const lx = 6;
    const ly = blockInnerH / 2;
    const labG = svg.append("g").attr("transform", `translate(${lx},${margin.top + yOff + ly})`);
    labG
      .append("text")
      .attr("x", 0)
      .attr("y", m.line2 ? -6 : 0)
      .attr("dominant-baseline", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text(m.line1);
    if (m.line2) {
      labG
        .append("text")
        .attr("x", 0)
        .attr("y", 8)
        .attr("dominant-baseline", "middle")
        .attr("fill", "currentColor")
        .attr("font-size", "10px")
        .attr("opacity", 0.82)
        .text(m.line2);
    }
  });

  g.append("g")
    .attr("transform", `translate(0,${innerTotalH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat((t) => `${Math.round(t * 100)}%`))
    .call((ga) => {
      ga.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);
      ga.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.28);
      ga.selectAll("text").attr("fill", "currentColor").attr("font-size", "10px");
    });

  const leg = Swatches(rucColor, {
    columns: width >= 480 ? 4 : 2,
    format: (s) => LABELS.RUC_4cl[Number(s)] ?? `Classe ${s}`,
    swatchWidth: 12,
    swatchHeight: 12
  });
  wrap.append(html`<div style="margin-top:10px;"></div>`);
  wrap.append(leg);

  container.append(wrap);
}

/**
 * @param {HTMLElement} container
 * @param {Array<{stratum: number, means: Record<string, number|null>}>} rows
 * @param {Array<{key: string, label: string}>} keys
 * @param {Record<string, number>} nationalMeans
 * @param {{ width: number, rowLabel?: (s: number) => string, title?: string, footnote?: string }} opts
 */
export function chartIntakeHeatmap(container, rows, keys, nationalMeans, opts = {}) {
  const width = opts.width ?? 720;
  const rowLabel = opts.rowLabel ?? ((s) => LABELS.RUC_4cl[Number(s)] ?? `Classe ${s}`);
  const chartTitle = opts.title ?? "Apport moyen par strate";
  const chartFootnote = opts.footnote !== undefined ? opts.footnote : null;

  const rowLabels = rows.map((r) => rowLabel(r.stratum));
  const approxLabelW = 12 + d3.max(rowLabels, (s) => s.length) * 7.2;
  const gx = Math.min(160, Math.max(88, approxLabelW));

  const nCol = keys.length;
  const cellW = Math.max(82, (width - gx - 24) / nCol - 2);
  const cellH = 38;
  const headerH = 42;
  const footLines = chartFootnote
    ? splitFootnoteLines(chartFootnote, Math.max(40, Math.floor((width - 24) / 5.2)))
    : [];
  const titleBlock = 22 + footLines.length * 13;
  const legendH = 38;
  const g0y = titleBlock + 6;
  const gridTop = headerH + 8;
  const height = g0y + gridTop + rows.length * cellH + legendH + 22;

  const values = [];
  for (const r of rows) {
    for (const { key } of keys) {
      const nat = nationalMeans[key];
      const v = r.means[key];
      if (v != null && nat != null && nat !== 0) values.push((v - nat) / nat);
    }
  }
  const ext = d3.extent(values);
  const maxAbs = Math.max(Math.abs(ext[0] ?? 0), Math.abs(ext[1] ?? 0), 0.05);
  const color = d3.scaleDiverging(d3.interpolateBrBG).domain([-maxAbs, 0, maxAbs]);

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"
  ></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("overflow", "visible")
    .attr("role", "img")
    .attr(
      "aria-label",
      `${chartTitle}. Les lignes correspondent aux strates de revenu ; les colonnes aux groupes alimentaires et nutriments. Les valeurs des cellules sont les grammes par jour moyens de la strate ; la deuxième ligne montre l’écart en pourcentage à la moyenne nationale Pop3 pondérée. Survoler les cellules pour les valeurs exactes. Données descriptives, non causales.`
    );

  svg
    .append("text")
    .attr("x", gx + (nCol * cellW) / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text(chartTitle);

  const footG = svg
    .append("g")
    .attr("transform", `translate(${gx + (nCol * cellW) / 2},${22})`);
  for (let li = 0; li < footLines.length; li++) {
    footG
      .append("text")
      .attr("x", 0)
      .attr("y", li * 13)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "currentColor")
      .attr("opacity", 0.88)
      .text(footLines[li]);
  }

  const g = svg.append("g").attr("transform", `translate(${gx},${g0y})`);

  const colMeta = keys.map((d, i) => ({
    key: d.key,
    label: d.label,
    i,
    lines: splitTitleForColumn(HEATMAP_SHORT_LABELS[d.key] ?? d.label, cellW)
  }));

  g.selectAll("g.colHead")
    .data(colMeta)
    .join("g")
    .attr("class", "colHead")
    .attr("transform", (d) => `translate(${d.i * cellW + cellW / 2},${headerH - d.lines.length * 12 - 2})`)
    .each(function (d) {
      const gHead = d3.select(this);
      d.lines.forEach((ln, li) => {
        gHead
          .append("text")
          .attr("x", 0)
          .attr("y", li * 12)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "9px")
          .attr("font-weight", "600")
          .attr("fill", "currentColor")
          .text(ln);
      });
    });

  const cells = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j].key;
      const nat = nationalMeans[key];
      const v = rows[i].means[key];
      const rel = v != null && nat != null && nat !== 0 ? (v - nat) / nat : null;
      cells.push({ i, j, key, v, nat, rel, stratum: rows[i].stratum, fullLabel: keys[j].label });
    }
  }

  g.selectAll("rect.cell")
    .data(cells)
    .join("rect")
    .attr("class", "cell")
    .attr("x", (d) => d.j * cellW + 1)
    .attr("y", (d) => gridTop + d.i * cellH)
    .attr("width", cellW - 3)
    .attr("height", cellH - 3)
    .attr("rx", 3)
    .attr("fill", (d) => (d.rel == null ? "rgba(140,140,150,0.14)" : color(d.rel)))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.12)
    .style("cursor", "pointer")
    .on("mouseenter", function () {
      d3.select(this).attr("stroke-opacity", 0.5).attr("stroke-width", 2);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-opacity", 0.12).attr("stroke-width", 1);
    })
    .each(function (d) {
      const lines = [
        `${rowLabel(d.stratum)} · ${d.fullLabel}`,
        d.v == null ? "n/d" : `Moyenne de strate : ${d.v.toFixed(1)} g/j`,
        d.nat == null ? "" : `Moyenne nationale Pop3 : ${d.nat.toFixed(1)} g/j`,
        d.rel == null ? "" : `Écart à la moyenne nationale : ${d.rel >= 0 ? "+" : ""}${(d.rel * 100).toFixed(1)}%`
      ];
      d3.select(this).append("title").text(lines.filter(Boolean).join("\n"));
    });

  const textCells = cells.filter((d) => d.v != null);
  g.selectAll("g.cellLabel")
    .data(textCells)
    .join("g")
    .attr("class", "cellLabel")
    .attr("transform", (d) => `translate(${d.j * cellW + cellW / 2},${gridTop + d.i * cellH + cellH / 2})`)
    .each(function (d) {
      const fill = d.rel == null ? "currentColor" : textColorForFill(color, d.rel);
      const strokeCol =
        d.rel == null ? "none" : cellTextStroke(color(d.rel));
      const gg = d3.select(this);
      gg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -5)
        .attr("font-size", "12px")
        .attr("font-weight", "700")
        .attr("fill", fill)
        .attr("stroke", strokeCol)
        .attr("stroke-width", d.rel == null ? 0 : 0.45)
        .attr("paint-order", "stroke fill")
        .attr("stroke-linejoin", "round")
        .text(d.v.toFixed(0));
      if (d.rel != null) {
        gg.append("text")
          .attr("text-anchor", "middle")
          .attr("y", 9)
          .attr("font-size", "10px")
          .attr("font-weight", "700")
          .attr("fill", fill)
          .attr("stroke", strokeCol)
          .attr("stroke-width", 0.4)
          .attr("paint-order", "stroke fill")
          .attr("stroke-linejoin", "round")
          .text(`${d.rel >= 0 ? "+" : ""}${(d.rel * 100).toFixed(0)}%`);
      }
    });

  svg
    .selectAll("text.rowLab")
    .data(rows)
    .join("text")
    .attr("class", "rowLab")
    .attr("x", gx - 10)
    .attr("y", (d, i) => g0y + gridTop + i * cellH + cellH / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "500")
    .attr("fill", "currentColor")
    .text((d) => rowLabel(d.stratum));

  const legendW = Math.min(240, width - gx - 24);
  const lx = gx + (nCol * cellW - legendW) / 2;
  const ly = g0y + gridTop + rows.length * cellH + 14;
  const defs = svg.append("defs");
  const gradId = `hm-${Math.random().toString(16).slice(2)}`;
  const lg = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("x2", "100%");
  for (const t of d3.range(0, 1.01, 0.08)) {
    const v = -maxAbs + t * 2 * maxAbs;
    lg.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(v));
  }
  svg
    .append("rect")
    .attr("x", lx)
    .attr("y", ly)
    .attr("width", legendW)
    .attr("height", 10)
    .attr("rx", 2)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.2);
  svg
    .append("text")
    .attr("x", lx + legendW / 2)
    .attr("y", ly + 24)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "currentColor")
    .attr("opacity", 0.9)
    .text(`Sous la moyenne nationale ← 0% → Au-dessus de la moyenne (échelle ±${(maxAbs * 100).toFixed(0)}%)`);

  container.append(wrap);
}

/**
 * Line chart: mean health score vs income stratum (RUC 1–4), continuous x for a clear trend.
 * @param {HTMLElement} container
 * @param {Array<{ stratum: number, meanHealthScore: number|null }>} series
 * @param {{ width: number, stratumLabels?: Record<number|string, string>, subtitle?: string|null, footnote?: string|null, showNationalRef?: boolean, selectedStratum?: number|null, onSelectStratum?: ((stratum:number)=>void)|null }} opts
 */
export function chartHealthScoreIncomeLine(container, series, opts) {
  const width = opts.width ?? 640;
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const subtitle = opts.subtitle !== undefined ? opts.subtitle : null;
  const footnote = opts.footnote ?? null;
  const showNationalRef = opts.showNationalRef !== false;
  const selectedStratum = Number.isFinite(opts.selectedStratum) ? Number(opts.selectedStratum) : null;
  const onSelectStratum = typeof opts.onSelectStratum === "function" ? opts.onSelectStratum : null;

  const points = series
    .filter((d) => d.meanHealthScore != null && Number.isFinite(d.meanHealthScore))
    .map((d) => ({
      stratum: d.stratum,
      yScore: d.meanHealthScore,
      yDelta: d.meanHealthScore - 50
    }))
    .sort((a, b) => a.stratum - b.stratum);

  const vals = points.map((d) => d.yDelta);
  const yMargin = 1;
  const yMin = (d3.min(vals) ?? -2) - yMargin;
  const yMax = (d3.max(vals) ?? 2) + yMargin;
  const yPad = Math.max(yMax - yMin, 2);
  const y0 = yMin - yPad * 0.015;
  const y1 = yMax + yPad * 0.015;

  const margin = { top: subtitle ? 54 : 38, right: 22, bottom: 36, left: 50 };
  const height = 300;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"
  ></div>`;

  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Courbe : indice alimentaire moyen en fonction de la strate de revenu du ménage, quatre points reliés. Axe horizontal : strates une à quatre. Données descriptives Pop3 pondérées."
    );

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0.65, 4.35]).range([0, innerW]);
  const y = d3.scaleLinear().domain([y0, y1]).nice().range([innerH, 0]);

  const lineColor = "#2171b5";
  const areaFillStr = "rgba(33, 113, 181, 0.14)";

  g.append("g")
    .attr("class", "grid-y")
    .selectAll("line")
    .data(y.ticks(6))
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.08)
    .attr("pointer-events", "none");

  if (showNationalRef && y(0) >= 0 && y(0) <= innerH) {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.22)
      .attr("stroke-dasharray", "5,4")
      .attr("pointer-events", "none");
    g.append("text")
      .attr("x", innerW - 4)
      .attr("y", y(0) - 4)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.65)
      .text("Moyenne nat. = 0 pp");
  }

  if (points.length >= 2) {
    const lineGen = d3
      .line()
      .x((d) => x(d.stratum))
      .y((d) => y(d.yDelta))
      .curve(d3.curveMonotoneX);
    const areaGen = d3
      .area()
      .x((d) => x(d.stratum))
      .y0(y(0))
      .y1((d) => y(d.yDelta))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(points)
      .attr("fill", areaFillStr)
      .attr("d", areaGen);

    g.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineGen);
  }

  const rucPt = d3.scaleOrdinal().domain(points.map((d) => String(d.stratum))).range(RUC_COLORS);

  g.selectAll("circle.pt")
    .data(points)
    .join("circle")
    .attr("class", "pt")
    .attr("cx", (d) => x(d.stratum))
    .attr("cy", (d) => y(d.yDelta))
    .attr("r", (d) => (selectedStratum != null && d.stratum === selectedStratum ? 8 : 6))
    .attr("fill", (d) => rucPt(String(d.stratum)))
    .attr("stroke", "var(--theme-background, #fff)")
    .attr("stroke-width", (d) => (selectedStratum != null && d.stratum === selectedStratum ? 3 : 2))
    .style("cursor", onSelectStratum ? "pointer" : "default")
    .on("click", function (event, d) {
      if (!onSelectStratum) return;
      event.preventDefault();
      onSelectStratum(d.stratum);
    })
    .each(function (d) {
      const lab = stratumLabels[d.stratum] ?? `Strate ${d.stratum}`;
      d3.select(this)
        .append("title")
        .text(
          `${lab}\nEcart vs moyenne: ${d.yDelta >= 0 ? "+" : ""}${d.yDelta.toFixed(1)} pp\nIndice: ${d.yScore.toFixed(1)} / 100`
        );
    });

  g.selectAll("text.val")
    .data(points)
    .join("text")
    .attr("class", "val")
    .attr("x", (d) => x(d.stratum))
    .attr("y", (d) => y(d.yDelta) - 12)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .attr("fill", "currentColor")
    .text((d) => `${d.yDelta >= 0 ? "+" : ""}${d.yDelta.toFixed(1)}`);

  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(4)
        .tickFormat((d) => shortIncomeClassLabel(d, stratumLabels))
        .tickValues([1, 2, 3, 4])
    );
  xAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "12px");
  if (selectedStratum != null) {
    xAxis
      .selectAll(".tick text")
      .attr("font-weight", (d) => (Number(d) === selectedStratum ? "700" : "400"));
  }
  xAxis.selectAll("line, path").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  const yAxis = g.append("g").call(
    d3
      .axisLeft(y)
      .ticks(6)
      .tickSizeOuter(0)
      .tickFormat((t) => `${Number(t) >= 0 ? "+" : ""}${Number(t).toFixed(1)}`)
  );
  yAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "11px");
  yAxis.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);
  yAxis.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "11px")
    .text("Ecart a la moyenne (points de pourcentage)");

  const titleG = g.append("g").attr("class", "inca-chart-title");
  titleG
    .append("text")
    .attr("x", innerW / 2)
    .attr("y", subtitle ? -30 : -14)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .text("Indice « sante » : ecart a la moyenne par classe sociale");
  if (subtitle) {
    titleG
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("opacity", 0.88)
      .text(subtitle);
  }

  const leg = Swatches(rucPt, {
    columns: width >= 480 ? 4 : 2,
    format: (s) => stratumLabels[Number(s)] ?? `Classe ${s}`,
    swatchWidth: 12,
    swatchHeight: 12
  });
  wrap.append(html`<div style="margin-top:8px;"></div>`);
  wrap.append(leg);

  if (footnote) {
    const lines = splitFootnoteLines(footnote, Math.max(36, Math.floor((width - 24) / 5.4)));
    const fg = html`<div style="margin-top:10px;max-width:${width}px;font-size:10px;opacity:0.88;line-height:1.35;color:var(--theme-foreground,inherit);"></div>`;
    wrap.append(fg);
    for (const ln of lines) fg.append(html`<div>${ln}</div>`);
  }

  container.append(wrap);
}

/**
 * Profil de contribution moyenne des composantes de l'indice pour une strate donnée.
 * @param {HTMLElement} container
 * @param {Array<{label: string, role: string, meanContribution: number|null, meanContributionScore?: number|null}>} components
 * @param {{ width: number, title?: string, subtitle?: string|null }} opts
 */
export function chartHealthScoreContributionProfile(container, components, opts = {}) {
  const width = opts.width ?? 640;
  const title = opts.title ?? "Décomposition de l'indice (contributions moyennes)";
  const subtitle = opts.subtitle !== undefined ? opts.subtitle : null;

  const valueOf = (d) =>
    d.meanContributionScore != null && Number.isFinite(d.meanContributionScore)
      ? d.meanContributionScore
      : d.meanContribution;

  const rows = components.filter((d) => valueOf(d) != null && Number.isFinite(valueOf(d)));
  const ordered = [
    ...rows.filter((d) => d.role === "protective"),
    ...rows.filter((d) => d.role === "risk"),
    ...rows.filter((d) => d.role === "context")
  ];

  const maxAbs = Math.max(0.1, d3.max(ordered, (d) => Math.abs(valueOf(d))) ?? 0.8);
  const margin = { top: subtitle ? 56 : 40, right: 26, bottom: 34, left: 260 };
  const rowH = 24;
  const height = Math.max(280, margin.top + ordered.length * rowH + margin.bottom + 12);
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"
  ></div>`;

  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "Contributions moyennes par composante de l'indice santé, pour la strate sélectionnée.");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([-maxAbs * 1.1, maxAbs * 1.1]).range([0, innerW]);
  const y = d3
    .scaleBand()
    .domain(ordered.map((d) => d.label))
    .range([0, innerH])
    .padding(0.24);

  g.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-dasharray", "3,3");

  g.selectAll("rect.cbar")
    .data(ordered)
    .join("rect")
    .attr("class", "cbar")
    .attr("x", (d) => Math.min(x(0), x(valueOf(d))))
    .attr("y", (d) => y(d.label))
    .attr("width", (d) => Math.max(1, Math.abs(x(valueOf(d)) - x(0))))
    .attr("height", y.bandwidth())
    .attr("rx", 2)
    .attr("fill", (d) => {
      if (valueOf(d) >= 0) return d.role === "context" ? "#8250df" : "#1a7f37";
      return "#cf222e";
    })
    .attr("opacity", 0.9)
    .each(function (d) {
      d3.select(this)
        .append("title")
        .text(`${d.label}\nContribution moyenne: ${valueOf(d).toFixed(2)} point(s) d'indice`);
    });

  g.selectAll("text.yLab")
    .data(ordered)
    .join("text")
    .attr("class", "yLab")
    .attr("x", -10)
    .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "11px")
    .attr("fill", "currentColor")
    .text((d) => d.label);

  g.selectAll("text.cval")
    .data(ordered)
    .join("text")
    .attr("class", "cval")
    .attr("x", (d) => (valueOf(d) >= 0 ? x(valueOf(d)) + 5 : x(valueOf(d)) - 5))
    .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("text-anchor", (d) => (valueOf(d) >= 0 ? "start" : "end"))
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text((d) => `${valueOf(d).toFixed(1)} pt`);

  const xAxis = g.append("g").attr("transform", `translate(0,${innerH})`).call(
    d3.axisBottom(x).ticks(5)
  );
  xAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "10px");
  xAxis.selectAll("line, path").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  svg
    .append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "500")
    .attr("fill", "currentColor")
    .attr("opacity", 0.88)
    .text("Contribution moyenne (points d'indice)");

  svg
    .append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text(title);

  if (subtitle) {
    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "currentColor")
      .attr("opacity", 0.88)
      .text(subtitle);
  }

  container.append(wrap);
}

/**
 * Comparaison "classe pauvre" vs "classe riche" des contributions par composante.
 * Echelle adaptee pour rendre les ecarts lisibles (zoom auto autour de 0).
 * @param {HTMLElement} container
 * @param {Array<{stratum:number, components:Array<{id?:string,label:string,meanContribution:number|null,meanContributionScore?:number|null}>}>} byStratum
 * @param {{ width:number, stratumA?:number, stratumB?:number, stratumLabels?:Record<number|string,string>, title?:string, subtitle?:string|null, maxItems?:number }} opts
 */
export function chartHealthContributionDumbbell(container, byStratum, opts = {}) {
  const width = opts.width ?? 560;
  const stratumA = Number.isFinite(opts.stratumA) ? Number(opts.stratumA) : 1;
  const stratumB = Number.isFinite(opts.stratumB) ? Number(opts.stratumB) : 4;
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const title = opts.title ?? "Leviers de l'ecart nutritionnel";
  const subtitle =
    opts.subtitle !== undefined
      ? opts.subtitle
      : `${stratumLabels[stratumA] ?? `Classe ${stratumA}`} vs ${stratumLabels[stratumB] ?? `Classe ${stratumB}`}`;
  const maxItems = Number.isFinite(opts.maxItems) ? Number(opts.maxItems) : 9;

  const valueOf = (d) =>
    d.meanContributionScore != null && Number.isFinite(d.meanContributionScore)
      ? d.meanContributionScore
      : d.meanContribution;

  const a = byStratum.find((d) => d.stratum === stratumA);
  const b = byStratum.find((d) => d.stratum === stratumB);
  const bById = new Map((b?.components ?? []).map((c) => [c.id ?? c.label, c]));

  const rows = [];
  for (const cA of a?.components ?? []) {
    const cB = bById.get(cA.id ?? cA.label);
    if (!cB) continue;
    const vA = valueOf(cA);
    const vB = valueOf(cB);
    if (!Number.isFinite(vA) || !Number.isFinite(vB)) continue;
    rows.push({
      id: cA.id ?? cA.label,
      label: cA.label,
      a: vA,
      b: vB,
      delta: vB - vA
    });
  }

  const top = rows.sort((u, v) => Math.abs(v.delta) - Math.abs(u.delta)).slice(0, maxItems);

  const maxAbsObserved = d3.max(top, (d) => Math.max(Math.abs(d.a), Math.abs(d.b), Math.abs(d.delta))) ?? 0.2;
  const maxAbs = Math.max(0.25, Math.min(2.5, maxAbsObserved * 1.18));

  const margin = { top: subtitle ? 56 : 40, right: 56, bottom: 30, left: 210 };
  const rowH = 26;
  const height = Math.max(300, margin.top + top.length * rowH + margin.bottom + 6);
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  clear(container);
  const wrap = html`<div class="inca-chart-wrap" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "Comparaison des contributions par composante entre classe pauvre et classe riche.");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([0, innerW]);
  const y = d3
    .scaleBand()
    .domain(top.map((d) => d.label))
    .range([0, innerH])
    .padding(0.28);

  g.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.28)
    .attr("stroke-dasharray", "4,3");

  g.selectAll("line.dl")
    .data(top)
    .join("line")
    .attr("class", "dl")
    .attr("x1", (d) => x(d.a))
    .attr("x2", (d) => x(d.b))
    .attr("y1", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("y2", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.36)
    .attr("stroke-width", 2);

  const colorPoor = "#d73027";
  const colorRich = "#4575b4";

  g.selectAll("circle.pa")
    .data(top)
    .join("circle")
    .attr("class", "pa")
    .attr("cx", (d) => x(d.a))
    .attr("cy", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("r", 4.2)
    .attr("fill", colorPoor)
    .each(function (d) {
      d3.select(this)
        .append("title")
        .text(`${stratumLabels[stratumA] ?? `Classe ${stratumA}`}\n${d.label}: ${d.a.toFixed(2)} pp`);
    });

  g.selectAll("circle.pb")
    .data(top)
    .join("circle")
    .attr("class", "pb")
    .attr("cx", (d) => x(d.b))
    .attr("cy", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("r", 4.2)
    .attr("fill", colorRich)
    .each(function (d) {
      d3.select(this)
        .append("title")
        .text(`${stratumLabels[stratumB] ?? `Classe ${stratumB}`}\n${d.label}: ${d.b.toFixed(2)} pp`);
    });

  g.selectAll("text.yl")
    .data(top)
    .join("text")
    .attr("class", "yl")
    .attr("x", -8)
    .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "11px")
    .attr("fill", "currentColor")
    .text((d) => d.label);

  g.selectAll("text.dd")
    .data(top)
    .join("text")
    .attr("class", "dd")
    .attr("x", innerW + 4)
    .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text((d) => `D ${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(2)} pp`);

  const xAxis = g.append("g").attr("transform", `translate(0,${innerH})`).call(
    d3.axisBottom(x).ticks(5).tickFormat((t) => `${Number(t) >= 0 ? "+" : ""}${Number(t).toFixed(2)}`)
  );
  xAxis.selectAll("text").attr("fill", "currentColor").attr("font-size", "10px");
  xAxis.selectAll("line, path").attr("stroke", "currentColor").attr("stroke-opacity", 0.35);

  svg
    .append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text(title);

  if (subtitle) {
    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "currentColor")
      .attr("opacity", 0.88)
      .text(subtitle);
  }

  svg
    .append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "500")
    .attr("fill", "currentColor")
    .attr("opacity", 0.9)
    .text("Contributions en points de pourcentage (echelle auto-zoomee)");

  const lg = svg.append("g").attr("transform", `translate(${margin.left},${height - 6})`);
  lg.append("circle").attr("cx", -2).attr("cy", -22).attr("r", 4).attr("fill", colorPoor);
  lg
    .append("text")
    .attr("x", 8)
    .attr("y", -22)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("fill", "currentColor")
    .text(stratumLabels[stratumA] ?? `Classe ${stratumA}`);
  lg.append("circle").attr("cx", 180).attr("cy", -22).attr("r", 4).attr("fill", colorRich);
  lg
    .append("text")
    .attr("x", 190)
    .attr("y", -22)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("fill", "currentColor")
    .text(stratumLabels[stratumB] ?? `Classe ${stratumB}`);

  container.append(wrap);
}

/**
 * Heatmap "classes sociales × indicateurs" with mixed units.
 * Colors encode within-indicator z-scores; cell labels show oriented gap values.
 * @param {HTMLElement} container
 * @param {Array<{stratum:number, metrics: Record<string, number|null>}>} rows
 * @param {Array<{id:string, label:string, shortLabel?:string, format?:(v:number)=>string}>} indicators
 * @param {{ width:number, stratumLabels?:Record<number|string,string>, title?:string, subtitle?:string|null, legendLabel?:string }} opts
 */
export function chartInequalityIndicatorHeatmap(container, rows, indicators, opts = {}) {
  const width = opts.width ?? 640;
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const title = opts.title ?? "Carte des inegalites nutritionnelles";
  const subtitle =
    opts.subtitle !== undefined
      ? opts.subtitle
      : "Couleur: ecart standardise au sein de chaque indicateur";
  const legendLabel =
    opts.legendLabel ?? "Moins favorable  -  0  -  Plus favorable";

  const rowLabel = (s) => stratumLabels[Number(s)] ?? `Classe ${s}`;
  const rowLabels = rows.map((r) => rowLabel(r.stratum));
  const leftW = Math.min(190, Math.max(100, 16 + (d3.max(rowLabels, (s) => s.length) ?? 12) * 7));

  const cellW = Math.max(86, (width - leftW - 26) / Math.max(1, indicators.length));
  const cellH = 44;
  const headerH = 46;
  const topPad = subtitle ? 44 : 30;
  const legendH = 48;
  const height = topPad + headerH + rows.length * cellH + legendH + 22;

  const zByIndicator = new Map();
  for (const ind of indicators) {
    const vals = rows
      .map((r) => r.metrics?.[ind.id])
      .filter((v) => Number.isFinite(v));
    const mean = vals.length ? d3.mean(vals) : 0;
    const sd = vals.length > 1 ? d3.deviation(vals) : 0;
    const denom = sd && sd > 1e-9 ? sd : 1;
    zByIndicator.set(ind.id, { mean, denom });
  }

  const cells = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < indicators.length; j++) {
      const ind = indicators[j];
      const raw = rows[i].metrics?.[ind.id];
      const zInfo = zByIndicator.get(ind.id);
      const z = Number.isFinite(raw) ? (raw - zInfo.mean) / zInfo.denom : null;
      cells.push({
        i,
        j,
        stratum: rows[i].stratum,
        indicator: ind,
        raw,
        z: z == null ? null : Math.max(-2.6, Math.min(2.6, z))
      });
    }
  }

  const color = d3.scaleDiverging(d3.interpolateRdBu).domain([-2.2, 0, 2.2]);

  clear(container);
  const wrap = html`<div class="inca-chart-wrap" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Heatmap des inegalites nutritionnelles par classe sociale et indicateur. Les couleurs montrent un ecart standardise au sein de chaque indicateur."
    );

  svg
    .append("text")
    .attr("x", leftW + (indicators.length * cellW) / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text(title);

  if (subtitle) {
    svg
      .append("text")
      .attr("x", leftW + (indicators.length * cellW) / 2)
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("opacity", 0.88)
      .attr("fill", "currentColor")
      .text(subtitle);
  }

  const g = svg.append("g").attr("transform", `translate(${leftW},${topPad})`);

  g.selectAll("g.colHead")
    .data(indicators)
    .join("g")
    .attr("class", "colHead")
    .attr("transform", (d, i) => `translate(${i * cellW + cellW / 2},${headerH - 28})`)
    .each(function (d) {
      const lines = splitTitleForColumn(d.shortLabel ?? d.label, cellW);
      const gg = d3.select(this);
      lines.forEach((ln, li) => {
        gg.append("text")
          .attr("x", 0)
          .attr("y", li * 12)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "9px")
          .attr("font-weight", "600")
          .attr("fill", "currentColor")
          .text(ln);
      });
    });

  g.selectAll("rect.hm")
    .data(cells)
    .join("rect")
    .attr("class", "hm")
    .attr("x", (d) => d.j * cellW + 1)
    .attr("y", (d) => headerH + d.i * cellH)
    .attr("width", cellW - 3)
    .attr("height", cellH - 3)
    .attr("rx", 3)
    .attr("fill", (d) => (d.z == null ? "rgba(120,120,130,0.14)" : color(d.z)))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.14)
    .style("cursor", "pointer")
    .on("mouseenter", function () {
      d3.select(this).attr("stroke-opacity", 0.5).attr("stroke-width", 2);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-opacity", 0.14).attr("stroke-width", 1);
    })
    .each(function (d) {
      const display = Number.isFinite(d.raw)
        ? (d.indicator.format ? d.indicator.format(d.raw) : `${d.raw.toFixed(1)}`)
        : "n/d";
      d3.select(this)
        .append("title")
        .text(`${rowLabel(d.stratum)} · ${d.indicator.label}\nEcart: ${display}${d.z == null ? "" : `\nZ-score: ${d.z.toFixed(2)}`}`);
    });

  g.selectAll("g.hmt")
    .data(cells.filter((d) => Number.isFinite(d.raw)))
    .join("g")
    .attr("class", "hmt")
    .attr("transform", (d) => `translate(${d.j * cellW + cellW / 2},${headerH + d.i * cellH + cellH / 2})`)
    .each(function (d) {
      const fill = d.z == null ? "currentColor" : textColorForFill(color, d.z);
      const stroke = d.z == null ? "none" : cellTextStroke(color(d.z));
      const text = d.indicator.format ? d.indicator.format(d.raw) : `${d.raw.toFixed(1)}`;
      d3.select(this)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "700")
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", d.z == null ? 0 : 0.42)
        .attr("paint-order", "stroke fill")
        .attr("stroke-linejoin", "round")
        .text(text);
    });

  svg
    .selectAll("text.rlab")
    .data(rows)
    .join("text")
    .attr("class", "rlab")
    .attr("x", leftW - 10)
    .attr("y", (d, i) => topPad + headerH + i * cellH + cellH / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "500")
    .attr("fill", "currentColor")
    .text((d) => rowLabel(d.stratum));

  const legendW = Math.min(250, width - leftW - 26);
  const lx = leftW + (indicators.length * cellW - legendW) / 2;
  const ly = topPad + headerH + rows.length * cellH + 14;
  const defs = svg.append("defs");
  const gradId = `ineq-hm-${Math.random().toString(16).slice(2)}`;
  const lg = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("x2", "100%");
  for (const t of d3.range(0, 1.01, 0.08)) {
    const v = -2.2 + t * 4.4;
    lg.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(v));
  }

  svg
    .append("rect")
    .attr("x", lx)
    .attr("y", ly)
    .attr("width", legendW)
    .attr("height", 10)
    .attr("rx", 2)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.2);

  svg
    .append("text")
    .attr("x", lx + legendW / 2)
    .attr("y", ly + 24)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "currentColor")
    .attr("opacity", 0.9)
    .text(legendLabel);

  container.append(wrap);
}

/**
 * Vertical inequality story: one block per indicator, classes ordered top->bottom.
 * Each block shows a centered local scale and the trajectory from poor to rich.
 * @param {HTMLElement} container
 * @param {Array<{stratum:number, metrics: Record<string, number|null>}>} rows
 * @param {Array<{id:string, label:string, shortLabel?:string, format?:(v:number)=>string}>} indicators
 * @param {{ width:number, stratumLabels?:Record<number|string,string>, title?:string, subtitle?:string|null }} opts
 */
export function chartInequalityVerticalLadder(container, rows, indicators, opts = {}) {
  const width = opts.width ?? 640;
  const stratumLabels = opts.stratumLabels ?? LABELS.RUC_4cl;
  const title = opts.title ?? "Profils socio-economiques des indicateurs alimentaires";
  const subtitle =
    opts.subtitle !== undefined
      ? opts.subtitle
      : "Comparaison des classes sociales sur des indicateurs harmonises";

  const classOrder = [1, 2, 3, 4];
  const classColors = {
    1: "#d73027",
    2: "#fdae61",
    3: "#74add1",
    4: "#4575b4"
  };

  const blocks = indicators.map((ind) => {
    const pts = classOrder
      .map((s) => {
        const row = rows.find((r) => Number(r.stratum) === s);
        const v = row?.metrics?.[ind.id];
        return Number.isFinite(v) ? { stratum: s, value: v } : null;
      })
      .filter(Boolean);

    const maxAbs = Math.max(2.5, d3.max(pts, (d) => Math.abs(d.value)) ?? 2.5);
    return { ind, pts, maxAbs: maxAbs * 1.15 };
  });

  const margin = { top: subtitle ? 58 : 42, right: 24, bottom: 22, left: 24 };
  const blockH = 118;
  const blockGap = 14;
  const blockInnerTop = 22;
  const blockInnerBottom = 14;
  const usableH = blockH - blockInnerTop - blockInnerBottom;
  const contentH = blocks.length * blockH + Math.max(0, blocks.length - 1) * blockGap;
  const height = margin.top + contentH + margin.bottom;
  const innerW = width - margin.left - margin.right;
  const labelColW = Math.max(116, Math.min(150, innerW * 0.23));
  const plotLeft = labelColW;
  const plotRight = innerW - 46;

  clear(container);
  const wrap = html`<div class="inca-chart-wrap" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);"></div>`;
  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Comparaison des profils socio-economiques sur des indicateurs alimentaires et de vulnerabilite."
    );

  svg
    .append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text(title);

  if (subtitle) {
    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("opacity", 0.88)
      .attr("fill", "currentColor")
      .text(subtitle);
  }

  const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  blocks.forEach((b, i) => {
    const y0 = i * (blockH + blockGap);
    const g = root.append("g").attr("transform", `translate(0,${y0})`);

    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", blockH)
      .attr("rx", 8)
      .attr("fill", "rgba(120,120,130,0.06)")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.12);

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("fill", "currentColor")
      .text(splitTitleForColumn(b.ind.shortLabel ?? b.ind.label, Math.max(160, innerW * 0.55))[0]);

    const secondLine = splitTitleForColumn(b.ind.shortLabel ?? b.ind.label, Math.max(160, innerW * 0.55))[1];
    if (secondLine) {
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", 26)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", "currentColor")
        .attr("opacity", 0.9)
        .text(secondLine);
    }

    const x = d3.scaleLinear().domain([-b.maxAbs, b.maxAbs]).range([plotLeft, plotRight]);
    const y = d3
      .scalePoint()
      .domain(classOrder.map(String))
      .range([blockInnerTop + 14, blockInnerTop + usableH - 6]);

    g.append("line")
      .attr("x1", plotLeft)
      .attr("x2", plotRight)
      .attr("y1", blockInnerTop + 6)
      .attr("y2", blockInnerTop + 6)
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.09);

    g.append("text")
      .attr("x", plotLeft)
      .attr("y", blockInnerTop + 2)
      .attr("text-anchor", "start")
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.72)
      .text(`${(-b.maxAbs).toFixed(1)}`);

    g.append("text")
      .attr("x", x(0))
      .attr("y", blockInnerTop + 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.72)
      .text("0");

    g.append("text")
      .attr("x", plotRight)
      .attr("y", blockInnerTop + 2)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.72)
      .text(`${b.maxAbs.toFixed(1)}`);

    g.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", blockInnerTop + 6)
      .attr("y2", blockInnerTop + usableH + 2)
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.22)
      .attr("stroke-dasharray", "4,4");

    const line = d3
      .line()
      .x((d) => x(d.value))
      .y((d) => y(String(d.stratum)))
      .curve(d3.curveMonotoneY);

    g.append("path")
      .datum(b.pts)
      .attr("fill", "none")
      .attr("stroke", "#7f8a99")
      .attr("stroke-opacity", 0.65)
      .attr("stroke-width", 2)
      .attr("d", line);

    g.selectAll("circle.pt")
      .data(b.pts)
      .join("circle")
      .attr("class", "pt")
      .attr("cx", (d) => x(d.value))
      .attr("cy", (d) => y(String(d.stratum)))
      .attr("r", 4.2)
      .attr("fill", (d) => classColors[d.stratum] ?? "#6e7781")
      .attr("stroke", "var(--theme-background, #fff)")
      .attr("stroke-width", 1.5)
      .each(function (d) {
        const txt = b.ind.format ? b.ind.format(d.value) : `${d.value.toFixed(1)}`;
        d3.select(this)
          .append("title")
          .text(`${stratumLabels[d.stratum] ?? `Classe ${d.stratum}`}\n${b.ind.label}: ${txt}`);
      });

    g.selectAll("text.classLab")
      .data(classOrder)
      .join("text")
      .attr("class", "classLab")
      .attr("x", 10)
      .attr("y", (d) => y(String(d)))
      .attr("dominant-baseline", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", (d) => classColors[d] ?? "currentColor")
      .text((d) => shortIncomeClassLabel(d, stratumLabels));

    g.selectAll("text.v")
      .data(b.pts)
      .join("text")
      .attr("class", "v")
      .attr("x", (d) => x(d.value) + (d.value >= 0 ? 7 : -7))
      .attr("y", (d) => y(String(d.stratum)))
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", (d) => (d.value >= 0 ? "start" : "end"))
        .attr("font-size", "9.5px")
      .attr("font-weight", "700")
      .attr("fill", "currentColor")
        .attr("stroke", "var(--theme-background, #fff)")
        .attr("stroke-width", 2.4)
        .attr("paint-order", "stroke fill")
        .attr("stroke-linejoin", "round")
      .text((d) => (b.ind.format ? b.ind.format(d.value) : `${d.value.toFixed(1)}`));
  });

      const legendX0 = margin.left + Math.max(8, (innerW - 4 * 125) / 2);
      const legend = svg.append("g").attr("transform", `translate(${legendX0},${height - 8})`);
  classOrder.forEach((s, i) => {
    const x0 = i * 128;
    legend.append("circle").attr("cx", x0).attr("cy", -12).attr("r", 4).attr("fill", classColors[s]);
    legend
      .append("text")
      .attr("x", x0 + 8)
      .attr("y", -12)
      .attr("dominant-baseline", "middle")
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .text(stratumLabels[s] ?? `Classe ${s}`);
  });

  container.append(wrap);
}

/**
 * Visual “recipe” for the health score: weights as horizontal bars (favorable vs risk).
 * @param {HTMLElement} container
 * @param {Array<{ key: string, weight: number, direction: number, label: string, role: string }>} components
 * @param {{ width: number, formulaLine?: string|null }} opts
 */
export function chartHealthScoreComponents(container, components, opts) {
  const width = opts.width ?? 640;
  const formulaLine = opts.formulaLine !== undefined ? opts.formulaLine : null;

  const prot = components.filter((c) => c.role === "protective");
  const risk = components.filter((c) => c.role === "risk");
  const ctx = components.filter((c) => c.role === "context");
  const maxW = d3.max(components, (c) => c.weight) ?? 0.2;

  const rowH = 26;
  const blockGap = 18;
  const headerProt = 22;
  const headerRisk = 22;
  const headerCtx = 22;
  const formLinesForH = formulaLine
    ? splitFootnoteLines(formulaLine, Math.max(40, Math.floor((width - 48) / 5.2)))
    : [];
  const formulaH = formLinesForH.length > 0 ? formLinesForH.length * 13 + 8 : 10;
  const topTitle = 36;
  const margin = { top: topTitle + formulaH, right: 24, bottom: 28, left: 8 };
  const barW = Math.max(200, width - margin.left - margin.right - 200);
  const innerH =
    headerProt +
    prot.length * rowH +
    blockGap +
    headerRisk +
    risk.length * rowH +
    (ctx.length ? blockGap + headerCtx + ctx.length * rowH : 0);
  const height = margin.top + innerH + margin.bottom;

  const colorProt = "#1a7f37";
  const colorRisk = "#cf222e";
  const colorCtx = "#8250df";

  clear(container);
  const wrap = html`<div
    class="inca-chart-wrap"
    style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:var(--theme-foreground,inherit);max-width:${width}px;"
  ></div>`;

  const svg = d3
    .select(wrap)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Composition de l’indice : apports favorables, apports à limiter, puis facteurs hors alimentation (tabac, IMC adultes, sécurité alimentaire, accès aux soins, situation financière). Barres proportionnelles aux poids."
    );

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("fill", "currentColor")
    .text("Variables et poids dans l’indice (alimentation + contexte, Pop3)");

  const formLines = formulaLine
    ? splitFootnoteLines(formulaLine, Math.max(40, Math.floor((width - 32) / 5.2)))
    : [];
  const formG = svg.append("g").attr("transform", `translate(${width / 2},${30})`);
  for (let i = 0; i < formLines.length; i++) {
    formG
      .append("text")
      .attr("x", 0)
      .attr("y", i * 13)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "currentColor")
      .attr("opacity", 0.9)
      .text(formLines[i]);
  }

  const xScale = d3.scaleLinear().domain([0, maxW * 1.05]).range([0, barW]);
  const labelColW = Math.min(198, width - barW - margin.right - 24);

  function drawBlock(y0, title, titleColor, rows, fill) {
    const headerH = 22;
    let y = y0;
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", y + 14)
      .attr("fill", titleColor)
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .text(title);
    y += headerH;
    const gRows = svg.append("g").attr("transform", `translate(${margin.left},${y})`);
    rows.forEach((c, i) => {
      const yy = i * rowH;
      gRows
        .append("text")
        .attr("x", 0)
        .attr("y", yy + rowH / 2)
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("fill", "currentColor")
        .text(c.label);
      gRows
        .append("rect")
        .attr("x", labelColW)
        .attr("y", yy + 5)
        .attr("width", xScale(c.weight))
        .attr("height", rowH - 10)
        .attr("rx", 2)
        .attr("fill", fill)
        .attr("opacity", 0.88);
      gRows
        .append("text")
        .attr("x", labelColW + xScale(c.weight) + 6)
        .attr("y", yy + rowH / 2)
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", "currentColor")
        .text(`${(c.weight * 100).toFixed(0)} %`);
    });
  }

  const yStart = margin.top;
  drawBlock(yStart, "À encourager (s_k = +1)", colorProt, prot, colorProt);
  const yRisk = yStart + headerProt + prot.length * rowH + blockGap;
  drawBlock(yRisk, "À modérer (s_k = −1)", colorRisk, risk, colorRisk);
  if (ctx.length) {
    const yCtx = yRisk + headerRisk + risk.length * rowH + blockGap;
    drawBlock(
      yCtx,
      "Contexte santé / social (s_k = +1, score dérivé ↑ = plus favorable)",
      colorCtx,
      ctx,
      colorCtx
    );
  }

  container.append(wrap);
}
