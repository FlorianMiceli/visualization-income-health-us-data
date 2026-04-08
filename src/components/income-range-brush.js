import { html } from "npm:htl";

/**
 * One-line dual-thumb range for median income: drag ends to resize, drag the
 * filled band to slide the whole window. Compatible with Observable view() /
 * Generators.input via a stable `.value` object and `input` events.
 */
export function createIncomeRangeBrush(extent, options = {}) {
  const min = +extent[0];
  const max = +extent[1];
  const step = options.step ?? 500;
  const span = Math.max(max - min, step);
  const minGap = Math.max(step, span * 0.002);

  let lo = Number.isFinite(options.value?.[0]) ? +options.value[0] : min;
  let hi = Number.isFinite(options.value?.[1]) ? +options.value[1] : max;
  lo = clampRound(lo);
  hi = clampRound(hi);
  if (hi - lo < minGap) {
    hi = clampRound(lo + minGap);
    if (hi > max) {
      hi = max;
      lo = clampRound(hi - minGap);
    }
  }

  const valueRef = { from: lo, to: hi };

  const row = html`<div
    style="display:flex;align-items:center;gap:10px;width:100%;max-width:720px;font-family:var(--sans-serif,system-ui,sans-serif)"
  ></div>`;

  const labelLo = html`<span
    style="font-size:12px;font-variant-numeric:tabular-nums;min-width:5.2em;text-align:right;color:var(--theme-foreground-muted,#666)"
  ></span>`;
  const labelHi = html`<span
    style="font-size:12px;font-variant-numeric:tabular-nums;min-width:5.2em;color:var(--theme-foreground-muted,#666)"
  ></span>`;

  const track = html`<div
    style="position:relative;flex:1;height:28px;display:flex;align-items:center;cursor:default;touch-action:none"
  ></div>`;

  const rail = html`<div
    style="position:absolute;left:0;right:0;height:6px;border-radius:3px;background:var(--theme-foreground-muted,#ccc);opacity:0.35"
  ></div>`;

  const fill = html`<div
    style="position:absolute;height:10px;margin-top:-2px;border-radius:5px;background:var(--theme-foreground-focus,#3182ce);cursor:grab;opacity:0.85"
  ></div>`;

  const thumbStyle =
    "position:absolute;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--theme-background,#fff);border:2px solid var(--theme-foreground-focus,#3182ce);top:50%;margin-top:-7px;cursor:ew-resize;box-shadow:0 1px 3px #0003;touch-action:none";

  const thumbL = html`<div style="${thumbStyle}" role="slider" aria-label="Income range low"></div>`;
  const thumbR = html`<div style="${thumbStyle}" role="slider" aria-label="Income range high"></div>`;

  track.append(rail, fill, thumbL, thumbR);
  row.append(labelLo, track, labelHi);

  function clampRound(v) {
    const x = Math.round(Math.max(min, Math.min(max, v)) / step) * step;
    return Math.max(min, Math.min(max, x));
  }

  function fmt(v) {
    return `$${Math.round(v).toLocaleString("en-US")}`;
  }

  function posPct(v) {
    return span <= 0 ? 0 : ((v - min) / span) * 100;
  }

  function valFromClientX(clientX, rect) {
    const t = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width;
    return clampRound(min + t * span);
  }

  function layout() {
    const pLo = posPct(lo);
    const pHi = posPct(hi);
    fill.style.left = `${pLo}%`;
    fill.style.width = `${Math.max(pHi - pLo, 0.4)}%`;
    thumbL.style.left = `${pLo}%`;
    thumbR.style.left = `${pHi}%`;
    labelLo.textContent = fmt(lo);
    labelHi.textContent = fmt(hi);
    thumbL.setAttribute("aria-valuenow", String(lo));
    thumbR.setAttribute("aria-valuenow", String(hi));
  }

  function emit() {
    valueRef.from = lo;
    valueRef.to = hi;
    row.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function setLoHi(nlo, nhi) {
    nlo = clampRound(nlo);
    nhi = clampRound(nhi);
    if (nhi - nlo < minGap) {
      if (nlo + minGap <= max) nhi = clampRound(nlo + minGap);
      else {
        nhi = max;
        nlo = clampRound(nhi - minGap);
      }
    }
    lo = nlo;
    hi = nhi;
    layout();
    emit();
  }

  let mode = null;
  let startX = 0;
  let startLo = 0;
  let startHi = 0;

  function onMove(e) {
    if (!mode) return;
    const rect = track.getBoundingClientRect();
    const wPx = Math.max(rect.width, 1);
    if (mode === "l") {
      const v = valFromClientX(e.clientX, rect);
      if (v <= hi - minGap) setLoHi(v, hi);
      else setLoHi(hi - minGap, hi);
    } else if (mode === "r") {
      const v = valFromClientX(e.clientX, rect);
      if (v >= lo + minGap) setLoHi(lo, v);
      else setLoHi(lo, lo + minGap);
    } else if (mode === "pan") {
      const deltaPx = e.clientX - startX;
      const deltaVal = (deltaPx / wPx) * span;
      let nlo = clampRound(startLo + deltaVal);
      let nhi = clampRound(startHi + deltaVal);
      const width = startHi - startLo;
      if (nhi > max) {
        nhi = max;
        nlo = clampRound(nhi - width);
      }
      if (nlo < min) {
        nlo = min;
        nhi = clampRound(nlo + width);
      }
      setLoHi(nlo, nhi);
    }
  }

  function onUp() {
    mode = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  }

  function beginDrag(e, kind) {
    if (e.button !== 0) return;
    e.preventDefault();
    mode = kind;
    startX = e.clientX;
    startLo = lo;
    startHi = hi;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  thumbL.addEventListener("pointerdown", (e) => beginDrag(e, "l"));
  thumbR.addEventListener("pointerdown", (e) => beginDrag(e, "r"));
  fill.addEventListener("pointerdown", (e) => beginDrag(e, "pan"));

  Object.defineProperty(row, "value", {
    get() {
      valueRef.from = lo;
      valueRef.to = hi;
      return valueRef;
    },
    set(v) {
      if (!v) return;
      const a = Number(v.from ?? v[0]);
      const b = Number(v.to ?? v[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return;
      setLoHi(Math.min(a, b), Math.max(a, b));
    }
  });

  layout();
  return row;
}
