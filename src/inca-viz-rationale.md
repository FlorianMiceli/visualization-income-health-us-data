---
title: Choix de visualisation (tableau INCA3)
toc: false
pager: false
---

<div class="inca-rationale-page">

# Pourquoi ces visualisations, ces couleurs et ces messages

Cette page présente les **choix de conception** du [tableau INCA3](./inca-inequality) : types de graphiques, palettes et logique de lecture. Elle complète les précisions méthodologiques indiquées sur la page principale.

## Idée générale

Le tableau traite des **inégalités sociales et de l’alimentation** dans INCA3 : comment la **sécurité alimentaire**, certains **comportements déclarés** (restauration rapide, bio, cantine) et les **apports mesurés** (groupes alimentaires et nutriments) varient avec le **niveau de vie du ménage** (`RUC_4cl`) et, en lecture complémentaire, avec la **catégorie socioprofessionnelle** (`PCS_4cl_PR`).

Toutes les analyses sont **descriptives et pondérées** ; il ne s’agit pas d’une démonstration causale.

---

## Graphique 1 — Barres empilées à 100 % (insécurité alimentaire × revenu)

**Pourquoi ce type de graphique :**  
La barre empilée à 100 % montre la **composition** de chaque classe de revenu : chaque barre représente 100 % de la population Pop2 pondérée de la classe. On visualise ainsi l’**inégalité de distribution** de l’insécurité alimentaire (par exemple plus d’insécurité sévère dans les classes de revenu faibles), sans confondre avec les différences d’effectifs entre classes.

**Pourquoi ces couleurs :**  
- **Bleu** pour la sécurité alimentaire (état de référence).  
- **Orange** puis **rouge** pour l’insécurité modérée puis sévère (progression cohérente de gravité).  
L’ordre est **ordinal** : sécurisé → modéré → sévère.

**Message visé :**  
Le niveau de vie est lié au niveau de sécurité alimentaire ; on compare la **forme des segments** entre classes, pas la hauteur totale des barres (forcément identique).

---

## Graphique 2 — Indice « santé » et composition de l’indice

**Pourquoi ce type de visualisation :**  
La courbe montre rapidement la position relative de chaque classe sociale sur l’indice global, tandis que la décomposition explique **ce qui contribue** au score de la classe sélectionnée. Cette combinaison “vue d’ensemble + détail” facilite l’interprétation.

**Pourquoi ces couleurs :**  
Les classes sociales gardent une couleur stable dans l’interface (du plus défavorisé au plus favorisé). Cette cohérence améliore la lecture croisée entre graphiques.

**Point de mise en page :**  
La composition est placée à côté de la courbe afin d’éviter les allers-retours visuels verticaux et de garder un bloc compact.

**Message visé :**  
Montrer à la fois l’écart global entre classes et les composantes qui tirent le score vers le haut ou vers le bas.

---

## Graphique 3 — Structure de la consommation par quartile

**Pourquoi ce type de graphique :**  
Les barres empilées permettent de comparer la **composition relative du panier alimentaire** entre classes de revenu, sur une même échelle visuelle.

**Limite assumée :**  
Ce format met surtout en évidence la structure relative. Quand les différences sont faibles, le contraste visuel peut paraître limité.

**Message visé :**  
Comparer les profils de consommation sans sur-interpréter des écarts faibles.

---

## Graphique 4 — Groupes alimentaires et nutriments vs moyenne nationale

**Pourquoi ce type de graphique :**  
La heatmap permet de lire en même temps :
- la **valeur moyenne** (ordre de grandeur),
- et l’**écart à la moyenne nationale** (position relative).

**Pourquoi cette palette :**  
Une palette divergente centrée sur 0 met en évidence les valeurs au-dessus et au-dessous de la référence nationale.

**Message visé :**  
Identifier rapidement les dimensions où les classes diffèrent de la moyenne nationale, sans quitter une lecture descriptive.

---

## Références du projet

- Définitions des variables : [Dictionnaire des données](./data/inca/DATA_DICTIONARY)  
- Tableau principal : [INCA3 — Inégalités sociales et alimentation](./inca-inequality)

</div>
