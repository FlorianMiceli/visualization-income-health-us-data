// Copyright 2021, Observable Inc. — ISC license (as in https://observablehq.com/@d3/color-legend)
// Legend + Swatches API compatible with @d3/color-legend for use outside Observable notebooks.
import * as d3 from "npm:d3";
import { html } from "htl";

/** @param {unknown[]} values */
function finiteValues(values) {
  return values.filter((v) => Number.isFinite(v));
}

/** Count how many values land in each discrete class (quantize / quantile). */
function binCountsForDiscreteScale(scale, values) {
  const rangeColors = scale.range();
  const n = rangeColors.length;
  const counts = new Array(n).fill(0);
  const unknown = scale.unknown();
  for (const v of values) {
    const out = scale(v);
    if (unknown !== undefined && out === unknown) continue;
    const idx = rangeColors.indexOf(out);
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

function rampDataWeighted(scale, sortedFinite, n = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  const m = sortedFinite.length;
  for (let i = 0; i < n; ++i) {
    const u = m <= 1 ? 0.5 : i / (n - 1);
    const v = m <= 1 ? sortedFinite[0] : d3.quantileSorted(sortedFinite, u);
    context.fillStyle = scale(v);
    context.fillRect(i, 0, 1, 1);
  }
  return canvas;
}

function appendTitleText(svg, { marginLeft, marginTop, title }) {
  svg
    .append("text")
    .attr("x", marginLeft)
    .attr("y", marginTop - 6)
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("class", "title")
    .text(title);
}

/** Rough width for tick labels (px) at ~10px sans-serif. */
function approxLabelWidth(s, fontSize = 10) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    w += s.charCodeAt(i) < 128 ? fontSize * 0.55 : fontSize * 0.95;
  }
  return Math.min(w, fontSize * 16);
}

/**
 * When label boxes (centered at xPos) would overlap, assign increasing lanes so text stacks downward.
 */
function assignTickLanes(xPos, labels, pad = 6) {
  const n = xPos.length;
  const w = labels.map((s) => approxLabelWidth(s));
  const lane = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let L = 0;
    for (let k = 0; k < j; k++) {
      const need = (w[j] + w[k]) / 2 + pad;
      if (Math.abs(xPos[j] - xPos[k]) < need) L = Math.max(L, lane[k] + 1);
    }
    lane[j] = L;
  }
  return lane;
}

function extendLegendSvgBottom(svg, extra) {
  if (extra <= 0) return;
  const h0 = +svg.attr("height");
  const w0 = +svg.attr("width");
  svg.attr("height", h0 + extra).attr("viewBox", [0, 0, w0, h0 + extra]);
}

function appendManualTicks(
  svg,
  {
    height,
    marginBottom,
    tickSize,
    tickPadding = 3,
    positions,
    formatTick,
    stemExtraPerLane = 11,
    textLineApprox = 12
  }
) {
  const labels = positions.map((_, j) => String(formatTick(j)));
  const lane = assignTickLanes(positions, labels);
  const maxLane = lane.length ? Math.max(...lane) : 0;

  const g = svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .attr("fill", "none")
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle");

  positions.forEach((xPos, j) => {
    const L = lane[j];
    const stemLen = tickSize + L * stemExtraPerLane;
    g.append("line")
      .attr("stroke", "currentColor")
      .attr("x1", xPos)
      .attr("x2", xPos)
      .attr("y1", 0)
      .attr("y2", stemLen);
    g.append("text")
      .attr("x", xPos)
      .attr("y", stemLen + tickPadding)
      .attr("fill", "currentColor")
      .attr("dy", "0.71em")
      .text(labels[j]);
  });

  if (maxLane > 0) {
    const maxStem = Math.max(
      tickSize,
      ...positions.map((_, j) => tickSize + lane[j] * stemExtraPerLane)
    );
    const maxBottomInGroup = maxStem + tickPadding + textLineApprox;
    const pad = 4;
    const neededSvgHeight = height - marginBottom + maxBottomInGroup + pad;
    extendLegendSvgBottom(svg, Math.max(0, neededSvgHeight - height));
  }
}

