# INCA3 — Dictionnaire des données (projet)

Document de travail aligné sur la **Notice d’utilisation des données de l’étude INCA3 (2014-15)** — **Anses 2019-UME-001** (mise à jour janvier 2021), fichier `notice-utilisateurs-donnees-inca3-data.gouvjanv21.pdf` dans ce dossier.

Pour les **codes de format** (`format_ouinon`, `format_sex`, etc.), se référer à la section **« LISTE DES FORMATS UTILISES DANS LES TABLES INCA3 »** du PDF (à partir d’environ la page 87).

---

## Tables fournies dans ce dépôt (open data)

| Table (notice) | Fichier | Population (notice) | Identifiant / clé |
|----------------|---------|---------------------|-------------------|
| DESCRIPTION_INDIV | `description-indiv.csv` | Pop1 / Pop2 / Pop3 | `NOIND` (individu), `NOMEN` (ménage) |
| HABITUDES_INDIV | `habitudes-indiv.csv` | Pop2 individu | `NOIND` (+ `POPULATION`) |
| HABITUDES_MEN | `habitudes-men.csv` | Pop2 ménage | `NOMEN` (+ `POPULATION`) |
| FPQ | `fpq.csv` | Pop2 individu | `NOIND` |
| OCCASIONS | `occasions.csv` | Pop3 | `NOIND` + `R24_num` + `occ_type` + `occ_hdeb` + `occ_lieu` (non unique seul) |
| NOMENCLATURE | `nomenclature-vf-mad-datagouv2021.csv` | Pop3 | voir § Nomenclature ci-dessous |
| CONSO_GPE_INCA3 | `conso-gpe-inca3.csv` | Pop3 | `NOIND` |
| APPORTS_NUT_ALIM | `apports-nut-alim.csv` | Pop3 | `NOIND` |
| CONSO_CA_PROD | `conso-ca-prod.csv` | Pop1 | `NOIND` + `num_prod` |
| CONSO_CA_INDIV | `conso-ca-indiv.csv` | Pop1 | `NOIND` |

**Non présent dans ce dossier** (mais décrit dans la notice) : **CONSO_COMPO_ALIM** (lignes de consommation détaillées, `R24_pond`, `qte_conso` / `qte_conso_pond`), **ACTPHYS_SEDENT** (activité physique / sédentarité).

Séparateur des CSV : **point-virgule** (`;`).

---

## Populations et questionnaires (rappel)

- **Pop1 (ETUDE)** : participation visite à domicile + FAF (socio-démo, anthropométrie, CA, AP enfants 3–17 ans), etc.
- **Pop2 (AA)** : Pop1 + questionnaires auto-administrés **individuel et ménage** complets.
- **Pop3 (CONSO)** : visite + AA individuel (dont FPQ) + **au moins 2** entretiens 24 h conformes aux exigences de l’étude.

Effectifs indicatifs (notice, tableau récapitulatif) : 5 855 individus décrits dans `DESCRIPTION_INDIV` ; 4 372 en Pop2 pour les tables habitudes ; 4 114 en Pop3 pour les tables consommations agrégées.

---

## `description-indiv.csv` — DESCRIPTION_INDIV (185 variables)

L’**ordre des colonnes** du CSV est celui du tableau **§3.1** de la notice (variables n°1 à n°185).

