# Kaggle county CSVs — data dictionary

Canonical column meanings for files in this folder. Delimiter: **comma**. Join key across files: **`geography`** (normalize with trim + collapsed whitespace before matching).

---

## `avg-household-size.csv`

| Column | Type | Description |
|--------|------|-------------|
| `index` | Integer | Row index from the source export (first column in file). |
| `statefips` | Integer | State FIPS identification number. |
| `countyfips` | Integer | County FIPS identification number (within state). |
| `avghouseholdsize` | Float | Average size of households in the county. |
| `geography` | String | Location name (e.g. `"Kitsap County, Washington"`). |

---

## `cancer_reg.csv`

### Core geography and outcomes

| Column | Type | Description |
|--------|------|-------------|
| `index` | Integer | Row index from the source export (first column in file). |
| `geography` | String | Location name (join key to `avg-household-size.csv`). |
| `avganncount` | Numeric | Average annual count of cancer cases in the county. |
| `avgdeathsperyear` | Numeric | Average number of cancer deaths per year in the county. |
| `target_deathrate` | Numeric | Deaths per 100,000 individuals in the county (mortality rate). |
| `incidencerate` | Numeric | Cancer incidence rate in the file; confirm units / age adjustment from the original dataset if needed for epidemiologic use. |

### Socioeconomic and population

| Column | Type | Description |
|--------|------|-------------|
| `medincome` | Numeric | Median household income for the county. |
| `popest2015` | Numeric | Population estimate for 2015. |
| `povertypercent` | Numeric | Percentage of people living in poverty. |
| `studypercap` | Numeric | Number of clinical trials per capita in the county. |
| `binnedinc` | Categorical | Binned income bracket for the county (string labels, e.g. interval notation). |

### Age and marriage

| Column | Type | Description |
|--------|------|-------------|
| `medianage` | Numeric | Median age of the population in the county. |
| `medianagemale` | Numeric | Median age of the male population in the county. |
| `medianagefemale` | Numeric | Median age of the female population in the county. |
| `percentmarried` | Numeric | Percentage of people who are married in the county. |

### Education (age-specific)

| Column | Type | Description |
|--------|------|-------------|
| `pctnohs18_24` | Numeric | Percentage of people aged 18–24 who did not graduate high school. |
| `pcths18_24` | Numeric | Percentage of people aged 18–24 who graduated high school. |
| `pctsomecol18_24` | Numeric | Percentage of people aged 18–24 who attended some college. |
| `pctbachdeg18_24` | Numeric | Percentage of people aged 18–24 who have a bachelor’s degree. |
| `pcths25_over` | Numeric | Percentage of people aged 25 and over who graduated high school. |
| `pctbachdeg25_over` | Numeric | Percentage of people aged 25 and over who have a bachelor’s degree. |

### Employment

| Column | Type | Description |
|--------|------|-------------|
| `pctemployed16_over` | Numeric | Percentage of people aged 16 and over who are employed. |
| `pctunemployed16_over` | Numeric | Percentage of people aged 16 and over who are unemployed. |

### Health insurance (and related)

| Column | Type | Description |
|--------|------|-------------|
| `pctprivatecoverage` | Numeric | Percentage of people with private health insurance. |
| `pctprivatecoveragealone` | Numeric | Private coverage only (no other overlap); empty cells possible. |
| `pctempprivcoverage` | Numeric | Employer-based private coverage (share). |
| `pctpubliccoverage` | Numeric | Percentage with public health coverage. |
| `pctpubliccoveragealone` | Numeric | Public coverage only; empty cells possible. |

### Race / ethnicity and other fields present in the file

| Column | Type | Description |
|--------|------|-------------|
| `pctwhite` | Numeric | Percentage of population recorded as white. |
| `pctblack` | Numeric | Percentage of population recorded as Black. |
| `pctasian` | Numeric | Percentage of population recorded as Asian. |
| `pctotherrace` | Numeric | Percentage of population in other race categories. |
| `pctmarriedhouseholds` | Numeric | Percentage of households that are married-couple households. |
| `birthrate` | Numeric | Birth rate in the county (per source definition). |

---

## Related project docs

The Observable notebook page `src/us-county-economy-health.md` summarizes **how these files are joined and used** in this repo (FIPS, choropleth, ecological caveat).

Dataset origin (context): [County-level cancer dataset (Kaggle)](https://www.kaggle.com/datasets/dannellyz/cancer-incidence-totals-and-rates-per-us-county).
