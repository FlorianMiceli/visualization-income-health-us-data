import * as d3 from "npm:d3";
import * as topojson from "npm:topojson-client";

const BASE_W = 975;
const BASE_H = 610;

const EXCLUDE_METRIC_KEYS = new Set([
  "geography",
  "binnedinc",
  "index",
  "fips5",
  "statefips",
  "countyfips"
]);

/** Human-readable names for choropleth metric keys (data-card aligned). */
const CHOROPLETH_METRIC_LABELS = {
  avghouseholdsize: "Average household size",
  avganncount: "Average annual cancer cases (count)",
  avgdeathsperyear: "Average cancer deaths per year",
  target_deathrate: "Death rate (per 100,000 people)",
  incidencerate: "Cancer incidence rate",
  medincome: "Median household income",
  popest2015: "Population (2015 estimate)",
  povertypercent: "People living in poverty (%)",
  studypercap: "Clinical trials per capita",
  medianage: "Median age (population)",
  medianagemale: "Median age (male)",
  medianagefemale: "Median age (female)",
  percentmarried: "Married (% of population)",
  pctnohs18_24: "No high school diploma, ages 18–24 (%)",
  pcths18_24: "High school graduate, ages 18–24 (%)",
  pctsomecol18_24: "Some college, ages 18–24 (%)",
  pctbachdeg18_24: "Bachelor's degree, ages 18–24 (%)",
  pcths25_over: "High school graduate, age 25+ (%)",
  pctbachdeg25_over: "Bachelor's degree, age 25+ (%)",
  pctemployed16_over: "Employed, age 16+ (%)",
  pctunemployed16_over: "Unemployed, age 16+ (%)",
  pctprivatecoverage: "Private health insurance (%)",
  pctprivatecoveragealone: "Private health insurance only (%)",
  pctempprivcoverage: "Employer-based private coverage (%)",
  pctpubliccoverage: "Public health insurance (%)",
  pctpubliccoveragealone: "Public health insurance only (%)",
  pctwhite: "White alone (% of population)",
  pctblack: "Black alone (% of population)",
  pctasian: "Asian alone (% of population)",
  pctotherrace: "Other race (% of population)",
  pctmarriedhouseholds: "Married households (%)",
  birthrate: "Birth rate"
};

/**
 * Display label for a choropleth metric column (for filters, legend, tooltips).
 * @param {string} key
 */
export function choroplethMetricLabel(key) {
  if (Object.prototype.hasOwnProperty.call(CHOROPLETH_METRIC_LABELS, key)) {
    return CHOROPLETH_METRIC_LABELS[key];
  }
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Keys that have at least one finite numeric value in `rows`. */
export function numericMetricKeys(rows, extraExclude = []) {
  const ex = new Set([...EXCLUDE_METRIC_KEYS, ...extraExclude]);
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]).filter((k) => !ex.has(k));
  const out = [];
  for (const key of keys) {
    const ok = rows.some((r) => Number.isFinite(r[key]));
    if (ok) out.push(key);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function schemeColorsAndInterpolator(schemeShortName) {
  const cap = schemeShortName.charAt(0).toUpperCase() + schemeShortName.slice(1);
  const schemeKey = `scheme${cap}`;
  const interpKey = `interpolate${cap}`;
  const schemeObj = d3[schemeKey];
  const interpolate = d3[interpKey];
  const colors9 =
    (schemeObj && schemeObj[9]) ||
    (schemeObj && schemeObj[schemeObj.length - 1]);
  return { colors9, interpolate };
}

/**
 * @param {"Sequential"|"Quantize"|"Quantile"} scaleType
 * @param {number[]} values finite values only
 * @param {{ colors9: string[], interpolate: (t: number) => string }} parts
 */
export function makeChoroplethColorScale(scaleType, values, parts) {
  const { colors9, interpolate } = parts;
  const clean = values.filter((v) => Number.isFinite(v));
  const [lo, hi] = d3.extent(clean);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { scale: null, error: "no finite values" };
  }
  if (lo === hi && scaleType !== "Quantile" && typeof interpolate === "function") {
    const pad = Math.abs(lo) > 0 ? Math.abs(lo) * 1e-9 : 1e-6;
    return { scale: d3.scaleSequential(interpolate).domain([lo - pad, lo + pad]), error: null };
  }
  if (lo === hi && scaleType !== "Quantile") {
    const mid = colors9[Math.floor(colors9.length / 2)];
    return { scale: d3.scaleQuantize().domain([lo - 1, lo + 1]).range([mid]), error: null };
  }
  if (scaleType === "Sequential" && typeof interpolate === "function") {
    return { scale: d3.scaleSequential(interpolate).domain([lo, hi]), error: null };
  }
  if (!colors9 || !colors9.length) {
    return { scale: null, error: "missing scheme" };
  }
  if (scaleType === "Quantize") {
    return { scale: d3.scaleQuantize().domain([lo, hi]).range(colors9), error: null };
  }
  if (scaleType === "Quantile") {
    if (clean.length < colors9.length) {
      const r = colors9.slice(0, Math.max(2, clean.length));
      return { scale: d3.scaleQuantile().domain(clean).range(r), error: null };
    }
    return { scale: d3.scaleQuantile().domain(clean).range(colors9), error: null };
  }
  if (typeof interpolate === "function") {
    return { scale: d3.scaleSequential(interpolate).domain([lo, hi]), error: null };
  }
  return { scale: d3.scaleQuantize().domain([lo, hi]).range(colors9), error: null };
}

