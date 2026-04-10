---
title: Data dictionary (project)
---

# INCA3 — Data dictionary (project)

Working document aligned with the **INCA3 (2014–15) data user guide** — **Anses 2019-UME-001** (updated January 2021), file `notice-utilisateurs-donnees-inca3-data.gouvjanv21.pdf` in this folder.

For **format codes** (`format_ouinon`, `format_sex`, etc.), see the **“LISTE DES FORMATS UTILISES DANS LES TABLES INCA3”** section of the PDF (from about page 87).

---

## Tables in this repository (open data)

| Table (guide) | File | Population (guide) | ID / key |
|---------------|------|-------------------|----------|
| DESCRIPTION_INDIV | `description-indiv.csv` | Pop1 / Pop2 / Pop3 | `NOIND` (individual), `NOMEN` (household) |
| HABITUDES_INDIV | `habitudes-indiv.csv` | Pop2 individual | `NOIND` (+ `POPULATION`) |
| HABITUDES_MEN | `habitudes-men.csv` | Pop2 household | `NOMEN` (+ `POPULATION`) |
| FPQ | `fpq.csv` | Pop2 individual | `NOIND` |
| OCCASIONS | `occasions.csv` | Pop3 | `NOIND` + `R24_num` + `occ_type` + `occ_hdeb` + `occ_lieu` (not unique alone) |
| NOMENCLATURE | `nomenclature-vf-mad-datagouv2021.csv` | Pop3 | see Nomenclature below |
| CONSO_GPE_INCA3 | `conso-gpe-inca3.csv` | Pop3 | `NOIND` |
| APPORTS_NUT_ALIM | `apports-nut-alim.csv` | Pop3 | `NOIND` |
| CONSO_CA_PROD | `conso-ca-prod.csv` | Pop1 | `NOIND` + `num_prod` |
| CONSO_CA_INDIV | `conso-ca-indiv.csv` | Pop1 | `NOIND` |

**Not included in this folder** (but described in the guide): **CONSO_COMPO_ALIM** (detailed consumption lines, `R24_pond`, `qte_conso` / `qte_conso_pond`), **ACTPHYS_SEDENT** (physical activity / sedentary behaviour).

CSV separator: **semicolon** (`;`).

---

## Populations and questionnaires (reminder)

- **Pop1 (ETUDE)**: home visit + FAF (socio-demographics, anthropometry, CA, PA children 3–17), etc.
- **Pop2 (AA)**: Pop1 + completed **individual and household** self-administered questionnaires.
- **Pop3 (CONSO)**: visit + individual AA (including FPQ) + **at least 2** 24 h recalls meeting study rules.

Indicative sample sizes (guide, summary table): 5,855 individuals in `DESCRIPTION_INDIV`; 4,372 in Pop2 for habits tables; 4,114 in Pop3 for aggregated consumption tables.

---

## `description-indiv.csv` — DESCRIPTION_INDIV (185 variables)

**Column order** in the CSV matches table **§3.1** in the guide (variables 1–185). Labels below are **English translations** of the official French wording.

