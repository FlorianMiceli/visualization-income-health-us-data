---
title: Visualisation choices (INCA3 dashboard)
toc: false
pager: false
---

<div class="inca-rationale-page">

# Why these charts, colours, and messages

This page explains the **design choices** behind the [INCA3 dashboard](./inca-inequality): chart types, palettes, and how to read them. It complements the methodological notes on the main page.

## Overall idea

The dashboard covers **social inequality and diet** in INCA3: how **food security**, some **self-reported behaviours** (fast food, organic, school canteen), and **measured intakes** (food groups and nutrients) vary with **household living standard** (`RUC_4cl`), and, as a complementary read, with **occupational category** (`PCS_4cl_PR`).

All analyses are **descriptive and weighted**; they are not causal evidence.

---

## Chart 1 — 100% stacked bars (food insecurity × income)

**Why this chart type:**  
The 100% stacked bar shows the **composition** of each income class: each bar is 100% of the weighted Pop2 sample in that class. You see the **unequal distribution** of food insecurity (e.g. more severe insecurity in lower income classes) without mixing in differences in sample size between classes.

**Why these colours:**  
- **Blue** for food security (reference state).  
- **Orange** then **red** for moderate then severe insecurity (a clear severity ramp).  
The order is **ordinal**: secure → moderate → severe.

**Intended message:**  
Living standard is linked to food security; compare the **shape of the segments** between classes, not total bar height (which is identical by construction).

---

## Chart 2 — “Health” index and index composition

**Why this layout:**  
The line shows each social class’s position on the overall index; the breakdown shows **what drives** the score for the selected class. This “overview + detail” pairing supports interpretation.

**Why these colours:**  
Social classes keep stable colours in the interface (least to most advantaged). That consistency helps cross-reading between charts.

**Layout note:**  
Composition sits beside the line to limit vertical eye travel and keep one compact block.

**Intended message:**  
Show both the overall gap between classes and which components pull the score up or down.

---

## Chart 3 — Consumption structure by quartile

**Why this chart type:**  
Stacked bars compare the **relative composition of the food basket** between income classes on the same visual scale.

**Known limitation:**  
The format emphasises relative structure. When differences are small, contrast can look muted.

**Intended message:**  
Compare consumption profiles without over-interpreting small gaps.

---

## Chart 4 — Food groups and nutrients vs national mean

**Why this chart type:**  
The heatmap supports reading both:
- the **mean level** (order of magnitude), and  
- the **gap to the national mean** (relative position).

**Why this palette:**  
A diverging palette centred on 0 highlights values above and below the national reference.

**Intended message:**  
Quickly see where classes differ from the national mean while staying descriptive.

---

## Project references

- Variable definitions: [Data dictionary](./data/inca/DATA_DICTIONARY)  
- Main dashboard: [INCA3 — Social inequality and diet](./inca-inequality)

</div>