| n° | Variable | Libellé (notice) |
|----|----------|------------------|
| 1 | `NOMEN` | Numéro de ménage |
| 2 | `NOIND` | Numéro d'individu |
| 3 | `ech` | Type d'échantillon d'enfants : ADULTES/ENFANTS |
| 4 | `enf_allaite` | Type d'allaitement pour enfants allaités |
| 5 | `pop1` | Participant ETUDE (FAF) |
| 6 | `pop2` | Participant AA (FAF + AA individuel + AA ménage) |
| 7 | `pop3` | Participant CONSO (FAF + AA individuel + FPQ + 2 ou 3 R24) |
| 8 | `pond_indiv_adu_pop1` | Pondération individuelle ADULTES - POP1 (participants ETUDE) |
| 9 | `pond_indiv_enf_pop1` | Pondération individuelle ENFANTS - POP1 (participants ETUDE) |
| 10 | `pond_indiv_adu_pop2` | Pondération individuelle ADULTES - POP2 (participants AA) |
| 11 | `pond_indiv_enf_pop2` | Pondération individuelle ENFANTS - POP2 (participants AA) |
| 12 | `pond_indiv_adu_pop3` | Pondération individuelle ADULTES - POP3 (participants CONSO) |
| 13 | `pond_indiv_enf_pop3` | Pondération individuelle ENFANTS - POP3 (participants CONSO) |
| 14 | `pond_men_pop1` | Pondération MENAGES - POP1 (participants ETUDE) |
| 15 | `pond_men_pop2` | Pondération MENAGES - POP2 (participants AA) |
| 16 | `zae` | ZAE du logement (sans les arrondissements pour Paris/Lyon/Marseille) |
| 17 | `strate` | Strate (Région Inca3 × type de ZAE) |
| 18 | `fpc1` | Correction en population finie - degré 1 = ZAE |
| 19 | `fpc2` | Correction en population finie - degré 2 = logements |
| 20 | `fpc3` | Correction en population finie - degré 3 = individus |
| 21 | `saison_pop1` | Saison des questionnaires Face-à-Face (Pop1) |
| 22 | `saison_pop2` | Saison des questionnaires Auto-Administrés (Pop2) |
| 23 | `saison_pop3` | Saison des R24 (Pop3) |
| 24 | `region_adm_12cl` | Région administrative en 12 classes (nouvelles régions 2015) |
| 25 | `region_inca3` | Région INCA3 en 8 classes (pour stratification) |
| 26 | `agglo_5cl` | Taille d'agglomération en 5 classes |
| 27 | `sex_PS` | Sexe de la personne sélectionnée (PS) |
| 28 | `tage_PS` | Âge de la PS en 9 classes |
| 29 | `tage_PS_mois` | Âge de la PS en mois en 3 classes (pour les 0–35 mois) |
| 30 | `lien_rep_enf` | Lien du représentant avec l'enfant |
| 31 | `diplome_interv` | Interviewé - Diplôme le plus élevé |
| 32 | `etude_4cl_interv` | Interviewé - Niveau d'étude en 4 classes |
| 33 | `situ_prof_5cl_interv` | Interviewé - Situation professionnelle en 5 classes |
| 34 | `atrav_interv` | Interviewé - A déjà exercé une profession |
| 35 | `trav_nuit_interv` | Interviewé - Travaille la nuit |
| 36 | `trav_nuit_2cl_interv` | Interviewé - Travail de nuit en 2 classes |
| 37 | `PCS_8cl_interv` | Interviewé - PCS en 8 classes |
| 38 | `PCS_4cl_interv` | Interviewé - PCS en 4 classes (classement ISCO) |
| 39 | `tps_travail_interv` | Interviewé - Type de temps de travail |
| 40 | `vacances_interv` | Interviewé - Parti en vacances au cours des 12 derniers mois |
| 41 | `interv_PR` | Personne interviewée est la personne de référence (PR) |
| 42 | `sex_PR` | Sexe de la PR |
| 43 | `tage_PR` | Âge de la PR en 3 classes |
| 44 | `lien_interv_PR` | Lien de l'interviewé avec la PR du ménage |
| 45 | `lien_PS_PR` | Lien de la PS avec la PR du ménage |
| 46 | `diplome_PR` | Personne de référence - Diplôme le plus élevé |
| 47 | `etude_4cl_PR` | Personne de référence - Niveau d'étude en 4 classes |
| 48 | `atrav_PR` | Personne de référence - A déjà exercé une profession |
| 49 | `PCS_8cl_PR` | Personne de référence - PCS en 8 classes (PCSCHEF INCA2) |
| 50 | `PCS_4cl_PR` | Personne de référence - PCS en 4 classes (classement ISCO) |
| 51 | `tps_travail_PR` | Personne de référence - Type de temps de travail |
| 52 | `stat_log_2cl` | Statut d'occupation du logement en 2 classes selon emprunt/loyer à payer ou pas |
| 53 | `soins` | Renoncement à des soins de santé pour des raisons financières |
| 54 | `situ_fin_3cl` | Perception de sa situation financière en 3 classes |
| 55 | `revenu` | Revenu mensuel total du foyer (y c. alloc. sociales, pensions, loyers perçus) |
| 56 | `RUC_4cl` | Revenu mensuel total du foyer par unité de consommation (UC) en 4 classes |
| 57 | `nbpers` | Nombre de personnes vivant dans le ménage |
| 58 | `nbadu` | Nombre d'adultes vivant dans le ménage |
| 59 | `nbenf` | Nombre d'enfants de moins de 18 ans vivant dans le ménage |
| 60 | `situ_alim_statut` | Statut de suffisance alimentaire |
| 61 | `IA_statut` | Statut d'insécurité alimentaire |
| 62 | `IA_score` | Score d'insécurité alimentaire |
| 63 | `taille_m` | Taille mesurée (cm) |
| 64 | `taille_d` | Taille déclarée (cm) |
| 65 | `taille` | Taille de l'individu (cm) mesurée ou déclarée |
| 66 | `poids_m` | Poids mesuré (kg) |
| 67 | `poids_d` | Poids déclaré (kg) |
| 68 | `poids` | Poids de l'individu (kg) mesuré ou déclaré |
| 69 | `imc` | Indice de masse corporel (kg/m²) |
| 70 | `statnut` | Statut nutritionnel |
| 71 | `maladie_allergie_alim` | Souffre d'une intolérance au gluten ou allergie alimentaire |
| 72 | `intoall_confirm_med` | Allergie ou intolérance alimentaire confirmée par un médecin |
| 73 | `regime_vegetarien` | Restrictions ou régime car végétarien ou végétalien |
| 74 | `regime_allergie` | Restrictions ou régime car allergie ou intolérance |
| 75 | `regime_maigrir_med` | Restrictions ou régime pour maigrir (prescription médicale) |
| 76 | `regime_maigrir_choix` | Restrictions ou régime pour maigrir (propre initiative) |
| 77 | `regime_autre_med` | Restrictions ou régime pour une autre raison médicale |
| 78 | `regime_raisonmed_libelle` | Restrictions ou régime pour une autre raison médicale - libellé |
| 79 | `regime_poidsstable` | Restrictions ou régime pour ne pas prendre de poids |
| 80 | `regime_forme` | Restrictions ou régime pour rester en forme |
| 81 | `regime_autreraison` | Restrictions ou régime pour une autre raison |
| 82 | `regime_non` | Pas de restrictions ou régime |
| 83 | `veget_viande` | Végétarien/végétalien : ne mange jamais de viandes |
| 84 | `veget_prodmer` | Végétarien/végétalien : ne mange jamais de produits de la mer |
| 85 | `veget_prodlait` | Végétarien/végétalien : ne mange jamais de produits laitiers |
| 86 | `veget_oeuf` | Végétarien/végétalien : ne mange jamais d'oeufs |
| 87 | `veget_miel` | Végétarien/végétalien : ne mange jamais de miel |
| 88 | `veget_autre_alim` | Végétarien/végétalien : ne mange jamais autres aliments |
| 89 | `veget_autre_alim_libelle` | Végétarien/végétalien : ne mange jamais autres aliments - libellé |
| 90 | `allergie_laitvache` | Allergie/Intolérance au lait de vache |
| 91 | `allergie_prepainfsoja` | Allergie/Intolérance aux préparations infantiles à base de soja |
| 92 | `allergie_prepainfamande` | Allergie/Intolérance aux préparations infantiles à base d'amande |
| 93 | `allergie_gluten` | Intolérance au gluten |
| 94 | `allergie_farineble` | Allergie à la farine de blé |
| 95 | `allergie_lupin` | Allergie au lupin |
| 96 | `allergie_arachide` | Allergie à l'arachide |
| 97 | `allergie_fruitcoque` | Allergie aux fruits à coque |
| 98 | `allergie_fruitcoque_libelle` | Allergie aux fruits à coque - libellé |
| 99 | `allergie_oeuf` | Allergie aux oeufs |
| 100 | `allergie_poisson` | Allergie aux poissons |
| 101 | `allergie_crustace` | Allergie aux crustacés |
| 102 | `allergie_mollusque` | Allergie aux mollusques |
| 103 | `allergie_soja` | Allergie au soja |
| 104 | `allergie_sesame` | Allergie aux graines de sésame |
| 105 | `allergie_moutarde` | Allergie aux graines de moutarde |
| 106 | `allergie_sulfite` | Allergie aux sulfites |
| 107 | `allergie_celeri` | Allergie au céleri |
| 108 | `allergie_autres_fruitleg` | Allergie à d'autres fruits et légumes |
| 109 | `allergie_autres_fl_libelle` | Allergie à d'autres fruits et légumes - libellé |
| 110 | `allergie_autresalim` | Allergie à d'autres aliments |
| 111 | `allergie_autresalim_libelle` | Allergie à d'autres aliments - libellé |
| 112 | `allergie_nondetermine` | Allergie à un aliment indéterminé |
| 113 | `allergie_fruits` | Allergie/Intolérance à d'autres fruits |
| 114 | `allergie_legumes` | Allergie/Intolérance à d'autres légumes |
| 115 | `regime_passe` | Régime pour perdre du poids suivi par le passé |
| 116 | `regime_nb_2dernann` | Nombre de régimes pour perdre du poids suivis au cours des 2 dernières années |
| 117 | `regime_nb_anter2dernann` | Nombre de régimes pour perdre du poids suivis avant ces 2 dernières années |
| 118 | `regime_type` | Type de régimes pour perdre du poids suivis le plus souvent |
| 119 | `regime_type_libelle` | Régime pour perdre du poids publié dans un livre ou un magazine - libellé |
| 120 | `regime_duree_sem` | Durée moyenne en semaine du régime suivi |
| 121 | `regime_duree_mois` | Durée moyenne en mois du régime suivi |
| 122 | `regime_duree_nsp` | Ne sait pas la durée moyenne de suivi du régime |
| 123 | `poids_anndern` | Poids l'année dernière en kg |
| 124 | `poids_anndern_nsp` | Ne sait pas le poids qu'il faisait l'année dernière |
| 125 | `poids_modif` | A essayé de perdre, ne pas prendre ou de gagner du poids depuis un an |
| 126 | `poids_modifalim` | A essayé de perdre, ne pas prendre de poids en modifiant son alimentation |
| 127 | `poids_plusAP` | A essayé de perdre, ne pas prendre de poids en augmentant son activité physique |
| 128 | `poids_medicaments` | A essayé de perdre, ne pas prendre de poids en prenant des médicaments, CA |
| 129 | `poids_substituts` | A essayé de perdre, ne pas prendre de poids en prenant des substituts de repas |
| 130 | `poids_chirurgie` | A essayé de perdre, ne pas prendre de poids par une intervention chirurgicale |
| 131 | `poids_modifalim_laityaourt` | Modification des quantités consommées - Lait et yaourt |
| 132 | `poids_modifalim_fromage` | Modification des quantités consommées - Fromage |
| 133 | `poids_modifalim_mg` | Modification des quantités consommées - Matières grasses |
| 134 | `poids_modifalim_fruit` | Modification des quantités consommées - Fruits |
| 135 | `poids_modifalim_legume` | Modification des quantités consommées - Légumes |
| 136 | `poids_modifalim_pdtfeculent` | Modification des quantités consommées - Pommes de terre et féculents |
| 137 | `poids_modifalim_pizza` | Modification des quantités consommées - Pizza, quiches, feuilletés |
| 138 | `poids_modifalim_pain` | Modification des quantités consommées - Pain |
| 139 | `poids_modifalim_vrouge` | Modification des quantités consommées - Viandes rouges et charcuteries |
| 140 | `poids_modifalim_volaille` | Modification des quantités consommées - Volailles |
| 141 | `poids_modifalim_oeuf` | Modification des quantités consommées - Oeufs |
| 142 | `poids_modifalim_gateau` | Modification des quantités consommées - Pâtisseries, gâteaux, chocolats |
| 143 | `poids_modifalim_edulcorant` | Modification des quantités consommées - Edulcorants |
| 144 | `poids_modifalim_pdtsalleges` | Modification des quantités consommées - Produits allégés |
| 145 | `poids_modifalim_BS` | Modification des quantités consommées - Boissons sucrées |
| 146 | `poids_modifalim_eau` | Modification des quantités consommées - Eaux |
| 147 | `poids_modifalim_autre` | Modification des quantités consommées - Autres aliments |
| 148 | `poids_modifalim_autre_libelle` | Modification des quantités consommées - Autres aliments - libellés |
| 149 | `poids_perception` | Actuellement pense qu'il est normal, trop gros ou trop maigre |
| 150 | `poidsmax` | Poids maximum atteint depuis l'âge de 20 ans |
| 151 | `poidsmax_nsp` | Ne sait pas le poids maximum atteint depuis l'âge de 20 ans |
| 152 | `age_poidsmax` | Âge auquel le poids maximum a été atteint depuis l'âge de 20 ans |
| 153 | `age_poidsmax_nsp` | Ne sait pas l'âge auquel le poids maximum a été atteint depuis l'âge de 20 ans |
| 154 | `poidsmin` | Poids minimum atteint depuis l'âge de 20 ans |
| 155 | `poidsmin_nsp` | Ne sait pas le poids minimum atteint depuis l'âge de 20 ans |
| 156 | `age_poidsmin` | Âge auquel le poids minimum a été atteint depuis l'âge de 20 ans |
| 157 | `age_poidsmin_nsp` | Ne sait pas l'âge auquel le poids minimum a été atteint depuis l'âge de 20 ans |
| 158 | `nb_prise_10kg` | Nombre de fois où a perdu et repris au moins 10 kg depuis l'âge de 20 ans |
| 159 | `menopause` | Est ménopausée (absence de règles depuis plus de 1 an) |
| 160 | `enceinte` | Enceinte au moment de l'étude |
| 161 | `enceinte_nbmois` | Nombre de mois de grossesse |
| 162 | `allaite` | Allaite au moment de l'étude |
| 163 | `allaite_nbsem` | Nombre de semaines d'allaitement |
| 164 | `enceinte_12dermois` | A été enceinte au cours des 12 derniers mois |
| 165 | `fume` | Fume, même de temps en temps |
| 166 | `nb_cigarettes_jour` | Nombre de cigarettes fumées/jour |
| 167 | `nb_cigarettes_sem` | Nombre de cigarettes fumées/semaine |
| 168 | `nb_cigarettes_nsp` | Ne sait pas le nombre de cigarettes fumées |
| 169 | `nb_cigares_jour` | Nombre de cigares fumés/jour |
| 170 | `nb_cigares_sem` | Nombre de cigares fumés/semaine |
| 171 | `nb_cigares_nsp` | Ne sait pas le nombre de cigares fumés |
| 172 | `nb_pipes_jour` | Nombre de pipes fumées/jour |
| 173 | `nb_pipes_sem` | Nombre de pipes fumées/semaine |
| 174 | `nb_pipes_nsp` | Ne sait pas le nombre de pipes fumées |
| 175 | `fume_age_debut` | Âge auquel a commencé à fumer régulièrement |
| 176 | `fume_age_debut_nsp` | Ne sait pas l'âge auquel a commencé à fumer régulièrement |
| 177 | `fume_age_arret` | Âge auquel a arrêté définitivement de fumer |
| 178 | `fume_age_arret_nsp` | Ne sait pas l'âge auquel a arrêté définitivement de fumer |
| 179 | `bmr_kcal` | Métabolisme de base estimé (équation de Henry) énergétique (kcal/j) |
| 180 | `sousest0` | Sous-estimateurs avec équations de Black et NAP ajustés (INCA3) |
| 181 | `surest0` | Sur-estimateurs avec équations de Black et NAP ajustés (INCA3) |
| 182 | `sousest1` | Sous-estimateurs avec équations de Black pour les +18 ans (idem INCA2) |
| 183 | `sousest3` | Sous-estimateurs avec log(énergie)-3 sd pour les -18 ans (idem INCA2) |
| 184 | `sousext` | Sous-estimateurs par valeurs extrêmes log(énergie)-3 sd |
| 185 | `surext` | Sur-estimateurs par valeurs extrêmes log(énergie)+3 sd |

