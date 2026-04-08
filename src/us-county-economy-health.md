---
theme: dashboard
title: US counties — economy & cancer rates (ecological)
toc: false
---

# US county-level economy, social context, and cancer indicators

Exploratory views of **aggregate (county) data** from `src/data/kaggle/`: how **median income**, **poverty**, and related county characteristics line up with **cancer incidence and mortality-related fields** in `cancer_reg.csv`, with **average household size** from `avg-household-size.csv` after an **inner join on geography**.

**Not causal inference.** County-level patterns **must not** be read as effects on individuals (**ecological fallacy**). This folder contains **no dietary or nutrition intake variables**; for diet-related questions, use external sources (e.g. county food environment, BRFSS, NHANES).

### Data and methods (summary)

| Item                  | Detail                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**             | `cancer_reg.csv`, `avg-household-size.csv`; delimiter **comma**.                                                                                                                                                                                                                                  |
| **Join**              | Inner join on **`geography`** (location name, string) after **trim + collapse whitespace**. **`statefips`** / **`countyfips`** (integers identifying state and county) come from `avg-household-size.csv` after merge; **`fips5`** = 5-digit FIPS for cartography (`padStart` on state + county). |
| **Income vs poverty** | **`medincome`** (median household income for the county) and **`povertypercent`** (% living in poverty) are **strongly correlated** (see KPI card); treat them as **overlapping** dimensions.                                                                                                     |
| **Mortality outcome** | **`target_deathrate`**: number of **deaths per 100,000** individuals in the county (data card).                                                                                                                                                                                                   |
| **Incidence outcome** | **`incidencerate`**: present in the CSV as a numeric cancer incidence field; **scaling / age adjustment** should be confirmed on your full source documentation if you need a precise epidemiologic definition.                                                                                   |
| **studypercap**       | **Clinical trials per capita** in the county (data card); descriptive infrastructure proxy, not individual behaviour.                                                                                                                                                                             |
| **Missing values**    | Empty cells in some insurance columns are omitted from pairwise statistics. **Small counties**: interpret **`avganncount`** (average annual count of cancer cases) and **`avgdeathsperyear`** cautiously.                                                                                         |

**Reference:** [County-level cancer dataset (Kaggle)](https://www.kaggle.com/datasets/dannellyz/cancer-incidence-totals-and-rates-per-us-county).

### Variable glossary (project data cards)

**`avg-household-size.csv`**

| Column             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `statefips`        | State identification number (integer).            |
| `countyfips`       | County identification number (integer).           |
| `avghouseholdsize` | Average size of households in the county (float). |
| `geography`        | Location name (string).                           |

**`cancer_reg.csv`** (selected fields used on this page)

| Column                                            | Description                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `geography`                                       | Location name (string).                                                                                                  |
| `avganncount`                                     | Average annual count of cancer cases in the county (numeric).                                                            |
| `avgdeathsperyear`                                | Average number of deaths per year in the county (numeric).                                                               |
| `target_deathrate`                                | Deaths **per 100,000** individuals in the county (numeric).                                                              |
| `incidencerate`                                   | Cancer incidence rate (numeric; see full docs for units / adjustment).                                                   |
| `medincome`                                       | Median household income for the county (numeric).                                                                        |
| `popest2015`                                      | Population estimate for 2015 (numeric).                                                                                  |
| `povertypercent`                                  | Percentage of people living in poverty (numeric).                                                                        |
| `studypercap`                                     | Clinical trials **per capita** in the county (numeric).                                                                  |
| `binnedinc`                                       | Binned income (categorical).                                                                                             |
| `medianage` / `medianagemale` / `medianagefemale` | Median age (total / male / female).                                                                                      |
| `percentmarried`                                  | Percentage married.                                                                                                      |
| Education 18–24 / 25+                             | `pctnohs18_24`, `pcths18_24`, `pctsomecol18_24`, `pctbachdeg18_24`, `pcths25_over`, `pctbachdeg25_over` as in data card. |
| Labour                                            | `pctemployed16_over`, `pctunemployed16_over` — % employed / unemployed (16+).                                            |
| Insurance                                         | `pctprivatecoverage` — % with private health insurance (and related columns in file).                                    |

---

```js
import { parseJoinCountyDetailed, binnedincOrderKey, pearsonPair, correlationCells } from "./components/kaggle-county-prep.js";
import { Legend, Swatches } from "./components/d3-color-legend.js";
import { numericMetricKeys, choroplethMetricLabel, schemeColorsAndInterpolator, makeChoroplethColorScale, renderUsCountyChoropleth, ordinalForSwatches, BASE_W, BASE_H } from "./components/us-county-choropleth.js";
import { createIncomeRangeBrush } from "./components/income-range-brush.js";
import { html } from "npm:htl";

const [cancerText, houseText, countiesTopo] = await Promise.all([FileAttachment("data/kaggle/cancer_reg.csv").text(), FileAttachment("data/kaggle/avg-household-size.csv").text(), FileAttachment("data/kaggle/counties-albers-10m.json").json()]);

const { joined, unmatchedCancer } = parseJoinCountyDetailed(cancerText, houseText);
const joinedByFips = new Map(joined.map((d) => [d.fips5, d]));
const choroplethMetricKeys = numericMetricKeys(joined);

const binnedOrder = [...new Set(joined.map((d) => d.binnedinc).filter(Boolean))].sort((a, b) => binnedincOrderKey(a) - binnedincOrderKey(b));

const rIncomePoverty = pearsonPair(
    joined,
    (r) => r.medincome,
    (r) => r.povertypercent,
);

const popMax = d3.max(joined, (d) => d.popest2015) ?? 1;
function popRadius(d) {
    const p = d.popest2015;
    if (!Number.isFinite(p) || p <= 0) return 3;
    return 2 + 11 * Math.sqrt(p / popMax);
}

const scatterDeath = joined.filter((d) => Number.isFinite(d.medincome) && Number.isFinite(d.target_deathrate) && Number.isFinite(d.popest2015));

const scatterIncidence = joined.filter((d) => Number.isFinite(d.medincome) && Number.isFinite(d.incidencerate) && Number.isFinite(d.popest2015));

/** OLS of log10(y) on log10(x); samples a curve that is a straight line on log–log axes (unlike raw OLS in Plot.linearRegressionY). */
function logLogFitLine(data, xKey, yKey, samples = 160) {
    const rows = data.filter((d) => Number.isFinite(d[xKey]) && Number.isFinite(d[yKey]) && d[xKey] > 0 && d[yKey] > 0);
    if (rows.length < 3) return [];
    const lx = rows.map((d) => Math.log10(d[xKey]));
    const ly = rows.map((d) => Math.log10(d[yKey]));
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < rows.length; i++) {
        sumX += lx[i];
        sumY += ly[i];
        sumXY += lx[i] * ly[i];
        sumX2 += lx[i] * lx[i];
    }
    const nPts = rows.length;
    const denom = nPts * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (nPts * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / nPts;
    const xMin = d3.min(rows, (d) => d[xKey]);
    const xMax = d3.max(rows, (d) => d[xKey]);
    const out = [];
    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const x = xMin + t * (xMax - xMin);
        out.push({ [xKey]: x, [yKey]: Math.pow(10, slope * Math.log10(x) + intercept) });
    }
    return out;
}

const boxDeath = joined.filter((d) => d.binnedinc && Number.isFinite(d.target_deathrate));

/** Short labels for heatmap cells (data-card-aligned). */
const heatVars = [
    { key: "medincome", label: "Median HH income" },
    { key: "povertypercent", label: "% in poverty" },
    { key: "pctbachdeg25_over", label: "% BA+ (25+)" },
    { key: "pctprivatecoverage", label: "% private ins." },
    { key: "pctpubliccoverage", label: "% public ins." },
    { key: "pctunemployed16_over", label: "% unemployed (16+)" },
    { key: "medianage", label: "Median age" },
    { key: "studypercap", label: "Trials per capita" },
    { key: "target_deathrate", label: "Deaths / 100k" },
    { key: "incidencerate", label: "Incidence rate" },
];

const heatCells = correlationCells(heatVars, joined);

/** Wealth vs health: filtered rows for charts directly under the choropleth. */
const whPovertyDeath = joined.filter((d) => Number.isFinite(d.povertypercent) && Number.isFinite(d.target_deathrate) && Number.isFinite(d.popest2015));
const whPovertyIncidence = joined.filter((d) => Number.isFinite(d.povertypercent) && Number.isFinite(d.incidencerate) && Number.isFinite(d.popest2015));
const whIncomeInsurance = joined.filter((d) => Number.isFinite(d.medincome) && Number.isFinite(d.pctpubliccoverage) && Number.isFinite(d.pctprivatecoverage));
const whIncomeEmployed = joined.filter((d) => Number.isFinite(d.medincome) && Number.isFinite(d.pctemployed16_over));
const whIncomeEmpPrivCov = joined.filter((d) => Number.isFinite(d.medincome) && Number.isFinite(d.pctempprivcoverage));

/** Pearson r summary: wealth-related × health-related county aggregates (ecological). */
const wealthHealthPearsonTopN = 8;
const wealthHealthPearsonForPlot = [
    {
        label: "Median income × deaths / 100k",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.target_deathrate,
        ),
    },
    {
        label: "Median income × incidence rate",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.incidencerate,
        ),
    },
    {
        label: "Poverty % × deaths / 100k",
        r: pearsonPair(
            joined,
            (r) => r.povertypercent,
            (r) => r.target_deathrate,
        ),
    },
    {
        label: "Poverty % × incidence rate",
        r: pearsonPair(
            joined,
            (r) => r.povertypercent,
            (r) => r.incidencerate,
        ),
    },
    {
        label: "Median income × % private insurance",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.pctprivatecoverage,
        ),
    },
    {
        label: "Median income × % unemployed (16+)",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.pctunemployed16_over,
        ),
    },
    {
        label: "Poverty % × % unemployed (16+)",
        r: pearsonPair(
            joined,
            (r) => r.povertypercent,
            (r) => r.pctunemployed16_over,
        ),
    },
    {
        label: "Median income × trials per capita",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.studypercap,
        ),
    },
    {
        label: "Median income × median age",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.medianage,
        ),
    },
    {
        label: "Median income × avg deaths / year (count)",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.avgdeathsperyear,
        ),
    },
    {
        label: "Median income × avg cases / year (count)",
        r: pearsonPair(
            joined,
            (r) => r.medincome,
            (r) => r.avganncount,
        ),
    },
]
    .filter((d) => Number.isFinite(d.r))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, wealthHealthPearsonTopN);

const medincomeExtent = (() => {
    const vals = joined.map((d) => d.medincome).filter(Number.isFinite);
    return [d3.min(vals) ?? 0, d3.max(vals) ?? 1];
})();
```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Joined counties</h2>
    <span class="big">${joined.length.toLocaleString("en-US")}</span>
    <span class="muted">inner join on <code>geography</code></span>
  </div>
  <div class="card">
    <h2><i>r</i> (median income × poverty)</h2>
    <span class="big">${rIncomePoverty.toFixed(2)}</span>
    <span class="muted"><code>medincome</code> vs <code>povertypercent</code> (Pearson)</span>
  </div>
  <div class="card">
    <h2>Income bins</h2>
    <span class="big">${binnedOrder.length}</span>
    <span class="muted"><code>binnedinc</code> (binned median income)</span>
  </div>
  <div class="card">
    <h2>Nutrition data</h2>
    <span class="big">—</span>
    <span class="muted">not in <code>kaggle/</code></span>
  </div>
</div>

---

## County choropleth (counties and states)

Join on **`geography`**; 5-digit FIPS: `String(statefips).padStart(2,"0") + String(countyfips).padStart(3,"0")` (**`fips5`**). Geometry: [us-atlas](https://github.com/topojson/us-atlas) `counties-albers-10m` (Albers USA). **Legend**: `Legend` + **`Swatches`** ([@d3/color-legend](https://observablehq.com/@d3/color-legend), implemented in `src/components/d3-color-legend.js`).

```js
const choroMetric = view(
    Inputs.select(choroplethMetricKeys, {
        label: "Metric",
        format: choroplethMetricLabel,
        value: choroplethMetricKeys.includes("target_deathrate") ? "target_deathrate" : choroplethMetricKeys[0],
    }),
);
```

```js
const choroScaleType = view(
    Inputs.radio(["Sequential", "Quantize", "Quantile"], {
        label: "Scale type",
        value: "Quantile",
    }),
);
```

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) => {
        const schemeParts = schemeColorsAndInterpolator("YlOrRd");
        const values = joined.map((d) => d[choroMetric]);
        const { scale: colorScale } = makeChoroplethColorScale(choroScaleType, values, schemeParts);
        const svgEl = renderUsCountyChoropleth({
          joinedByFips,
          topo: countiesTopo,
          metricKey: choroMetric,
          colorScale
        });
        const scaleW = Math.min(360, width - 32);
        const legendEl =
          colorScale && typeof colorScale === "function"
            ? Legend(
                colorScale && typeof colorScale.copy === "function" ? colorScale.copy() : colorScale,
                {
                  title: choroplethMetricLabel(choroMetric),
                  width: scaleW,
                  tickFormat: ",.1f",
                  values
                }
              )
            : null;
        const ordSw = ordinalForSwatches(
          colorScale && typeof colorScale.copy === "function" ? colorScale.copy() : colorScale,
          choroScaleType
        );
        const swEl = ordSw ? Swatches(ordSw, { columns: width > 640 ? "240px" : "100%" }) : null;
        const wrap = html`<div
          style="position:relative;width:100%;font-family:var(--sans-serif)"
        ></div>`;
        const tip = html`<div
          class="choro-tip"
          style="display:none;position:absolute;z-index:10;pointer-events:none;padding:6px 10px;font-size:12px;line-height:1.35;background:var(--theme-background);border:1px solid var(--theme-foreground-muted);border-radius:4px;box-shadow:0 2px 8px #0002;max-width:min(320px,90vw);white-space:pre-wrap"
        ></div>`;
        const aspect = BASE_H / BASE_W;
        const mapW = width;
        const mapH = mapW * aspect;
        const mapBox = html`<div style="width:${mapW}px;max-width:100%;margin:0 auto;position:relative"></div>`;
        svgEl.setAttribute("width", mapW);
        svgEl.setAttribute("height", mapH);
        svgEl.style.width = "100%";
        svgEl.style.height = "auto";
        mapBox.append(svgEl);
        mapBox.append(tip);
        wrap.append(mapBox);
        if (legendEl) {
          wrap.append(html`<div style="margin-top:12px">
            ${legendEl}
            <p class="muted" style="font-size:12px;line-height:1.35;margin:8px 0 0;max-width:${scaleW}px">
              Bar width follows the data: each band’s length matches that color’s share of counties (quantize/quantile), and the sequential gradient is stretched by the empirical distribution of values.
            </p>
          </div>`);
        }
        if (swEl) wrap.append(html`<div style="margin-top:10px" class="muted"><strong>Swatches</strong></div>`, swEl);
        d3.select(svgEl)
          .selectAll(".county-polygon")
          .style("cursor", "pointer")
          .on("mousemove", function (event) {
            const name = this.getAttribute("data-name") || "—";
            const raw = this.getAttribute("data-value");
            const v = raw === "" ? NaN : Number(raw);
            const val = Number.isFinite(v)
              ? v.toLocaleString("en-US", { maximumFractionDigits: 4 })
              : "No data";
            tip.textContent = `${name}\n${choroplethMetricLabel(choroMetric)}: ${val}`;
            tip.style.display = "block";
            const rect = mapBox.getBoundingClientRect();
            tip.style.left = `${event.clientX - rect.left + 12}px`;
            tip.style.top = `${event.clientY - rect.top + 12}px`;
          })
          .on("mouseleave", () => {
            tip.style.display = "none";
          });
        return wrap;
      })
    }
  </div>
</div>

## How is county wealth associated with health-related metrics?

**County-level associations only** (ecological data). **OLS regression lines** (95% CI band) and **Pearson _r_** are exploratory and **not causal**. Where stated, dot **area** scales with **2015 population** (`popest2015`).

**Median household income range** (control below): one line — drag the **end handles** to widen or narrow the window, or drag the **blue band** to slide the whole range along the axis. Counties outside the interval are hidden on income-axis scatters.

```js
const incomeZoom = view(createIncomeRangeBrush(medincomeExtent, { step: 500 }));
```

```js
function medincomeZoomDomain() {
    const r = incomeZoom;
    if (!r || !Number.isFinite(r.from) || !Number.isFinite(r.to)) return medincomeExtent;
    const lo = Math.min(r.from, r.to);
    const hi = Math.max(r.from, r.to);
    return [lo, hi];
}

function filterByMedincome(rows) {
    const [lo, hi] = medincomeZoomDomain();
    return rows.filter((d) => Number.isFinite(d.medincome) && d.medincome >= lo && d.medincome <= hi);
}
```

<div class="grid grid-cols-2">
  <div class="card">
    ${
      resize((width) => {
        const deathF = filterByMedincome(scatterDeath);
        return Plot.plot({
          title: "Median household income vs cancer death rate",
          subtitle: `n = ${deathF.length} counties · deaths per 100,000 (data card)`,
          width,
          height: 360,
          grid: true,
          x: { label: "Median household income (USD)", domain: medincomeZoomDomain(), nice: true },
          y: { label: "Cancer deaths per 100,000" },
          marks: [
            ...(deathF.length >= 2
              ? [
                  Plot.linearRegressionY(deathF, {
                    x: "medincome",
                    y: "target_deathrate",
                    stroke: "var(--theme-foreground-muted)",
                    strokeWidth: 1.5,
                    ci: 0.95
                  })
                ]
              : []),
            Plot.dot(deathF, {
              x: "medincome",
              y: "target_deathrate",
              r: popRadius,
              fill: "var(--theme-foreground-focus)",
              fillOpacity: 0.55,
              stroke: "white",
              strokeWidth: 0.4,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  target_deathrate: true,
                  popest2015: true,
                  povertypercent: true
                }
              }
            })
          ]
        });
      })
    }
  </div>
  <div class="card">
    ${
      resize((width) => {
        const incF = filterByMedincome(scatterIncidence);
        const incFit = logLogFitLine(incF, "medincome", "incidencerate");
        const [xLo, xHi] = medincomeZoomDomain();
        const logXDomain = [Math.max(xLo, 1), Math.max(xHi, Math.max(xLo, 1) + 1)];
        return Plot.plot({
          title: "Median household income vs cancer incidence rate",
          subtitle: `n = ${incF.length} counties · log–log; trend = OLS on log₁₀(income) and log₁₀(incidence) for counties in range; confirm incidence units in full documentation`,
          width,
          height: 360,
          grid: true,
          x: {
            type: "log",
            label: "Median household income (USD)",
            tickFormat: ",~s",
            domain: logXDomain
          },
          y: {
            type: "log",
            label: "Cancer incidence rate (dataset field)",
            tickFormat: ",~f"
          },
          marks: [
            ...(incFit.length
              ? [
                  Plot.line(incFit, {
                    x: "medincome",
                    y: "incidencerate",
                    stroke: "var(--theme-foreground-muted)",
                    strokeWidth: 1.5
                  })
                ]
              : []),
            Plot.dot(incF, {
              x: "medincome",
              y: "incidencerate",
              r: popRadius,
              fill: "#2ca02c",
              fillOpacity: 0.5,
              stroke: "white",
              strokeWidth: 0.4,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  incidencerate: true,
                  popest2015: true
                }
              }
            })
          ]
        });
      })
    }
  </div>
