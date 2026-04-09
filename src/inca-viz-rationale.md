---
title: Visualization rationale (INCA3 dashboard)
toc: false
pager: false
---

<div class="inca-rationale-page">

# Why these charts, colors, and messages

This page explains the **design choices** behind the [INCA inequality dashboard](./inca-inequality): chart types, palettes, and the story we want readers to take away. It complements the methodological notes on the dashboard itself.

## Overall idea

The dashboard addresses **social inequalities and diet** in INCA3: how **food security**, **reported behaviors** (fast food, organic, canteen), and **measured intakes** (food groups and a few nutrients) **co-vary** with **household living standard** (`RUC_4cl`) and, for robustness, **occupational class** (`PCS_4cl_PR`). Everything is **descriptive and weighted**; we do **not** claim causality.

---

## Chart 1 — 100% stacked bars (food insecurity × income)

**Why this chart type:**  
A **100% stacked bar** shows the **composition** of each income class: every bar sums to 100% of the weighted Pop2 population in that class. That makes **inequality in the *distribution* of insecurity** visible at a glance (e.g. more severe insecurity in lower RUC classes), without mixing in differences in **population size** between classes.

**Why these colors:**  
- **Blue** for *food secure* reads as a stable, “lower concern” state.  
- **Orange** and **red** for moderate and severe insecurity follow a **natural severity ramp** (ColorBrewer-style) and avoid relying only on green vs red (weak for some color-vision types).  
The order is **ordinal**: secure → moderate → severe.

**Idea to convey:**  
**Material living standard** tracks with **food security**: readers should compare the **shape** of stacks across Q1–Q4, not bar heights (which are equal by construction).

---

## Chart 2 — Grouped horizontal bars (behaviors × income)

**Why this chart type:**  
**Horizontal bars** share a **common percentage scale** (0–max), so three different behaviors stay **comparable**. Using **one row per behavior** and **four bars per row** (one per income quartile) matches the mental model: “within this behavior, how does the **weighted prevalence** change by income?” **Percent labels** at the end of bars (when space allows) reduce reliance on the axis alone.

**Why these colors:**  
A **single sequential blue** ramp from **light (Q1)** to **dark (Q4)** encodes **income rank** consistently everywhere. The same quartile always has the **same hue** across charts, which supports **scanning** and links chart 2 to the income logic in charts 1, 3, and 4.

**Layout note:**  
Metric descriptions sit in an **HTML column** beside each SVG so long labels are **never clipped** inside a narrow SVG margin (a common source of “missing” or obscured text).

**Idea to convey:**  
Behaviors such as **fast food**, **organic**, and **canteen use** (children only for canteen) **differ by income** in ways that can be read as **patterns**, not as moral judgments.

---

## Chart 3 & 4 — Heatmap (mean intake vs national mean)

**Why this chart type:**  
Readers care about **two things at once**: (1) **absolute** intake (g/day) for interpretation against dietary norms, and (2) **how each stratum differs from the national Pop3 mean** to highlight **inequality**. The heatmap encodes **(2)** in **color** and shows **(1)** as the **large number** in the cell, with **(2)** repeated as a **small % under the mean** so color and text **stay aligned**.

**Why these colors:**  
**Brown–white–blue-green (BrBG)** is a **diverging** palette centered at **no difference from the national mean**: brown = below, teal/blue-green = above. It is **perceptually balanced** around the reference and works on **dark** themes if text color is chosen from **luminance** of the cell (not a fixed white/black).

**Chart 4:**  
The same specification with a **control** (RUC vs PCS) supports **robustness**: if patterns are **similar**, the income story is **not solely a quirk of one variable**; if they **differ**, that invites discussion of **composition** (e.g. income vs occupation).

**Idea to convey:**  
**Dietary quality and processed-food exposure** (vegetables, fruit, sweet drinks, etc.) **vary systematically** with stratification; the national mean is a **reference**, not a target prescription.

---

## References in the project

- Variable definitions: [DATA_DICTIONARY](./data/inca/DATA_DICTIONARY)  
- Live charts: [INCA inequality dashboard](./inca-inequality)

</div>
