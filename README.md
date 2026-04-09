# Data visualisation

[Observable Framework](https://observablehq.com/framework/) app. Données INCA sous `src/data/inca/`. Dictionnaire des colonnes : [`src/data/inca/DATA_DICTIONARY.md`](src/data/inca/DATA_DICTIONARY.md).

To install dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then open <http://127.0.0.1:3000/> (or <http://localhost:3000/>).

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

```ini
.
├─ src
│  ├─ components          # modules JS réutilisables
│  ├─ data/inca           # CSV + DATA_DICTIONARY.md
│  └─ index.md            # page d’accueil
├─ observablehq.config.js
├─ package.json
└─ README.md
```

See [Observable Framework project structure](https://observablehq.com/framework/project-structure) for how routing and data loaders work.

## Command reference

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm install`        | Install or reinstall dependencies           |
| `npm run dev`        | Start local preview server                  |
| `npm run build`      | Build your static site, generating `./dist` |
| `npm run deploy`     | Deploy your app to Observable               |
| `npm run clean`      | Clear the local data loader cache           |
| `npm run observable` | Run commands like `observable help`         |
