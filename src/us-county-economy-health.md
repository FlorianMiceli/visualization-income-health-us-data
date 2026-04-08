---
theme: dashboard
title: US counties — economy & cancer rates (ecological)
toc: false
---

# US county-level economy, social context, and cancer indicators

Exploratory views of **aggregate (county) data** from `src/data/kaggle/`: how **median income**, **poverty**, and related county characteristics line up with **cancer incidence and mortality-related fields** in `cancer_reg.csv`, with **average household size** from `avg-household-size.csv` after an **inner join on geography**.

**Not causal inference.** County-level patterns **must not** be read as effects on individuals (**ecological fallacy**). This folder contains **no dietary or nutrition intake variables**; for diet-related questions, use external sources (e.g. county food environment, BRFSS, NHANES).

### Data and methods (summary)

| Item | Detail |
|------|--------|
| **Files** | `cancer_reg.csv`, `avg-household-size.csv`; delimiter **comma**. |
| **Join** | Inner join on **`geography`** (location name, string) after **trim + collapse whitespace**. **`statefips`** / **`countyfips`** (integers identifying state and county) come from `avg-household-size.csv` after merge; **`fips5`** = 5-digit FIPS for cartography (`padStart` on state + county). |
| **Income vs poverty** | **`medincome`** (median household income for the county) and **`povertypercent`** (% living in poverty) are **strongly correlated** (see KPI card); treat them as **overlapping** dimensions. |
| **Mortality outcome** | **`target_deathrate`**: number of **deaths per 100,000** individuals in the county (data card). |
| **Incidence outcome** | **`incidencerate`**: present in the CSV as a numeric cancer incidence field; **scaling / age adjustment** should be confirmed on your full source documentation if you need a precise epidemiologic definition. |
| **studypercap** | **Clinical trials per capita** in the county (data card); descriptive infrastructure proxy, not individual behaviour. |
| **Missing values** | Empty cells in some insurance columns are omitted from pairwise statistics. **Small counties**: interpret **`avganncount`** (average annual count of cancer cases) and **`avgdeathsperyear`** cautiously. |