| No. | Variable | Label (translated) |
|-----|----------|-------------------|
| 1 | `NOMEN` | Household number |
| 2 | `NOIND` | Individual number |
| 3 | `ech` | Child sample type: ADULTS/CHILDREN |
| 4 | `enf_allaite` | Breastfeeding type for breastfed children |
| 5 | `pop1` | ETUDE participant (FAF) |
| 6 | `pop2` | AA participant (FAF + individual AA + household AA) |
| 7 | `pop3` | CONSO participant (FAF + individual AA + FPQ + 2 or 3 R24) |
| 8 | `pond_indiv_adu_pop1` | Individual weight ADULTS - POP1 (ETUDE participants) |
| 9 | `pond_indiv_enf_pop1` | Individual weight CHILDREN - POP1 (ETUDE participants) |
| 10 | `pond_indiv_adu_pop2` | Individual weight ADULTS - POP2 (AA participants) |
| 11 | `pond_indiv_enf_pop2` | Individual weight CHILDREN - POP2 (AA participants) |
| 12 | `pond_indiv_adu_pop3` | Individual weight ADULTS - POP3 (CONSO participants) |
| 13 | `pond_indiv_enf_pop3` | Individual weight CHILDREN - POP3 (CONSO participants) |
| 14 | `pond_men_pop1` | Household weight - POP1 (ETUDE participants) |
| 15 | `pond_men_pop2` | Household weight - POP2 (AA participants) |
| 16 | `zae` | Dwelling ZAE (without districts for Paris/Lyon/Marseille) |
| 17 | `strate` | Stratum (INCA3 region × ZAE type) |
| 18 | `fpc1` | Finite population correction - level 1 = ZAE |
| 19 | `fpc2` | Finite population correction - level 2 = dwellings |
| 20 | `fpc3` | Finite population correction - level 3 = individuals |
| 21 | `saison_pop1` | Season of face-to-face questionnaires (Pop1) |
| 22 | `saison_pop2` | Season of self-administered questionnaires (Pop2) |
| 23 | `saison_pop3` | Season of R24 (Pop3) |
| 24 | `region_adm_12cl` | Administrative region in 12 classes (2015 regions) |
| 25 | `region_inca3` | INCA3 region in 8 classes (for stratification) |
| 26 | `agglo_5cl` | Urban area size in 5 classes |
| 27 | `sex_PS` | Sex of selected person (PS) |
| 28 | `tage_PS` | PS age in 9 classes |
| 29 | `tage_PS_mois` | PS age in months in 3 classes (0–35 months) |
| 30 | `lien_rep_enf` | Relationship of respondent to child |
| 31 | `diplome_interv` | Respondent — highest diploma |
| 32 | `etude_4cl_interv` | Respondent — education level in 4 classes |
| 33 | `situ_prof_5cl_interv` | Respondent — employment status in 5 classes |
| 34 | `atrav_interv` | Respondent — has ever worked in a job |
| 35 | `trav_nuit_interv` | Respondent — works at night |
| 36 | `trav_nuit_2cl_interv` | Respondent — night work in 2 classes |
| 37 | `PCS_8cl_interv` | Respondent — socio-occupational group (PCS) in 8 classes |
| 38 | `PCS_4cl_interv` | Respondent — PCS in 4 classes (ISCO coding) |
| 39 | `tps_travail_interv` | Respondent — type of working hours |
| 40 | `vacances_interv` | Respondent — took a holiday in the last 12 months |
| 41 | `interv_PR` | Respondent is the reference person (PR) |
| 42 | `sex_PR` | Sex of PR |
| 43 | `tage_PR` | PR age in 3 classes |
| 44 | `lien_interv_PR` | Relationship of respondent to household PR |
| 45 | `lien_PS_PR` | Relationship of PS to household PR |
| 46 | `diplome_PR` | Reference person — highest diploma |
| 47 | `etude_4cl_PR` | Reference person — education level in 4 classes |
| 48 | `atrav_PR` | Reference person — has ever worked in a job |
| 49 | `PCS_8cl_PR` | Reference person — PCS in 8 classes (PCSCHEF INCA2) |
| 50 | `PCS_4cl_PR` | Reference person — PCS in 4 classes (ISCO coding) |
| 51 | `tps_travail_PR` | Reference person — type of working hours |
| 52 | `stat_log_2cl` | Housing tenure in 2 classes (mortgage/rent due or not) |
| 53 | `soins` | Foregone healthcare for financial reasons |
| 54 | `situ_fin_3cl` | Perceived financial situation in 3 classes |
| 55 | `revenu` | Total monthly household income (incl. benefits, pensions, rent received) |
| 56 | `RUC_4cl` | Total monthly household income per consumption unit (CU) in 4 classes |
| 57 | `nbpers` | Number of people in the household |
| 58 | `nbadu` | Number of adults in the household |
| 59 | `nbenf` | Number of children under 18 in the household |
| 60 | `situ_alim_statut` | Food sufficiency status |
| 61 | `IA_statut` | Food insecurity status |
| 62 | `IA_score` | Food insecurity score |
| 63 | `taille_m` | Measured height (cm) |
| 64 | `taille_d` | Declared height (cm) |
| 65 | `taille` | Individual height (cm) measured or declared |
| 66 | `poids_m` | Measured weight (kg) |
| 67 | `poids_d` | Declared weight (kg) |
| 68 | `poids` | Individual weight (kg) measured or declared |
| 69 | `imc` | Body mass index (kg/m²) |
| 70 | `statnut` | Nutritional status |
| 71 | `maladie_allergie_alim` | Has gluten intolerance or food allergy |
| 72 | `intoall_confirm_med` | Food allergy or intolerance confirmed by a doctor |
| 73 | `regime_vegetarien` | Diet restriction because vegetarian or vegan |
| 74 | `regime_allergie` | Diet restriction because of allergy or intolerance |
| 75 | `regime_maigrir_med` | Diet restriction to lose weight (medical prescription) |
| 76 | `regime_maigrir_choix` | Diet restriction to lose weight (own initiative) |
| 77 | `regime_autre_med` | Diet restriction for another medical reason |
| 78 | `regime_raisonmed_libelle` | Diet restriction for another medical reason — free text |
| 79 | `regime_poidsstable` | Diet restriction to avoid weight gain |
| 80 | `regime_forme` | Diet restriction to stay in shape |
| 81 | `regime_autreraison` | Diet restriction for another reason |
| 82 | `regime_non` | No diet restriction |
| 83 | `veget_viande` | Vegetarian/vegan: never eats meat |
| 84 | `veget_prodmer` | Vegetarian/vegan: never eats seafood |
| 85 | `veget_prodlait` | Vegetarian/vegan: never eats dairy |
| 86 | `veget_oeuf` | Vegetarian/vegan: never eats eggs |
| 87 | `veget_miel` | Vegetarian/vegan: never eats honey |
| 88 | `veget_autre_alim` | Vegetarian/vegan: never eats other foods |
| 89 | `veget_autre_alim_libelle` | Vegetarian/vegan: never eats other foods — free text |
| 90 | `allergie_laitvache` | Allergy/intolerance to cow’s milk |
| 91 | `allergie_prepainfsoja` | Allergy/intolerance to soy-based infant formula |
| 92 | `allergie_prepainfamande` | Allergy/intolerance to almond-based infant formula |
| 93 | `allergie_gluten` | Gluten intolerance |
| 94 | `allergie_farineble` | Allergy to wheat flour |
| 95 | `allergie_lupin` | Allergy to lupin |
| 96 | `allergie_arachide` | Allergy to peanut |
| 97 | `allergie_fruitcoque` | Allergy to tree nuts |
| 98 | `allergie_fruitcoque_libelle` | Allergy to tree nuts — free text |
| 99 | `allergie_oeuf` | Allergy to eggs |
| 100 | `allergie_poisson` | Allergy to fish |
| 101 | `allergie_crustace` | Allergy to crustaceans |
| 102 | `allergie_mollusque` | Allergy to molluscs |
| 103 | `allergie_soja` | Allergy to soy |
| 104 | `allergie_sesame` | Allergy to sesame seeds |
| 105 | `allergie_moutarde` | Allergy to mustard seeds |
| 106 | `allergie_sulfite` | Allergy to sulphites |
| 107 | `allergie_celeri` | Allergy to celery |
| 108 | `allergie_autres_fruitleg` | Allergy to other fruit and vegetables |
| 109 | `allergie_autres_fl_libelle` | Allergy to other fruit and vegetables — free text |
| 110 | `allergie_autresalim` | Allergy to other foods |
| 111 | `allergie_autresalim_libelle` | Allergy to other foods — free text |
| 112 | `allergie_nondetermine` | Allergy to unspecified food |
| 113 | `allergie_fruits` | Allergy/intolerance to other fruit |
| 114 | `allergie_legumes` | Allergy/intolerance to other vegetables |
| 115 | `regime_passe` | Weight-loss diet followed in the past |
| 116 | `regime_nb_2dernann` | Number of weight-loss diets in the last 2 years |
| 117 | `regime_nb_anter2dernann` | Number of weight-loss diets before those 2 years |
| 118 | `regime_type` | Type of weight-loss diet most often followed |
| 119 | `regime_type_libelle` | Weight-loss diet from a book or magazine — free text |
| 120 | `regime_duree_sem` | Mean duration of diet in weeks |
| 121 | `regime_duree_mois` | Mean duration of diet in months |
| 122 | `regime_duree_nsp` | Does not know mean duration of diet |
| 123 | `poids_anndern` | Weight last year (kg) |
| 124 | `poids_anndern_nsp` | Does not know weight last year |
| 125 | `poids_modif` | Tried to lose, maintain, or gain weight in the past year |
| 126 | `poids_modifalim` | Tried to lose or maintain weight by changing diet |
| 127 | `poids_plusAP` | Tried to lose or maintain weight by increasing physical activity |
| 128 | `poids_medicaments` | Tried to lose or maintain weight using drugs or food supplements |
| 129 | `poids_substituts` | Tried to lose or maintain weight using meal replacements |
| 130 | `poids_chirurgie` | Tried to lose or maintain weight with surgery |
| 131 | `poids_modifalim_laityaourt` | Changed amounts consumed — milk and yogurt |
| 132 | `poids_modifalim_fromage` | Changed amounts consumed — cheese |
| 133 | `poids_modifalim_mg` | Changed amounts consumed — fats |
| 134 | `poids_modifalim_fruit` | Changed amounts consumed — fruit |
| 135 | `poids_modifalim_legume` | Changed amounts consumed — vegetables |
| 136 | `poids_modifalim_pdtfeculent` | Changed amounts consumed — potatoes and starchy foods |
| 137 | `poids_modifalim_pizza` | Changed amounts consumed — pizza, quiches, pastries |
| 138 | `poids_modifalim_pain` | Changed amounts consumed — bread |
| 139 | `poids_modifalim_vrouge` | Changed amounts consumed — red meat and charcuterie |
| 140 | `poids_modifalim_volaille` | Changed amounts consumed — poultry |
| 141 | `poids_modifalim_oeuf` | Changed amounts consumed — eggs |
| 142 | `poids_modifalim_gateau` | Changed amounts consumed — pastries, cakes, chocolate |
| 143 | `poids_modifalim_edulcorant` | Changed amounts consumed — sweeteners |
| 144 | `poids_modifalim_pdtsalleges` | Changed amounts consumed — “light” products |
| 145 | `poids_modifalim_BS` | Changed amounts consumed — sweet drinks |
| 146 | `poids_modifalim_eau` | Changed amounts consumed — water |
| 147 | `poids_modifalim_autre` | Changed amounts consumed — other foods |
| 148 | `poids_modifalim_autre_libelle` | Changed amounts consumed — other foods — free text |
| 149 | `poids_perception` | Currently thinks weight is normal, too high, or too low |
| 150 | `poidsmax` | Maximum weight since age 20 |
| 151 | `poidsmax_nsp` | Does not know maximum weight since age 20 |
| 152 | `age_poidsmax` | Age at maximum weight since age 20 |
| 153 | `age_poidsmax_nsp` | Does not know age at maximum weight since age 20 |
| 154 | `poidsmin` | Minimum weight since age 20 |
| 155 | `poidsmin_nsp` | Does not know minimum weight since age 20 |
| 156 | `age_poidsmin` | Age at minimum weight since age 20 |
| 157 | `age_poidsmin_nsp` | Does not know age at minimum weight since age 20 |
| 158 | `nb_prise_10kg` | Times lost and regained at least 10 kg since age 20 |
| 159 | `menopause` | Is menopausal (no periods for more than 1 year) |
| 160 | `enceinte` | Pregnant at time of survey |
| 161 | `enceinte_nbmois` | Months of pregnancy |
| 162 | `allaite` | Breastfeeding at time of survey |
| 163 | `allaite_nbsem` | Weeks of breastfeeding |
| 164 | `enceinte_12dermois` | Pregnant in the last 12 months |
| 165 | `fume` | Smokes, even occasionally |
| 166 | `nb_cigarettes_jour` | Cigarettes smoked per day |
| 167 | `nb_cigarettes_sem` | Cigarettes smoked per week |
| 168 | `nb_cigarettes_nsp` | Does not know number of cigarettes smoked |
| 169 | `nb_cigares_jour` | Cigars smoked per day |
| 170 | `nb_cigares_sem` | Cigars smoked per week |
| 171 | `nb_cigares_nsp` | Does not know number of cigars smoked |
| 172 | `nb_pipes_jour` | Pipes smoked per day |
| 173 | `nb_pipes_sem` | Pipes smoked per week |
| 174 | `nb_pipes_nsp` | Does not know number of pipes smoked |
| 175 | `fume_age_debut` | Age started smoking regularly |
| 176 | `fume_age_debut_nsp` | Does not know age started smoking regularly |
| 177 | `fume_age_arret` | Age stopped smoking permanently |
| 178 | `fume_age_arret_nsp` | Does not know age stopped smoking permanently |
| 179 | `bmr_kcal` | Estimated basal metabolic rate (Henry equation), energy (kcal/d) |
| 180 | `sousest0` | Under-reporters with Black and adjusted EI equations (INCA3) |
| 181 | `surest0` | Over-reporters with Black and adjusted EI equations (INCA3) |
| 182 | `sousest1` | Under-reporters with Black equations for 18+ (as INCA2) |
| 183 | `sousest3` | Under-reporters with log(energy) −3 SD for under 18 (as INCA2) |
| 184 | `sousext` | Under-reporters by extreme log(energy) −3 SD |
| 185 | `surext` | Over-reporters by extreme log(energy) +3 SD |