---

## `habitudes-indiv.csv` / `habitudes-men.csv`

- **Individu** : §**3.2.1** — 389 variables ; les colonnes du CSV suivent l’ordre du tableau de la notice après `POPULATION`, `NOIND`, `periode_reference` (voir PDF pages 27–40). Thématiques : lieu et type de repas, cantine, collations, distributeurs, restauration rapide, préférences, condiments sur table, étiquettes, sources d’info, denrées crues / croûtes de fromage, lavage des fruits-légumes, biberons, diversification, jardin, autoconsommation, bio, barbecue, etc.
- **Ménage** : §**3.2.2** — 167 variables ; clé **`NOMEN`** ; préparation des légumes cuits, ustensiles, micro-ondes, critères d’achat, DLC, conservation, eau (puits, robinet, traitements), etc.

---

## `fpq.csv` — Fréquentiel alimentaire (§3.2.4)

384 variables ; **Pop2**. Convention générale :

- Suffixe **`_ON`** : consommation oui/non (`format_ouinon`) pour l’item.
- Suffixe **`_freq_M`** : fréquence (nombre de **jours par mois** pour la plupart des items ; pour items « bébé » / certaines modalités, **fois par mois** — voir libellé exact dans la notice).

Préfixes indicatifs : `PC_` petit-déjeuner/céréales ; `RP_` féculents ; `LEG_` légumes ; `VC_` viande-charcuterie ; `PPM_` poisson-produits mer ; `OE_` œufs ; `SOJ_` soja ; `PL_` produits laitiers ; `FR_` fruits ; `BIS_` biscuits-confiseries ; `BNA_` boissons non alcoolisées ; `BA_` alcool ; suffixes `_bb_` / `_maison_` pour filiations enfant / fait maison. Détail item par item : tableau **p.52–65** du PDF.