**Reference:** [County-level cancer dataset (Kaggle)](https://www.kaggle.com/datasets/dannellyz/cancer-incidence-totals-and-rates-per-us-county).

### Variable glossary (project data cards)

**`avg-household-size.csv`**

| Column | Description |
|--------|-------------|
| `statefips` | State identification number (integer). |
| `countyfips` | County identification number (integer). |
| `avghouseholdsize` | Average size of households in the county (float). |
| `geography` | Location name (string). |

**`cancer_reg.csv`** (selected fields used on this page)

| Column | Description |
|--------|-------------|
| `geography` | Location name (string). |
| `avganncount` | Average annual count of cancer cases in the county (numeric). |
| `avgdeathsperyear` | Average number of deaths per year in the county (numeric). |
| `target_deathrate` | Deaths **per 100,000** individuals in the county (numeric). |
| `incidencerate` | Cancer incidence rate (numeric; see full docs for units / adjustment). |
| `medincome` | Median household income for the county (numeric). |
| `popest2015` | Population estimate for 2015 (numeric). |
| `povertypercent` | Percentage of people living in poverty (numeric). |
| `studypercap` | Clinical trials **per capita** in the county (numeric). |
| `binnedinc` | Binned income (categorical). |
| `medianage` / `medianagemale` / `medianagefemale` | Median age (total / male / female). |
| `percentmarried` | Percentage married. |
| Education 18–24 / 25+ | `pctnohs18_24`, `pcths18_24`, `pctsomecol18_24`, `pctbachdeg18_24`, `pcths25_over`, `pctbachdeg25_over` as in data card. |
| Labour | `pctemployed16_over`, `pctunemployed16_over` — % employed / unemployed (16+). |
| Insurance | `pctprivatecoverage` — % with private health insurance (and related columns in file). |

---

```js
import {
  parseJoinCountyDetailed,
  binnedincOrderKey,
  pearsonPair,
  correlationCells
} from "./components/kaggle-county-prep.js";
import { Legend, Swatches } from "./components/d3-color-legend.js";
import {
  numericMetricKeys,
  choroplethMetricLabel,
  COLOR_SCHEME_OPTIONS,
  schemeColorsAndInterpolator,
  makeChoroplethColorScale,
  renderUsCountyChoropleth,
  ordinalForSwatches,
  BASE_W,
  BASE_H
} from "./components/us-county-choropleth.js";
import { html } from "npm:htl";

const [cancerText, houseText, countiesTopo] = await Promise.all([
  FileAttachment("data/kaggle/cancer_reg.csv").text(),
  FileAttachment("data/kaggle/avg-household-size.csv").text(),
  FileAttachment("data/kaggle/counties-albers-10m.json").json()
]);

const { joined, unmatchedCancer } = parseJoinCountyDetailed(cancerText, houseText);
const joinedByFips = new Map(joined.map((d) => [d.fips5, d]));
const choroplethMetricKeys = numericMetricKeys(joined);

const binnedOrder = [...new Set(joined.map((d) => d.binnedinc).filter(Boolean))].sort(
  (a, b) => binnedincOrderKey(a) - binnedincOrderKey(b)
);

const rIncomePoverty = pearsonPair(joined, (r) => r.medincome, (r) => r.povertypercent);

const popMax = d3.max(joined, (d) => d.popest2015) ?? 1;
function popRadius(d) {
  const p = d.popest2015;
  if (!Number.isFinite(p) || p <= 0) return 3;
  return 2 + 11 * Math.sqrt(p / popMax);
}

const scatterDeath = joined.filter(
  (d) =>
    Number.isFinite(d.medincome) &&
    Number.isFinite(d.target_deathrate) &&
    Number.isFinite(d.popest2015)
);

const scatterIncidence = joined.filter(
  (d) =>
    Number.isFinite(d.medincome) &&
    Number.isFinite(d.incidencerate) &&
    Number.isFinite(d.popest2015)
);

const boxDeath = joined.filter(
  (d) => d.binnedinc && Number.isFinite(d.target_deathrate)
);

const boxIncidence = joined.filter((d) => d.binnedinc && Number.isFinite(d.incidencerate));

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
  { key: "incidencerate", label: "Incidence rate" }
];

const heatCells = correlationCells(heatVars, joined);

const householdScatter = joined.filter(
  (d) =>
    Number.isFinite(d.avghouseholdsize) &&
    Number.isFinite(d.medincome) &&
    Number.isFinite(d.povertypercent)
);

const studyDeath = joined.filter(
  (d) =>
    Number.isFinite(d.studypercap) &&
    Number.isFinite(d.target_deathrate) &&
    Number.isFinite(d.popest2015) &&
    Number.isFinite(d.povertypercent)
);

const unempPoverty = joined.filter(
  (d) => Number.isFinite(d.pctunemployed16_over) && Number.isFinite(d.povertypercent)
);

const privateIncome = joined.filter(
  (d) => Number.isFinite(d.pctprivatecoverage) && Number.isFinite(d.medincome)
);

const casesPop = joined.filter(
  (d) =>
    Number.isFinite(d.avganncount) &&
    Number.isFinite(d.popest2015) &&
    Number.isFinite(d.target_deathrate)
);

const marriedIncome = joined.filter(
  (d) => Number.isFinite(d.percentmarried) && Number.isFinite(d.medincome)
);
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

## Carte choroplèthe (counties & États)

Jointure sur **`geography`**, code FIPS à 5 chiffres : `String(statefips).padStart(2,"0") + String(countyfips).padStart(3,"0")` (colonne **`fips5`**). Géométrie : [us-atlas](https://github.com/topojson/us-atlas) `counties-albers-10m` (projection Albers USA). **Légende** : `Legend` + **`Swatches`** (API du notebook [@d3/color-legend](https://observablehq.com/@d3/color-legend), code dans `src/components/d3-color-legend.js`).

```js
const choroMetric = view(
  Inputs.select(choroplethMetricKeys, {
    label: "Metric",
    format: choroplethMetricLabel,
    value: choroplethMetricKeys.includes("target_deathrate")
      ? "target_deathrate"
      : choroplethMetricKeys[0]
  })
);
```

```js
const choroPalette = view(
  Inputs.select(COLOR_SCHEME_OPTIONS, {
    label: "Color palette",
    format: (d) => d.label,
    value: COLOR_SCHEME_OPTIONS[0]
  })
);
```

```js
const choroScaleType = view(
  Inputs.radio(["Sequential", "Quantize", "Quantile"], {
    label: "Scale type",
    value: "Quantile"
  })
);
```

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) => {
        const schemeParts = schemeColorsAndInterpolator(choroPalette.scheme);
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
                { title: choroplethMetricLabel(choroMetric), width: scaleW, tickFormat: ",~f" }
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
        if (legendEl) wrap.append(html`<div style="margin-top:12px">${legendEl}</div>`);
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

### Comtés sans correspondance (cancer_reg sans ligne avg-household-size)

Après jointure interne sur **`geography`** (chaîne normalisée : trim + espaces), les comtés suivants n’ont **pas** de FIPS reconstruit (pas dans la carte colorée).

```js
const unmatchedSample = unmatchedCancer.slice(0, 400);
const unmatchedMore = Math.max(0, unmatchedCancer.length - unmatchedSample.length);
```

<div class="card">
  <p class="muted" style="margin-top:0">
    <strong>${unmatchedCancer.length.toLocaleString("en-US")}</strong> lignes de
    <code>cancer_reg.csv</code> sans match · affichage des
    <strong>${unmatchedSample.length}</strong> premières
    ${unmatchedMore > 0 ? ` · +${unmatchedMore} autres…` : ""}
  </p>
  <ul style="margin:0;max-height:220px;overflow:auto;font-size:13px;columns:2;gap:2rem">
    ${unmatchedSample.map((u) => html`<li>${u.geography}</li>`)}
  </ul>
</div>

---

## Income vs cancer outcomes (scatter)

Point **area** scales with **`popest2015`** (population estimate, 2015). **OLS line** + shaded band: exploratory fit only, not causal.

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Median household income vs cancer death rate",
          subtitle: `n = ${scatterDeath.length} counties. Death rate = deaths per 100,000 individuals (data card). Source: cancer_reg.csv.`,
          width,
          height: 420,
          grid: true,
          x: { label: "Median household income for the county (USD)" },
          y: { label: "Cancer deaths per 100,000 individuals" },
          marks: [
            Plot.linearRegressionY(scatterDeath, {
              x: "medincome",
              y: "target_deathrate",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(scatterDeath, {
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
          title: "Median household income vs cancer incidence rate",
          subtitle: `n = ${scatterIncidence.length} counties. incidencerate = numeric incidence field in file (confirm units on full data card).`,
          width,
          height: 420,
          grid: true,
          x: { label: "Median household income for the county (USD)" },
          y: { label: "Cancer incidence rate (as in dataset)" },
          marks: [
            Plot.linearRegressionY(scatterIncidence, {
              x: "medincome",
              y: "incidencerate",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(scatterIncidence, {
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
        })
      )
    }
  </div>
</div>

---

## Labour market, insurance, and research infrastructure

Variables below follow the **cancer_reg.csv** data card: **% employed / unemployed (16+)**, **% with private health insurance**, **clinical trials per capita**.

<div class="grid grid-cols-2">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Unemployment vs poverty",
          subtitle: `n = ${unempPoverty.length}. % unemployed (16+) vs % living in poverty.`,
          width,
          height: 380,
          grid: true,
          x: { label: "% unemployed (population 16 and over)" },
          y: { label: "% living in poverty" },
          marks: [
            Plot.linearRegressionY(unempPoverty, {
              x: "pctunemployed16_over",
              y: "povertypercent",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(unempPoverty, {
              x: "pctunemployed16_over",
              y: "povertypercent",
              stroke: "white",
              strokeWidth: 0.35,
              fill: "#7f7f7f",
              fillOpacity: 0.55,
              r: 3.5,
              tip: {
                format: {
                  geography: true,
                  pctunemployed16_over: true,
                  povertypercent: true,
                  medincome: true
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
          title: "Private health insurance vs median income",
          subtitle: `n = ${privateIncome.length}. % with private health insurance (data card).`,
          width,
          height: 380,
          grid: true,
          x: { label: "Median household income for the county (USD)" },
          y: { label: "% with private health insurance" },
          marks: [
            Plot.linearRegressionY(privateIncome, {
              x: "medincome",
              y: "pctprivatecoverage",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(privateIncome, {
              x: "medincome",
              y: "pctprivatecoverage",
              stroke: "white",
              strokeWidth: 0.35,
              fill: "#1f77b4",
              fillOpacity: 0.5,
              r: 3.5,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  pctprivatecoverage: true,
                  povertypercent: true
                }
              }
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
          title: "Clinical trials per capita vs cancer death rate",
          subtitle: `n = ${studyDeath.length}. studypercap = clinical trials per capita (data card). Point size ∝ 2015 population. Long right tail on trial intensity.`,
          width,
          height: 420,
          grid: true,
          x: { label: "Clinical trials per capita (studypercap)" },
          y: { label: "Cancer deaths per 100,000 individuals" },
          color: {
            label: "% living in poverty",
            scheme: "YlOrRd",
            legend: true
          },
          marks: [
            Plot.linearRegressionY(studyDeath, {
              x: "studypercap",
              y: "target_deathrate",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(studyDeath, {
              x: "studypercap",
              y: "target_deathrate",
              r: popRadius,
              fill: "povertypercent",
              fillOpacity: 0.6,
              stroke: "white",
              strokeWidth: 0.4,
              tip: {
                format: {
                  geography: true,
                  studypercap: true,
                  target_deathrate: true,
                  povertypercent: true,
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

---

## Case counts, population, and marriage

**`avganncount`**: average annual count of cancer cases. **`avgdeathsperyear`**: average deaths per year. **`percentmarried`**: % married (data card).

<div class="grid grid-cols-2">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Average annual cancer cases vs population (2015)",
          subtitle: `n = ${casesPop.length}. Colour = cancer deaths per 100,000. Size ∝ population.`,
          width,
          height: 400,
          grid: true,
          x: { label: "Population estimate (2015)" },
          y: { label: "Average annual count of cancer cases" },
          color: {
            label: "Deaths per 100k",
            scheme: "Reds",
            legend: true
          },
          marks: [
            Plot.dot(casesPop, {
              x: "popest2015",
              y: "avganncount",
              r: popRadius,
              fill: "target_deathrate",
              fillOpacity: 0.65,
              stroke: "white",
              strokeWidth: 0.35,
              tip: {
                format: {
                  geography: true,
                  popest2015: true,
                  avganncount: true,
                  target_deathrate: true,
                  avgdeathsperyear: true
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
          title: "% married vs median household income",
          subtitle: `n = ${marriedIncome.length}. percentmarried from data card.`,
          width,
          height: 400,
          grid: true,
          x: { label: "Median household income for the county (USD)" },
          y: { label: "% of people who are married" },
          marks: [
            Plot.linearRegressionY(marriedIncome, {
              x: "medincome",
              y: "percentmarried",
              stroke: "var(--theme-foreground-muted)",
              strokeWidth: 1.5,
              ci: 0.95
            }),
            Plot.dot(marriedIncome, {
              x: "medincome",
              y: "percentmarried",
              stroke: "white",
              strokeWidth: 0.35,
              fill: "#9467bd",
              fillOpacity: 0.55,
              r: 3.5,
              tip: {
                format: {
                  geography: true,
                  medincome: true,
                  percentmarried: true,
                  povertypercent: true
                }
              }
            })
          ]
        })
      )
    }
  </div>
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

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Cancer incidence rate by binned median income",
          subtitle: "County-level distributions. Y = incidencerate (numeric; confirm scaling on full data card).",
          width,
          height: 440,
          marginBottom: 120,
          grid: true,
          x: {
            label: "Binned median household income (binnedinc)",
            domain: binnedOrder,
            tickRotate: 90
          },
          y: { label: "Cancer incidence rate (as in dataset)" },
          marks: [
            Plot.boxY(boxIncidence, { x: "binnedinc", y: "incidencerate", fill: "#2ca02c" }),
            Plot.ruleY([0])
          ]
        })
      )
    }
  </div>
</div>

---

## Ecological correlation matrix

**Pearson** correlations on **pairwise complete** observations across counties. **Label:** these are **ecological** associations among county aggregates (confounding and structural coupling are likely; **not** individual-level correlations).

```js
const labelDomain = heatVars.map((v) => v.label);
const corrColor = Plot.scale({
  color: {
    type: "diverging",
    scheme: "RdBu",
    pivot: 0,
    domain: [-1, 1],
    label: "Pearson r"
  }
});
```

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "County-level correlation heatmap (ecological)",
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

---

## After join: household size × income

**`avghouseholdsize`** (avg-household-size.csv): average size of households in the county. **`geography`** is the join key. Composition effects are likely; colour shows **`povertypercent`** (% living in poverty).

<div class="grid grid-cols-1">
  <div class="card">
    ${
      resize((width) =>
        Plot.plot({
          title: "Average household size vs median household income",
          subtitle: `Inner join on geography; n = ${householdScatter.length}. Colour = % living in poverty.`,
          width,
          height: 420,
          grid: true,
          x: { label: "Average size of households in the county" },
          y: { label: "Median household income for the county (USD)" },
          color: {
            label: "% living in poverty",
            scheme: "YlOrRd",
            legend: true
          },
          marks: [
            Plot.dot(householdScatter, {
              x: "avghouseholdsize",
              y: "medincome",
              fill: "povertypercent",
              stroke: "white",
              strokeWidth: 0.4,
              r: 4,
              fillOpacity: 0.75,
              tip: {
                format: {
                  geography: true,
                  avghouseholdsize: true,
                  medincome: true,
                  povertypercent: true
                }
              }
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