---

## `habitudes-indiv.csv` / `habitudes-men.csv`

- **Individual**: §**3.2.1** — 389 variables; CSV columns follow the guide table after `POPULATION`, `NOIND`, `periode_reference` (see PDF pp. 27–40). Topics: meal place and type, canteen, snacks, vending, fast food, preferences, table condiments, labels, information sources, raw foods / cheese rinds, washing fruit and vegetables, bottles, dietary diversity, garden, self-production, organic, barbecue, etc.
- **Household**: §**3.2.2** — 167 variables; key **`NOMEN`**; cooking vegetables, utensils, microwaves, purchase criteria, use-by dates, storage, water (well, tap, treatment), etc.

---

## `fpq.csv` — Food frequency questionnaire (§3.2.4)

384 variables; **Pop2**. General convention:

- Suffix **`_ON`**: consumption yes/no (`format_ouinon`) for the item.
- Suffix **`_freq_M`**: frequency (**days per month** for most items; for some “baby” items or modes, **times per month** — see exact wording in the guide).

Prefix hints: `PC_` breakfast/cereals; `RP_` starchy foods; `LEG_` vegetables; `VC_` meat-charcuterie; `PPM_` fish-seafood; `OE_` eggs; `SOJ_` soy; `PL_` dairy; `FR_` fruit; `BIS_` biscuits-confectionery; `BNA_` non-alcoholic drinks; `BA_` alcohol; suffixes `_bb_` / `_maison_` for child-specific / homemade. Item-by-item detail: guide table **pp. 52–65**.

