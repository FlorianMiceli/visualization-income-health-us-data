# US counties — economy & health

[Observable Framework](https://observablehq.com/framework/) app with a single dashboard: **US county-level economy, social context, and cancer indicators** (`/us-county-economy-health`). Data lives under `src/data/kaggle/` (cancer registry + household size + topojson from `us-atlas` via the loader).

To install dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then open <http://127.0.0.1:3000/us-county-economy-health> (or <http://localhost:3000/us-county-economy-health>).

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

```ini
.
├─ src
│  ├─ components
│  │  ├─ d3-color-legend.js
│  │  ├─ kaggle-county-prep.js
│  │  └─ us-county-choropleth.js
│  ├─ data/kaggle
│  │  ├─ cancer_reg.csv
│  │  ├─ avg-household-size.csv
│  │  └─ counties-albers-10m.json.js   # loader → node_modules/us-atlas
│  ├─ us-county-economy-health.md        # main dashboard
│  └─ index.md                           # short landing + link to dashboard
├─ observablehq.config.js
├─ package.json
└─ README.md
```

See [Observable Framework project structure](https://observablehq.com/framework/project-structure) for how routing and data loaders work.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm install`            | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run deploy`     | Deploy your app to Observable                            |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |
