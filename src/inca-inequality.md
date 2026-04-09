---
title: INCA3 — Inégalités sociales et alimentation
toc: false
pager: false
---

```js
import { FileAttachment, resize } from "observablehq:stdlib";
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
  attachHealthScores,
  healthScoreMeansByStratum,
  healthScoreContributionMeansByStratum,
  GPE_MACRO_GROUPS,
  weightedGpeMacroCompositionByStratum
} from "./components/inca-prep.js";
import {
  chartStackedFoodInsecurity,
  chartStackedMacroComposition,
  chartIntakeHeatmap,
  chartHealthScoreIncomeLine,
  chartHealthScoreContributionProfile,
  LABELS
} from "./components/inca-charts.js";

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
const healthContribByRuc = healthScoreContributionMeansByStratum(mergedPop3Health, "RUC_4cl", [1, 2, 3, 4]);

let rawNum = 0;
let rawDen = 0;
for (const r of mergedPop3Health) {
  const w = r._w;
  const raw = r._healthRaw;
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(raw)) continue;
  rawNum += w * raw;
  rawDen += w;
}
const meanRaw = rawDen > 0 ? rawNum / rawDen : 0;
let rawVarNum = 0;
for (const r of mergedPop3Health) {
  const w = r._w;
  const raw = r._healthRaw;
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(raw)) continue;
  rawVarNum += w * (raw - meanRaw) ** 2;
}
const stdRaw = rawDen > 0 && rawVarNum > 0 ? Math.sqrt(rawVarNum / rawDen) : 1;
const rawToScorePoints = 10 / (stdRaw > 1e-9 ? stdRaw : 1);

const heatKeys = [...GPE_HEATMAP_KEYS, ...NUTRIENT_KEYS];
const heatKeyNames = heatKeys.map((k) => k.key);

const nationalMeans = Object.fromEntries(
  heatKeyNames.map((k) => [k, nationalWeightedMean(mergedPop3, k, (r) => r._w)])
);

const intakeByRuc = weightedMeansByStratum(mergedPop3, "RUC_4cl", [1, 2, 3, 4], heatKeyNames);

const gpeCompositionRuc = weightedGpeMacroCompositionByStratum(mergedPop3, "RUC_4cl", [1, 2, 3, 4]);
const gpeMacroLabels = Object.fromEntries(GPE_MACRO_GROUPS.map((g) => [g.id, g.label]));
const chartHealthCombined = resize((width) => {
  const root = document.createElement("div");
  const controls = document.createElement("div");
  const panels = document.createElement("div");
  const lineWrap = document.createElement("div");
  const compWrap = document.createElement("div");
  controls.style.cssText = "display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin:0 0 0.75rem;";
  panels.style.cssText = `
    display:grid;
    grid-template-columns:1fr;
    gap:0.9rem;
    align-items:start;
  `;
  lineWrap.style.cssText = "min-width:0;";
  compWrap.style.cssText = "min-width:0;";
  panels.append(lineWrap, compWrap);
  root.append(controls, panels);

  let selectedStratum = 4;
  const available = [1, 2, 3, 4];
  const classNames = {
    1: "Classe pauvre",
    2: "Classe moyenne modeste",
    3: "Classe moyenne aisée",
    4: "Classe riche"
  };
  const classColors = {
    1: "#d73027",
    2: "#fc8d59",
    3: "#91bfdb",
    4: "#4575b4"
  };

  function renderControls() {
    controls.replaceChildren();
    const label = document.createElement("span");
    label.textContent = "Classe affichée :";
    label.style.cssText = "font-size:0.92rem;opacity:0.85;margin-right:0.25rem;";
    controls.appendChild(label);

    for (const s of available) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = classNames[s] ?? `Classe ${s}`;
      const active = s === selectedStratum;
      const color = classColors[s] ?? "#1f6feb";
      btn.style.cssText = `
        padding:0.3rem 0.65rem;border-radius:999px;border:1px solid ${color};
        background:${active ? color : "transparent"};color:${active ? "#fff" : color};cursor:pointer;font-size:0.84rem;font-weight:600;
      `;
      btn.addEventListener("click", () => {
        selectedStratum = s;
        render();
      });
      controls.appendChild(btn);
    }
  }

  function render() {
    renderControls();
    const leftWidth = width;
    const rightWidth = width;

    lineWrap.replaceChildren();
    chartHealthScoreIncomeLine(lineWrap, healthByRuc, {
      width: leftWidth,
      stratumLabels: LABELS.RUC_4cl,
      footnote: null,
      selectedStratum,
      onSelectStratum: (s) => {
        selectedStratum = s;
        render();
      }
    });

    compWrap.replaceChildren();
    const selected = healthContribByRuc.find((d) => d.stratum === selectedStratum);
    const selectedComponents = (selected?.components ?? []).map((c) => ({
      ...c,
      meanContributionScore:
        c.meanContribution != null && Number.isFinite(c.meanContribution)
          ? c.meanContribution * rawToScorePoints
          : null
    }));
    chartHealthScoreContributionProfile(compWrap, selectedComponents, {
      width: rightWidth,
      title: "Composition de l'indice (contributions moyennes)",
      subtitle: `Classe sélectionnée : ${classNames[selectedStratum] ?? `Classe ${selectedStratum}`}`
    });
  }

  render();
  return root;
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
    title: "Parts relatives du panier alimentaire par classe sociale",
    subtitle: null,
    xTickFormat: (d) =>
      ({ "1": "Pauvre", "2": "Moy. modeste", "3": "Moy. aisée", "4": "Riche" }[String(d)] ?? String(d)),
    footnote: null
  });
  return el;
});

const chartIntakeHeat = resize((width) => {
  const el = document.createElement("div");
  chartIntakeHeatmap(el, intakeByRuc, heatKeys, nationalMeans, {
    width,
    title: "Apports moyens par classe de revenu par rapport à la moyenne nationale",
    footnote: null
  });
  return el;
});

```

<div class="inca-dashboard">

# INCA3 — Inégalités sociales et alimentation

<p class="inca-dash-lead">Tableau de bord descriptif (pondération INCA3) : indice « santé » et composition, insécurité alimentaire, structure des apports et écarts aux moyennes nationales. Aucune interprétation causale.</p>

<section class="inca-hero" aria-label="Indice santé et composition">

<div class="inca-hero__panel">

<h2>Indice alimentaire « santé » et composition</h2>

<p>Sélectionner une classe sociale pour relier la position sur la courbe et la composition de l’indice.</p>

${chartHealthCombined}

</div>

</section>

<section class="inca-rest" aria-label="Autres graphiques">

<h2>Autres visualisations</h2>

<div class="inca-card">

<h3>Insécurité alimentaire par classe de revenu</h3>

${chartFoodInsecurity}

</div>

<div class="inca-card" style="margin-top:1rem;">

<h3>Structure de la consommation par quartile</h3>

${chartMacroComposition}

</div>

<div class="inca-card inca-card--wide">

<h3>Groupes alimentaires et nutriments par rapport à la moyenne nationale</h3>

${chartIntakeHeat}

</div>

</section>

</div>