---

## `occasions.csv` — OCCASIONS (§3.3.1)

| Variable | Label |
|----------|-------|
| `POPULATION` | Population |
| `NOIND` | Individual number |
| `R24_num` | 24-hour recall number |
| `R24_jour` | Weekday of the 24 h recall |
| `R24_nombre` | Number of 24 h recalls per individual |
| `sem_we` | Day type (weekday / weekend) |
| `sem_we_ferie` | Day type (weekday / weekend + public holidays) |
| `occ_ouinon` | Flag that the eating occasion occurred |
| `occ_hdeb` | Start time of the eating occasion |
| `occ_type` | Eating occasion type |
| `occ_lieu` | Place of the eating occasion |
| `occ_lieu_autre_libelle` | Other place — free text |
| `occ_lieu_dom_hors_dom` | Place (home / away from home) |

Unique days: deduplicate on `NOIND` + `R24_num`. Some occasions may repeat on the same day (see guide notes).

---

## `nomenclature-vf-mad-datagouv2021.csv` — NOMENCLATURE (§3.3.2)

The published file includes: `gpe_INCA3`, `aliment_code_INCA3`, INCA3 FR/EN labels, GloboDiet groups, facets **01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 13, 14, 19, 20, 25, 27**, FOODEX 2 codes and labels, `Freq` (citation frequency). Facets missing vs the full guide description are those not delivered in this data.gouv export.

