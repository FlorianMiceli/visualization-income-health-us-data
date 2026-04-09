---
title: INCA3 — Social inequalities & diet
toc: false
pager: false
---

```js
import { FileAttachment, resize } from "observablehq:stdlib";
import { html } from "htl";
import katex from "katex";
import {
  parseSemicolonCsv,
  isPop2,
  isPop3,
  weightPop2,
  weightPop3,
  mergeDescHabitudes,
  mergePop3Data,
  weightedStratumDistribution,
  weightedMeansByStratum,
  nationalWeightedMean,
  GPE_HEATMAP_KEYS,
  NUTRIENT_KEYS,
  toNum,
  HEALTH_SCORE_COMPONENTS,
  attachHealthScores,
  healthScoreMeansByStratum,
  GPE_MACRO_GROUPS,
  weightedGpeMacroCompositionByStratum
} from "./components/inca-prep.js";
import {
  chartStackedFoodInsecurity,
  chartStackedMacroComposition,
  chartIntakeHeatmap,
  chartHealthScoreIncomeLine,
  chartHealthScoreComponents,
  LABELS
} from "./components/inca-charts.js";

function ensureKatexStylesheet() {
  const id = "inca-katex-stylesheet";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

function healthIndexFormulaEl() {
  ensureKatexStylesheet();
  const div = document.createElement("div");
  div.className = "inca-health-formula-katex";
  div.style.cssText =
    "font-size:clamp(1.05rem,2.5vw,1.55rem);text-align:center;margin:0.35rem 0 0.5rem;padding:0.5rem 0;line-height:1.45;overflow-x:auto;";
  katex.render(
    "\\begin{gathered} I \\;=\\; \\displaystyle\\sum_{k} w_k\\,s_k\\,z_k \\qquad \\text{avec} \\qquad \\displaystyle\\sum_{k} w_k \\;=\\; 1 \\end{gathered}",
    div,
    { displayMode: true, throwOnError: false }
  );
  return div;
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n !== ys.length || n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den > 0 ? num / den : null;
}

const descText = await FileAttachment("data/inca/description-indiv.csv").text();
const habText = await FileAttachment("data/inca/habitudes-indiv.csv").text();
const consoText = await FileAttachment("data/inca/conso-gpe-inca3.csv").text();
const apportsText = await FileAttachment("data/inca/apports-nut-alim.csv").text();

const description = parseSemicolonCsv(descText);
const habitudes = parseSemicolonCsv(habText);
const conso = parseSemicolonCsv(consoText);
const apports = parseSemicolonCsv(apportsText);

const descPop2 = description.filter(isPop2).map((d) => ({
  ...d,
  _w: weightPop2(d)
}));
const mergedPop2 = mergeDescHabitudes(descPop2, habitudes).filter(
  (r) => Number.isFinite(r._w) && r._w > 0 && [1, 2, 3, 4].includes(toNum(r.RUC_4cl))
);

const iaDist = weightedStratumDistribution(
  mergedPop2.filter((r) => ["0", "1", "2"].includes(String(r.IA_statut ?? ""))),
  "RUC_4cl",
  "IA_statut",
  (r) => r._w,
  [1, 2, 3, 4],
  (v) => (v === "" || v == null ? null : String(v)),
  ["0", "1", "2"]
);

const descPop3 = description.filter(isPop3).map((d) => ({
  ...d,
  _w: weightPop3(d)
}));
const mergedPop3 = mergePop3Data(descPop3, conso, apports).filter(
  (r) => Number.isFinite(r._w) && r._w > 0 && [1, 2, 3, 4].includes(toNum(r.RUC_4cl))
);

const mergedPop3Health = attachHealthScores(mergedPop3);
const healthByRuc = healthScoreMeansByStratum(mergedPop3Health, "RUC_4cl", [1, 2, 3, 4]);

const healthPaired = [1, 2, 3, 4]
  .map((s) => {
    const row = healthByRuc.find((d) => d.stratum === s);
    const m = row?.meanHealthScore;
    return m != null && Number.isFinite(m) ? { s, m } : null;
  })
  .filter(Boolean);
const healthR = pearson(
  healthPaired.map((p) => p.s),
  healthPaired.map((p) => p.m)
);

const heatKeys = [...GPE_HEATMAP_KEYS, ...NUTRIENT_KEYS];
const heatKeyNames = heatKeys.map((k) => k.key);

const nationalMeans = Object.fromEntries(
  heatKeyNames.map((k) => [k, nationalWeightedMean(mergedPop3, k, (r) => r._w)])
);

const intakeByRuc = weightedMeansByStratum(mergedPop3, "RUC_4cl", [1, 2, 3, 4], heatKeyNames);

const gpeCompositionRuc = weightedGpeMacroCompositionByStratum(mergedPop3, "RUC_4cl", [1, 2, 3, 4]);
const gpeMacroLabels = Object.fromEntries(GPE_MACRO_GROUPS.map((g) => [g.id, g.label]));

const pearsonNote =
  healthR != null && Number.isFinite(healthR)
    ? html`<p class="inca-hero__footnote">Corrélation de Pearson entre le rang de strate (1 à 4) et la moyenne pondérée de l’indice par strate : <strong>r ≈ ${healthR.toFixed(
        2
      )}</strong> (quatre points agrégés — indicateur de tendance, pas un test causal).</p>`
    : null;

const chartHealthLine = resize((width) => {
  const el = document.createElement("div");
  chartHealthScoreIncomeLine(el, healthByRuc, {
    width,
    stratumLabels: LABELS.RUC_4cl,
    footnote: null
  });
  return el;
});

const chartHealthComposition = resize((width) => {
  const el = document.createElement("div");
  chartHealthScoreComponents(el, HEALTH_SCORE_COMPONENTS, { width, formulaLine: null });
  return el;
});

const chartFoodInsecurity = resize((width) => {
  const el = document.createElement("div");
  chartStackedFoodInsecurity(el, iaDist, {
    width,
    stratumLabels: LABELS.RUC_4cl,
    valueLabels: LABELS.IA_statut
  });
  return el;
});

const chartMacroComposition = resize((width) => {
  const el = document.createElement("div");
  chartStackedMacroComposition(el, gpeCompositionRuc, {
    width,
    stratumLabels: LABELS.RUC_4cl,
    valueLabels: gpeMacroLabels,
    title: "Parts relatives du panier alimentaire par quartile de revenu (Q1–Q4)",
    subtitle:
      "Pop3 · hors eaux et boissons · cinq grandes familles · chaque barre = 100 % de la conso. pondérée de la strate",
    xTickFormat: (d) => `Q${d}`,
    footnote:
      "RUC 1–4 · hors conso_gpe29–34 · ordre des segments = contribution nationale décroissante · données descriptives."
  });
  return el;
});

const chartIntakeHeat = resize((width) => {
  const el = document.createElement("div");
  chartIntakeHeatmap(el, intakeByRuc, heatKeys, nationalMeans, {
    width,
    title: "Mean intake by income class vs national Pop3 mean",
    footnote: null
  });
  return el;
});
```

