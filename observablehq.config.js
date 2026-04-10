// See https://observablehq.com/framework/config for documentation.
export default {
  title: "Data visualisation",
  root: "src",

  style: "app-shell.css",

  head: `<link rel="icon" href="observable.png" type="image/png" sizes="32x32">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">`,

  header: ({ path }) => {
    const p = String(path ?? "");
    const home =
      p === "/" || p === "" || p === "/index" || p.endsWith("/index") || /(^|\/)index$/.test(p.replace(/\.html$/, ""));
    const dash = p.includes("inca-inequality");
    const rationale = p.includes("inca-viz-rationale");
    const dict = p.includes("DATA_DICTIONARY");

    return `<a class="inca-header-brand" href="./">INCA · visualisations</a>
<details class="inca-site-nav">
  <summary aria-label="Other pages"></summary>
  <nav class="inca-site-nav__panel" aria-label="Site navigation">
    <a href="./"${home ? " aria-current=\"page\"" : ""}>Home</a>
    <a href="./inca-inequality"${dash ? " aria-current=\"page\"" : ""}>INCA3 dashboard</a>
    <a href="./inca-viz-rationale"${rationale ? " aria-current=\"page\"" : ""}>Visualisation choices</a>
    <a href="./data/inca/DATA_DICTIONARY"${dict ? " aria-current=\"page\"" : ""}>Data dictionary</a>
  </nav>
</details>`;
  },

  footer: () =>
    `<div class="inca-footer-note">INCA3 data — descriptive analysis</div>`,

  pager: false
};