---

## `conso-gpe-inca3.csv` — CONSO_GPE_INCA3 (§3.3.4)

**Mean daily intakes in g/d** by INCA3 food group (Pop3). Variables `conso_gpe1` … `conso_gpe44`:

| Var | Label |
|-----|-------|
| `conso_gpe1` | Refined bread and dry bakery |
| `conso_gpe2` | Wholegrain or semi-wholegrain bread and dry bakery |
| `conso_gpe3` | Breakfast cereals and cereal bars |
| `conso_gpe4` | Refined bread, rice, wheat and other cereals |
| `conso_gpe5` | Whole or semi-whole bread, rice, wheat and other cereals |
| `conso_gpe6` | Pastries, cakes and sweet biscuits |
| `conso_gpe7` | Milks |
| `conso_gpe8` | Yogurts and fresh cheeses |
| `conso_gpe9` | Cheeses |
| `conso_gpe10` | Dairy desserts and creams |
| `conso_gpe11` | Ice cream, frozen desserts and sorbets |
| `conso_gpe12` | Animal fats |
| `conso_gpe13` | Vegetable fats |
| `conso_gpe14` | Eggs and egg dishes |
| `conso_gpe15` | Meat (excl. poultry) |
| `conso_gpe16` | Poultry |
| `conso_gpe17` | Charcuterie |
| `conso_gpe18` | Fish |
| `conso_gpe19` | Crustaceans and molluscs |
| `conso_gpe20` | Offal |
| `conso_gpe21` | Vegetables |
| `conso_gpe22` | Pulses |
| `conso_gpe23` | Potatoes and other tubers |
| `conso_gpe24` | Fresh and dried fruit |
| `conso_gpe25` | Stewed fruit and fruit in syrup |
| `conso_gpe26` | Nuts, seeds and oilseeds |
| `conso_gpe27` | Confectionery and chocolate |
| `conso_gpe28` | Sugar and sweeteners |
| `conso_gpe29` | Packaged water |
| `conso_gpe30` | Tap water |
| `conso_gpe31` | Non-alcoholic refreshing drinks (BRSA) |
| `conso_gpe32` | Fruit and vegetable juices |
| `conso_gpe33` | Alcoholic drinks |
| `conso_gpe34` | Hot drinks |
| `conso_gpe35` | Soups and broths |
| `conso_gpe36` | Meat-based dishes |
| `conso_gpe37` | Fish-based dishes |
| `conso_gpe38` | Vegetable-based dishes |
| `conso_gpe39` | Potato-, cereal- or pulse-based dishes |
| `conso_gpe40` | Sandwiches, pizzas, tarts, savoury pastries and biscuits |
| `conso_gpe41` | Condiments, herbs, spices and sauces |
| `conso_gpe42` | Soy/other plant substitutes for animal products |
| `conso_gpe43` | Ready meals and infant desserts |
| `conso_gpe44` | Infant milks and drinks |