---

## `occasions.csv` — OCCASIONS (§3.3.1)

| Variable | Libellé |
|----------|---------|
| `POPULATION` | Population |
| `NOIND` | Numéro d'individu |
| `R24_num` | Numéro du rappel de 24 heures |
| `R24_jour` | Jour de la semaine du rappel de 24 h |
| `R24_nombre` | Nombre de rappels de 24 h par individu |
| `sem_we` | Type de jour (semaine / week-end) |
| `sem_we_ferie` | Type de jour (semaine / week-end + jours fériés) |
| `occ_ouinon` | Témoin de prise de l'occasion |
| `occ_hdeb` | Heure de début de l'occasion de consommation |
| `occ_type` | Occasion de consommation |
| `occ_lieu` | Lieu de l'occasion de consommation |
| `occ_lieu_autre_libelle` | Autre lieu — libellé |
| `occ_lieu_dom_hors_dom` | Lieu (domicile / hors domicile) |

Journées uniques : dédoublonner sur `NOIND` + `R24_num`. Certaines occasions peuvent être répétées le même jour (voir remarques notice).

---

## `nomenclature-vf-mad-datagouv2021.csv` — NOMENCLATURE (§3.3.2)

Le fichier publié contient notamment : `gpe_INCA3`, `aliment_code_INCA3`, libellés INCA3 FR/EN, groupes GloboDiet, facettes **01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 13, 14, 19, 20, 25, 27**, codes et libellés FOODEX 2, `Freq` (fréquence de citation). Les facettes absentes par rapport au descriptif complet de la notice sont celles non livrées dans ce export data.gouv.