/**
 * @returns {SVGElement}
 */
export function renderUsCountyChoropleth({
  joinedByFips,
  topo,
  metricKey,
  colorScale,
  noDataFill = "var(--theme-background-alt, #eee)"
}) {
  const countiesFc = topojson.feature(topo, topo.objects.counties);
  const countyMesh = topojson.mesh(topo, topo.objects.counties, (a, b) => a !== b);
  const stateMesh = topojson.mesh(topo, topo.objects.states, (a, b) => a !== b);

  const path = d3.geoPath(d3.geoIdentity());

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, BASE_W, BASE_H])
    .attr("width", BASE_W)
    .attr("height", BASE_H)
    .style("max-width", "100%")
    .style("height", "auto")
    .attr("role", "img")
    .attr("aria-label", "US county choropleth map");

  const g = svg.append("g").attr("class", "counties-layer");

  for (const feature of countiesFc.features) {
    const id = feature.id;
    const row = joinedByFips.get(id);
    const v = row ? row[metricKey] : NaN;
    const fill =
      row && Number.isFinite(v) && colorScale ? colorScale(v) : noDataFill;

    g.append("path")
      .datum(feature)
      .attr("fill", fill)
      .attr("d", path)
      .attr("stroke", "none")
      .attr("class", "county-polygon")
      .attr("data-fips", id)
      .attr("data-name", row && row.geography ? row.geography : "")
      .attr("data-value", Number.isFinite(v) ? String(v) : "");
  }

  svg
    .append("path")
    .datum(countyMesh)
    .attr("fill", "none")
    .attr("stroke", "var(--theme-foreground-muted, #888)")
    .attr("stroke-width", 0.35)
    .attr("stroke-linejoin", "round")
    .attr("d", path)
    .attr("pointer-events", "none");

  svg
    .append("path")
    .datum(stateMesh)
    .attr("fill", "none")
    .attr("stroke", "var(--theme-foreground, #222)")
    .attr("stroke-width", 0.9)
    .attr("stroke-linejoin", "round")
    .attr("d", path)
    .attr("pointer-events", "none");

  return svg.node();
}

/**
 * Build an ordinal color scale for {@link Swatches} from a numeric choropleth scale.
 */
export function ordinalForSwatches(scale, scaleType) {
  if (!scale) return null;
  if (scaleType === "Sequential") {
    const dom = scale.domain();
    const d0 = dom[0];
    const d1 = dom[1];
    if (!Number.isFinite(d0) || !Number.isFinite(d1)) return null;
    const lo = Math.min(d0, d1);
    const hi = Math.max(d0, d1);
    const ticks = d3.ticks(lo, hi, 6);
    const labels = ticks.map((t) => t.toLocaleString("en-US", { maximumFractionDigits: 2 }));
    const colors = ticks.map((t) => scale(t));
    return d3.scaleOrdinal().domain(labels).range(colors);
  }
  const colors = scale.range();
  if (!colors || !colors.length) return null;
  if (typeof scale.quantiles === "function") {
    const q = scale.quantiles();
    const labels = q.map((x) => x.toLocaleString("en-US", { maximumFractionDigits: 2 }));
    return d3.scaleOrdinal().domain(labels).range(colors.slice(0, labels.length));
  }
  if (typeof scale.thresholds === "function") {
    const t = scale.thresholds();
    const labels = t.map((x) => x.toLocaleString("en-US", { maximumFractionDigits: 2 }));
    return d3.scaleOrdinal().domain(labels).range(colors.slice(0, labels.length));
  }
  return d3
    .scaleOrdinal()
    .domain(colors.map((_, i) => `Class ${i + 1}`))
    .range(colors);
}

export { BASE_W, BASE_H };