---

## `apports-nut-alim.csv` — APPORTS_NUT_ALIM (§3.3.5)

**Daily** intakes estimated from 2–3 R24 days (Pop3); contributions to **AESA**; intakes **per 100 kcal** for micronutrients.

| Variable | Label |
|----------|-------|
| `nutriment1` | Energy — TEI (kcal/d) |
| `nutriment2` | Energy — EI (kcal/d) |
| `nutriment3` | Protein (g/d) |
| `nutriment4` | Carbohydrate (g/d) |
| `nutriment5` | Sugars (g/d) |
| `nutriment6` | Starch (g/d) |
| `nutriment7` | Polyols (g/d) |
| `nutriment8` | Fibre (g/d) |
| `nutriment9` | Organic acids (g/d) |
| `nutriment10` | Fat (g/d) |
| `nutriment11` | SFA (g/d) |
| `nutriment12` | Palmitic acid (g/d) |
| `nutriment13` | Stearic acid (g/d) |
| `nutriment14` | Myristic acid (g/d) |
| `nutriment15` | Lauric acid (g/d) |
| `nutriment16` | Capric acid (g/d) |
| `nutriment17` | Butyric acid (g/d) |
| `nutriment18` | Caproic acid (g/d) |
| `nutriment19` | Caprylic acid (g/d) |
| `nutriment20` | MUFA (g/d) |
| `nutriment21` | Oleic acid (g/d) |
| `nutriment22` | PUFA (g/d) |
| `nutriment23` | Linoleic acid (g/d) |
| `nutriment24` | α-Linolenic acid (g/d) |
| `nutriment25` | Arachidonic acid (mg/d) |
| `nutriment26` | EPA (mg/d) |
| `nutriment27` | DHA (mg/d) |
| `nutriment28` | Alcohol (g/d) |
| `nutriment29` | Water (g/d) |
| `nutriment30` | Sodium (mg/d) |
| `nutriment31` | Salt (g/d) |
| `nutriment32` | Magnesium (mg/d) |
| `nutriment33` | Phosphorus (mg/d) |
| `nutriment34` | Potassium (mg/d) |
| `nutriment35` | Calcium (mg/d) |
| `nutriment36` | Manganese (mg/d) |
| `nutriment37` | Iron (mg/d) |
| `nutriment38` | Copper (mg/d) |
| `nutriment39` | Zinc (mg/d) |
| `nutriment40` | Selenium (µg/d) |
| `nutriment41` | Iodine (µg/d) |
| `nutriment42` | Retinol (µg/d) |
| `nutriment43` | Beta-carotene (µg/d) |
| `nutriment44` | Vitamin B1 — Thiamin (mg/d) |
| `nutriment45` | Vitamin B2 — Riboflavin (mg/d) |
| `nutriment46` | Vitamin B3 — Niacin (mg/d) |
| `nutriment47` | Vitamin B5 — Pantothenic acid (mg/d) |
| `nutriment48` | Vitamin B6 — Pyridoxine (mg/d) |
| `nutriment49` | Vitamin B9 — Folic acid (µg/d) |
| `nutriment50` | Vitamin B12 — Cobalamin (µg/d) |
| `nutriment51` | Vitamin C (mg/d) |
| `nutriment52` | Vitamin D (µg/d) |
| `nutriment53` | Vitamin E (mg/d) |
| `nutriment54` | Vitamin K2 (µg/d) |
| `contrib3`–`contrib10` | Macronutrient (and sub-) contributions to **EI** (%) |
| `contrib11`–`contrib29` | Fat / FA / alcohol / water contributions to EI or TEI (see guide) |
| `contrib30`–`contrib54` | Intakes **per 100 kcal** (sodium → vitamin K2) |

Exact detail for each `contrib*` is in guide table §3.3.5 (PDF pp. 78–82).

---

## `conso-ca-prod.csv` / `conso-ca-indiv.csv` (§3.4)

**Products** (`CONSO_CA_PROD`, Pop1): up to **5** products per individual; key `NOIND` + `num_prod`. Variables: `periode_reference`, `num_ligne_CA`, `type_prod`, `classif_reg_prod`, `classif_prod`, `pres_prod`, `nb_unit_prod`, `mode_conso_prod`, `nb_jours_an` (see guide pp. 83–84).

**Individual** (`CONSO_CA_INDIV`, Pop1): food supplement consumer status (broad vs regulatory), counts, preferred seasons (`saison_*`, `saison_autre_libelle`, `saison_nsp`) — guide pp. 85–86.

---

## Reference period (PR)

For many questionnaires (habits, FPQ, food supplements), **retrospective length** depends on age: **1 month** (≤15 months), **3 months** (16–24 months), **6 months** (25–35 months), **12 months** (3–79 years). See variable `periode_reference` where present.