---

## `conso-gpe-inca3.csv` — CONSO_GPE_INCA3 (§3.3.4)

Consommations **moyennes journalières en g/j** par groupe INCA3 (Pop3). Variables `conso_gpe1` … `conso_gpe44` :

| Var | Libellé |
|-----|---------|
| `conso_gpe1` | Pain et panification sèche raffinés |
| `conso_gpe2` | Pain et panification sèche complets ou semi-complets |
| `conso_gpe3` | Céréales pour petit déjeuner et barres céréalières |
| `conso_gpe4` | Pain, riz, blé et autres céréales raffinées |
| `conso_gpe5` | Pain, riz, blé et autres céréales complètes/semi-completes |
| `conso_gpe6` | Viennoiseries, pâtisseries, gâteaux et biscuits sucrés |
| `conso_gpe7` | Laits |
| `conso_gpe8` | Yaourts et fromages blancs |
| `conso_gpe9` | Fromages |
| `conso_gpe10` | Entremets et crèmes desserts |
| `conso_gpe11` | Glaces, desserts glacés et sorbets |
| `conso_gpe12` | Matières grasses animales |
| `conso_gpe13` | Matières grasses végétales |
| `conso_gpe14` | Œufs et plats à base d'œufs |
| `conso_gpe15` | Viandes (hors volailles) |
| `conso_gpe16` | Volailles |
| `conso_gpe17` | Charcuterie |
| `conso_gpe18` | Poissons |
| `conso_gpe19` | Crustacés et mollusques |
| `conso_gpe20` | Abats |
| `conso_gpe21` | Légumes |
| `conso_gpe22` | Légumineuses |
| `conso_gpe23` | Pommes de terre et autres tubercules |
| `conso_gpe24` | Fruits frais et secs |
| `conso_gpe25` | Compotes et fruits au sirop |
| `conso_gpe26` | Noix, graines et fruits oléagineux |
| `conso_gpe27` | Confiseries et chocolat |
| `conso_gpe28` | Sucre et matières sucrantes |
| `conso_gpe29` | Eaux conditionnées |
| `conso_gpe30` | Eau du robinet |
| `conso_gpe31` | Boissons rafraîchissantes sans alcool (BRSA) |
| `conso_gpe32` | Jus de fruits et de légumes |
| `conso_gpe33` | Boissons alcoolisées |
| `conso_gpe34` | Boissons chaudes |
| `conso_gpe35` | Soupes et bouillons |
| `conso_gpe36` | Plats à base de viandes |
| `conso_gpe37` | Plats à base de poissons |
| `conso_gpe38` | Plats à base de légumes |
| `conso_gpe39` | Plats à base de pommes de terre, céréales ou légumineuses |
| `conso_gpe40` | Sandwichs, pizzas, tartes, pâtisseries et biscuits salés |
| `conso_gpe41` | Condiments, herbes, épices et sauces |
| `conso_gpe42` | Substituts de prod. animaux à base de soja/autres végétaux |
| `conso_gpe43` | Plats préparés et desserts infantiles |
| `conso_gpe44` | Laits et boissons infantiles |

---

## `apports-nut-alim.csv` — APPORTS_NUT_ALIM (§3.3.5)

Apports **journaliers** estimés à partir des 2–3 jours de R24 (Pop3) ; contributions à l’**AESA** ; apports pour **100 kcal** pour micro-nutriments.

| Variable | Libellé |
|----------|---------|
| `nutriment1` | Énergie — AET (kcal/j) |
| `nutriment2` | Énergie — AESA (kcal/j) |
| `nutriment3` | Protéines (g/j) |
| `nutriment4` | Glucides (g/j) |
| `nutriment5` | Sucres (g/j) |
| `nutriment6` | Amidon (g/j) |
| `nutriment7` | Polyols (g/j) |
| `nutriment8` | Fibres (g/j) |
| `nutriment9` | Acides organiques (g/j) |
| `nutriment10` | Lipides (g/j) |
| `nutriment11` | AGS (g/j) |
| `nutriment12` | Acide palmitique (g/j) |
| `nutriment13` | Acide stéarique (g/j) |
| `nutriment14` | Acide myristique (g/j) |
| `nutriment15` | Acide laurique (g/j) |
| `nutriment16` | Acide caprique (g/j) |
| `nutriment17` | Acide butyrique (g/j) |
| `nutriment18` | Acide caproïque (g/j) |
| `nutriment19` | Acide caprylique (g/j) |
| `nutriment20` | AGMI (g/j) |
| `nutriment21` | Acide oléique (g/j) |
| `nutriment22` | AGPI (g/j) |
| `nutriment23` | Acide linoléique (g/j) |
| `nutriment24` | Acide α-linolénique (g/j) |
| `nutriment25` | Acide arachidonique (mg/j) |
| `nutriment26` | Acide EPA (mg/j) |
| `nutriment27` | Acide DHA (mg/j) |
| `nutriment28` | Alcool (g/j) |
| `nutriment29` | Eau (g/j) |
| `nutriment30` | Sodium (mg/j) |
| `nutriment31` | Sel (g/j) |
| `nutriment32` | Magnésium (mg/j) |
| `nutriment33` | Phosphore (mg/j) |
| `nutriment34` | Potassium (mg/j) |
| `nutriment35` | Calcium (mg/j) |
| `nutriment36` | Manganèse (mg/j) |
| `nutriment37` | Fer (mg/j) |
| `nutriment38` | Cuivre (mg/j) |
| `nutriment39` | Zinc (mg/j) |
| `nutriment40` | Sélénium (µg/j) |
| `nutriment41` | Iode (µg/j) |
| `nutriment42` | Rétinol (µg/j) |
| `nutriment43` | Bétacarotène (µg/j) |
| `nutriment44` | Vitamine B1 — Thiamine (mg/j) |
| `nutriment45` | Vitamine B2 — Riboflavine (mg/j) |
| `nutriment46` | Vitamine B3 — Niacine (mg/j) |
| `nutriment47` | Vitamine B5 — Acide pantothénique (mg/j) |
| `nutriment48` | Vitamine B6 — Pyridoxine (mg/j) |
| `nutriment49` | Vitamine B9 — Acide folique (µg/j) |
| `nutriment50` | Vitamine B12 — Cobalamine (µg/j) |
| `nutriment51` | Vitamine C (mg/j) |
| `nutriment52` | Vitamine D (µg/j) |
| `nutriment53` | Vitamine E (mg/j) |
| `nutriment54` | Vitamine K2 (µg/j) |
| `contrib3`–`contrib10` | Contributions des macronutriments (et sous-détails) à l’**AESA** (%) |
| `contrib11`–`contrib29` | Contributions des lipides / AG / alcool / eau à l’AESA ou AET (voir notice) |
| `contrib30`–`contrib54` | Apports pour **100 kcal** (sodium → vitamine K2) |

Le détail exact de chaque `contrib*` est repris dans le tableau §3.3.5 du PDF (pages 78–82).

---

## `conso-ca-prod.csv` / `conso-ca-indiv.csv` (§3.4)

**Produits** (`CONSO_CA_PROD`, Pop1) : jusqu’à **5** produits décrits par individu ; clé `NOIND` + `num_prod`. Variables : `periode_reference`, `num_ligne_CA`, `type_prod`, `classif_reg_prod`, `classif_prod`, `pres_prod`, `nb_unit_prod`, `mode_conso_prod`, `nb_jours_an` (voir notice p.83–84).

**Individu** (`CONSO_CA_INDIV`, Pop1) : statut consommateur de CA (sens large vs réglementaire), dénombrements, saisons de prédilection (`saison_*`, `saison_autre_libelle`, `saison_nsp`) — notice p.85–86.

---

## Période de référence (PR)

Pour de nombreux questionnaires (habitudes, FPQ, CA), la **durée rétrospective** dépend de l’âge : **1 mois** (≤15 mois), **3 mois** (16–24 mois), **6 mois** (25–35 mois), **12 mois** (3–79 ans). Voir variable `periode_reference` où présente.