</div>

<div class="grid grid-cols-2">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Poverty rate vs cancer death rate",
          subtitle: `n = ${whPovertyDeath.length} counties · % living in poverty`,
          width,
          height: 360,
          grid: true,
          x: { label: "% of population in poverty" },
          y: { label: "Cancer deaths per 100,000" },
          marks: [
            Plot.linearRegressionY(whPovertyDeath, {
              x: "povertypercent",
              y: "target_deathrate",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(whPovertyDeath, {
              x: "povertypercent",
              y: "target_deathrate",
              r: popRadius,
              fill: "#d62728",
              fillOpacity: 0.5,
              stroke: "white",
              strokeWidth: 0.4,
              tip: {
                format: {
                  geography: true,
                  povertypercent: true,
                  target_deathrate: true,
                  medincome: true,
                  popest2015: true
                }
              }
            })
          ]
        })
      )
    }
  </div>
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Poverty rate vs cancer incidence rate",
          subtitle: `n = ${whPovertyIncidence.length} counties`,
          width,
          height: 360,
          grid: true,
          x: { label: "% of population in poverty" },
          y: { label: "Cancer incidence rate (dataset field)" },
          marks: [
            Plot.linearRegressionY(whPovertyIncidence, {
              x: "povertypercent",
              y: "incidencerate",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(whPovertyIncidence, {
              x: "povertypercent",
              y: "incidencerate",
              r: popRadius,
              fill: "#ff7f0e",
              fillOpacity: 0.5,
              stroke: "white",
              strokeWidth: 0.4,
              tip: {
                format: {
                  geography: true,
                  povertypercent: true,
                  incidencerate: true,
                  popest2015: true
                }
              }
            })
          ]
        })
      )
    }
  </div>
</div>

```js
const incomeInsuranceCoverage = view(
    Inputs.radio(["Public", "Private"], {
        label: "Coverage type",
        value: "Public",
    }),
);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Median income vs % with health insurance</h2>
    <div style="margin:0.35rem 0 0.75rem">${incomeInsuranceCoverage}</div>
    ${
      resize((width) => {
        const insF = filterByMedincome(whIncomeInsurance);
        const isPublic = incomeInsuranceCoverage === "Public";
        const yKey = isPublic ? "pctpubliccoverage" : "pctprivatecoverage";
        const fill = isPublic ? "#17becf" : "#1f77b4";
        const yLabel = isPublic
          ? "% with public health insurance"
          : "% with private health insurance";
        const sourceNote = isPublic
          ? "pctpubliccoverage (data card)"
          : "pctprivatecoverage (data card)";
        return Plot.plot({
          subtitle: `n = ${insF.length} counties · ${sourceNote}`,
          width,
          height: 380,
          grid: true,
          x: { label: "Median household income (USD)", domain: medincomeZoomDomain(), nice: true },
          y: { label: yLabel },
          marks: [
            ...(insF.length >= 2
              ? [
                  Plot.linearRegressionY(insF, {
                    x: "medincome",
                    y: yKey,
                    stroke: fill,
                    strokeWidth: 1.5,
                    ci: 0.95
                  })
                ]
              : []),
            Plot.dot(insF, {
              x: "medincome",
              y: yKey,
              r: 3.5,
              fill,
              fillOpacity: 0.5,
              stroke: "white",
              strokeWidth: 0.35,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  [yKey]: true,
                  povertypercent: true
                }
              }
            })
          ]
        });
      })
    }
  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) => {
        const empF = filterByMedincome(whIncomeEmployed);
        return Plot.plot({
          title: "Median income vs employment rate (16+)",
          subtitle: `n = ${empF.length} counties · pctemployed16_over`,
          width,
          height: 340,
          grid: true,
          x: { label: "Median household income (USD)", domain: medincomeZoomDomain(), nice: true },
          y: { label: "% employed (population 16+)" },
          marks: [
            ...(empF.length >= 2
              ? [
                  Plot.linearRegressionY(empF, {
                    x: "medincome",
                    y: "pctemployed16_over",
                    stroke: "var(--theme-foreground-muted)",
                    strokeWidth: 1.5,
                    ci: 0.95
                  })
                ]
              : []),
            Plot.dot(empF, {
              x: "medincome",
              y: "pctemployed16_over",
              r: 3.5,
              fill: "#2ca02c",
              fillOpacity: 0.45,
              stroke: "white",
              strokeWidth: 0.35,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  pctemployed16_over: true,
                  povertypercent: true
                }
              }
            })
          ]
        });
      })
    }
  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) => {
        const epF = filterByMedincome(whIncomeEmpPrivCov);
        return Plot.plot({
          title: "Median income vs employer-based private coverage",
          subtitle: `n = ${epF.length} counties · pctempprivcoverage`,
          width,
          height: 320,
          grid: true,
          x: { label: "Median household income (USD)", domain: medincomeZoomDomain(), nice: true },
          y: { label: "% with employer-based private coverage" },
          marks: [
            ...(epF.length >= 2
              ? [
                  Plot.linearRegressionY(epF, {
                    x: "medincome",
                    y: "pctempprivcoverage",
                    stroke: "var(--theme-foreground-muted)",
                    strokeWidth: 1.5,
                    ci: 0.95
                  })
                ]
              : []),
            Plot.dot(epF, {
              x: "medincome",
              y: "pctempprivcoverage",
              r: 3.5,
              fill: "#1f9e89",
              fillOpacity: 0.5,
              stroke: "white",
              strokeWidth: 0.35,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  pctempprivcoverage: true,
                  povertypercent: true
                }
              }
            })
          ]
        });
      })
    }
  </div>
</div>

### Unmatched counties (`cancer_reg` rows with no `avg-household-size` match)

After the inner join on **`geography`** (normalized county name: trim and collapsed whitespace), these **`cancer_reg.csv`** rows did not match a household-size row, so they have no **`fips5`** and are excluded from the choropleth.

```js
const unmatchedSample = unmatchedCancer.slice(0, 400);
const unmatchedMore = Math.max(0, unmatchedCancer.length - unmatchedSample.length);
```

<div class="card">
  <p class="muted" style="margin-top:0">
    <strong>${unmatchedCancer.length.toLocaleString("en-US")}</strong> rows in
    <code>cancer_reg.csv</code> with no match · showing the first
    <strong>${unmatchedSample.length}</strong>
    ${unmatchedMore > 0 ? ` · +${unmatchedMore.toLocaleString("en-US")} more…` : ""}
  </p>
  <ul style="margin:0;max-height:220px;overflow:auto;font-size:13px;columns:2;gap:2rem">
    ${unmatchedSample.map((u) => html`<li>${u.geography}</li>`)}
  </ul>
</div>

---

## Stratification by income bin (`binnedinc`)

**`binnedinc`**: binned median income (categorical). Bins ordered by the **numeric lower bound** parsed from each interval label.

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Cancer deaths per 100,000 by binned median income",
          subtitle: "County-level distributions. Y = target_deathrate (data card: deaths per 100k individuals).",
          width,
          height: 440,
          marginBottom: 120,
          grid: true,
          x: {
            label: "Binned median household income (binnedinc)",
            domain: binnedOrder,
            tickRotate: 90
          },
          y: { label: "Cancer deaths per 100,000 individuals" },
          marks: [
            Plot.boxY(boxDeath, { x: "binnedinc", y: "target_deathrate", fill: "var(--theme-foreground-focus)" }),
            Plot.ruleY([0])
          ]
        })
      )
    }
  </div>
</div>

---

## Correlation matrix

Each cell is a **Pearson _r_** between two variables measured **per county**, using **pairwise complete** counties (only rows where both values are finite). That makes this an **ecological** analysis: the statistical unit is the **county** (an aggregate population), not a person.

**Why “ecological”?** In epidemiology and social statistics, _ecological_ means the data are **group-level summaries**—median income, poverty rate, death rate, etc., averaged or totaled over everyone in that county. Correlations then describe how those **aggregates** co-vary across counties. They do **not** answer how income and health line up **within** individuals. An association at county level can be weaker, stronger, or even reversed at the individual level (**ecological fallacy**). Counties also differ along many dimensions at once (age mix, urbanicity, healthcare supply), so **confounding** and **structural coupling** between SES and health variables are expected; these plots are exploratory, not causal.

```js
const labelDomain = heatVars.map((v) => v.label);
/** RdBu-style stops: hot (negative r) → cold (positive r). */
const corrPalette = [
  "#67001f",
  "#b2182b",
  "#d6604d",
  "#f4a582",
  "#fddbc7",
  "#d1e5f0",
  "#92c5de",
  "#4393c3",
  "#2166ac",
  "#053061"
];
const corrColor = Plot.scale({
  color: {
    type: "linear",
    domain: [-1, 1],
    interpolate: d3.piecewise(d3.interpolateRgb, corrPalette),
    label: "Pearson r"
  }
});
```

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "County-level correlation heatmap",
          subtitle:
            "Pearson r between county aggregates: income, poverty, BA+, insurance, unemployment, age, trials/capita, deaths/100k, incidence. Strong overlap between SES variables expected.",
          width: Math.min(width, 800),
          height: 640,
          marginLeft: 138,
          marginBottom: 108,
          x: { domain: labelDomain, label: null, tickRotate: 40 },
          y: { domain: labelDomain, label: null },
          color: corrColor.color,
          marks: [
            Plot.cell(heatCells, {
              x: "xi",
              y: "xj",
              fill: "r",
              inset: 0.5,
              tip: true,
              title: (d) => `r = ${Number.isFinite(d.r) ? d.r.toFixed(3) : "—"}`
            }),
            Plot.text(heatCells, {
              x: "xi",
              y: "xj",
              text: (d) => (Number.isFinite(d.r) ? d.r.toFixed(2) : ""),
              fill: (d) => (Math.abs(d.r) > 0.55 ? "white" : "var(--theme-foreground)"),
              fontSize: 7
            })
          ]
        })
      )
    }
  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Pearson r: wealth-related vs health-related county variables",
          subtitle:
            `Top ${wealthHealthPearsonTopN} pairs by |r| (same county-level, pairwise-complete setup as the matrix above). % public insurance omitted alongside % private as a near-complement. Blue = positive, red = negative.`,
          width,
          height: Math.min(520, 36 + wealthHealthPearsonForPlot.length * 34),
          marginLeft: 200,
          x: { label: "Pearson correlation coefficient (r)", domain: [-1, 1] },
          y: { label: null },
          marks: [
            Plot.ruleX([0]),
            Plot.barX(wealthHealthPearsonForPlot, {
              y: "label",
              x: "r",
              fill: (d) => (d.r < 0 ? "#c0392b" : "#2980b9"),
              sort: { y: "-x" }
            }),
            Plot.text(wealthHealthPearsonForPlot, {
              y: "label",
              x: "r",
              text: (d) => d.r.toFixed(2),
              dx: 5,
              textAnchor: "start",
              fontSize: 10
            })
          ]
        })
      )
    }
  </div>
</div>

---

### Small counties

**`avganncount`** and **`avgdeathsperyear`** are **counts**, not rates; small counties can show high volatility. Consider **minimum population** or **minimum case** filters for reporting.