<div class="inca-dashboard">

# INCA3 — Inégalités sociales et alimentation

<p class="inca-dash-lead">Tableau de bord descriptif (pondération INCA3) : indice « santé » et composition, insécurité alimentaire, structure des apports et écarts aux moyennes nationales Pop3. Aucune interprétation causale.</p>

<section class="inca-hero" aria-label="Indice santé et composition">

<div class="inca-hero__panel">

<h2>Indice alimentaire « santé » et revenu (Pop3)</h2>

<p>L’<strong>indice</strong> (0–100, <strong>50</strong> = moyenne nationale Pop3) repose pour <strong>~72 %</strong> sur les <strong>apports 24 h</strong> et pour <strong>~28 %</strong> sur le <strong>questionnaire</strong> (tabac, IMC adultes, sécurité alimentaire, soins, situation financière). <strong>Indice descriptif</strong>, non clinique. La courbe suit la moyenne de l’indice le long des strates RUC 1 → 4 ; la ligne pointillée rappelle la référence <strong>50</strong>.</p>

${pearsonNote}

${chartHealthLine}

</div>

<div class="inca-hero__panel">

<h2>Composition de l’indice (variables et poids)</h2>

${healthIndexFormulaEl()}

<p class="inca-hero__footnote" style="margin-bottom:0.5rem"><em>Chaque</em> <strong>w<sub>k</sub></strong> <em>est le poids d’une composante (longueur de barre).</em></p>

${chartHealthComposition}

</div>

</section>

<section class="inca-rest" aria-label="Autres graphiques">

<h2>Autres visualisations</h2>

<div class="inca-grid-2">

<div class="inca-card">

<h3>Insécurité alimentaire par classe de revenu (Pop2)</h3>

<p>Barres empilées à 100 % : répartition pondérée de l’insécurité alimentaire par quartile RUC.</p>

${chartFoodInsecurity}

</div>

<div class="inca-card">

<h3>Structure de la consommation par quartile (Pop3)</h3>

<p>Chaque barre vaut 100 % de la conso. pondérée de la strate (hors eaux et boissons), en cinq grandes familles de groupes INCA3.</p>

${chartMacroComposition}

</div>

</div>

<div class="inca-card inca-card--wide">

<h3>Groupes alimentaires et nutriments vs moyenne nationale (Pop3)</h3>

<p>Cellule = moyenne pondérée (g/j) ; nombre inférieur = écart % à la moyenne nationale Pop3 ; couleur = écart (données descriptives).</p>

${chartIntakeHeat}

</div>

</section>

</div>