export function Legend(color, options = {}) {
  const {
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64
  } = options;
  // Must be mutable: invertExtent + interpolator branches assign tickValues / tickFormat.
  let tickFormat = options.tickFormat;
  let tickValues = options.tickValues;

  const legendValues = finiteValues(options.values ?? []);
  let skipUnifiedAxis = false;

  function ramp(interpolator, n = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = interpolator(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  let tickAdjust = (g) => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x;

  if (color.interpolate) {
    const n = Math.min(color.domain().length, color.range().length);
    x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
    svg
      .append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
  } else if (color.interpolator) {
    const innerW = width - marginLeft - marginRight;
    const barH = height - marginTop - marginBottom;
    const sorted = d3.sort(legendValues);
    if (sorted.length >= 2) {
      const sc = color.copy();
      skipUnifiedAxis = true;
      svg
        .append("image")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", innerW)
        .attr("height", barH)
        .attr("preserveAspectRatio", "none")
        .attr("href", rampDataWeighted(sc, sorted).toDataURL());
      const dom = color.domain();
      const d0 = dom[0];
      const d1 = dom[1];
      const lo = Math.min(d0, d1);
      const hi = Math.max(d0, d1);
      const fmt =
        tickFormat === undefined
          ? (d) => d
          : typeof tickFormat === "string"
            ? d3.format(tickFormat)
            : tickFormat;
      const tickNums = d3.ticks(lo, hi, Math.max(3, Math.round(ticks)));
      const xPos = tickNums.map((t) => marginLeft + (d3.bisectRight(sorted, t) / sorted.length) * innerW);
      appendManualTicks(svg, {
        height,
        marginBottom,
        tickSize,
        positions: xPos,
        formatTick: (j) => fmt(tickNums[j])
      });
    } else {
      x = Object.assign(color.copy().interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
        range() {
          return [marginLeft, width - marginRight];
        }
      });
      svg
        .append("image")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", innerW)
        .attr("height", barH)
        .attr("preserveAspectRatio", "none")
        .attr("href", ramp(color.interpolator()).toDataURL());
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map((i) => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }
  } else if (color.invertExtent) {
    const thresholds = color.thresholds
      ? color.thresholds()
      : color.quantiles
        ? color.quantiles()
        : color.domain();
    const thresholdFormat =
      tickFormat === undefined ? (d) => d : typeof tickFormat === "string" ? d3.format(tickFormat) : tickFormat;
    const rangeColors = color.range();
    const nBin = rangeColors.length;
    const innerW = width - marginLeft - marginRight;
    const cum = new Array(nBin + 1);
    cum[0] = marginLeft;

    if (legendValues.length > 0) {
      skipUnifiedAxis = true;
      const counts = binCountsForDiscreteScale(color, legendValues);
      const total = d3.sum(counts) || 1;
      for (let i = 0; i < nBin; i++) {
        cum[i + 1] = cum[i] + (counts[i] / total) * innerW;
      }
      cum[nBin] = marginLeft + innerW;
      svg
        .append("g")
        .selectAll("rect")
        .data(rangeColors)
        .join("rect")
        .attr("x", (_, i) => cum[i])
        .attr("y", marginTop)
        .attr("width", (_, i) => Math.max(0, cum[i + 1] - cum[i]))
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", (d) => d);
      const xPos = d3.range(thresholds.length).map((j) => cum[j + 1]);
      appendManualTicks(svg, {
        height,
        marginBottom,
        tickSize,
        positions: xPos,
        formatTick: (j) => thresholdFormat(thresholds[j], j)
      });
    } else {
      x = d3
        .scaleLinear()
        .domain([-1, color.range().length - 1])
        .rangeRound([marginLeft, width - marginRight]);
      svg
        .append("g")
        .selectAll("rect")
        .data(rangeColors)
        .join("rect")
        .attr("x", (d, i) => x(i - 1))
        .attr("y", marginTop)
        .attr("width", (d, i) => x(i) - x(i - 1))
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", (d) => d);
      tickValues = d3.range(thresholds.length);
      tickFormat = (i) => thresholdFormat(thresholds[i], i);
    }
  } else {
    x = d3.scaleBand().domain(color.domain()).rangeRound([marginLeft, width - marginRight]);
    svg
      .append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);
    tickAdjust = () => {};
  }

  if (!skipUnifiedAxis) {
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues)
      )
      .call(tickAdjust)
      .call((g) => g.select(".domain").remove());
  }

  appendTitleText(svg, { marginLeft, marginTop, title });

  return svg.node();
}

export function Swatches(color, options = {}) {
  const {
    columns = null,
    format,
    unknown: formatUnknown,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0
  } = options;
  const id = `-swatches-${Math.random().toString(16).slice(2)}`;
  const unknown = formatUnknown == null ? undefined : color.unknown();
  const unknowns = unknown == null || unknown === d3.scaleImplicit ? [] : [unknown];
  const domain = color.domain().concat(unknowns);
  const fmt = format === undefined ? (x) => (x === unknown ? formatUnknown : x) : format;

  if (columns !== null) {
    return html`<div style="margin-left:${marginLeft}px" class="${id}-wrap">
      <style>
        .${id}-item {
          break-inside: avoid;
          display: flex;
          align-items: center;
          padding-bottom: 1px;
        }
        .${id}-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - ${+swatchWidth}px - 0.5em);
        }
        .${id}-swatch {
          width: ${+swatchWidth}px;
          height: ${+swatchHeight}px;
          margin: 0 0.5em 0 0;
          flex-shrink: 0;
        }
      </style>
      <div style="columns:${columns}">
        ${domain.map((value) => {
          const label = `${fmt(value)}`;
          return html`<div class="${id}-item">
            <div class="${id}-swatch" style="background:${color(value)}"></div>
            <div class="${id}-label">${label}</div>
          </div>`;
        })}
      </div>
    </div>`;
  }

  return html`<div
    style="margin-left:${marginLeft}px;display:flex;flex-wrap:wrap;gap:0.5em 1em;align-items:center"
  >
    <style>
      .${id} {
        display: inline-flex;
        align-items: center;
        margin-right: 1em;
      }
      .${id}::before {
        content: "";
        width: ${+swatchWidth}px;
        height: ${+swatchHeight}px;
        margin-right: 0.5em;
        background: var(--color);
      }
    </style>
    ${domain.map((value) => html`<div class="${id}" style="--color:${color(value)}">${fmt(value)}</div>`)}
  </div>`;
}
