# Rugby Match Analysis Dashboard

## Concept & Vision

Un tableau de bord d'analyse de match de rugby professionnel et élégant, conçu pour les arbitres et entraîneurs souhaitant décortiquer chaque décision sifflée. L'interface évoque la précision et l'autorité d'un arbitrage de haut niveau, avec une esthétique moderne inspirée des interfaces sportives premium. L'expérience doit être à la fois analytique et visuellement captivante.

## Design Language

### Aesthetic Direction
Style "Broadcast Sports Analytics" - inspiré des graphiques TV sportifs professionnels avec des fonds sombres et des accents vif brillants.

### Color Palette
- **Primary**: `#1e293b` (slate-800) - fond principal
- **Secondary**: `#334155` (slate-700) - cartes et sections
- **Accent Home**: `#3b82f6` (blue-500) - équipe domicile
- **Accent Away**: `#878787` (gray-500) - équipe visiteur
- **Background**: `#0f172a` (slate-900) - fond global
- **Text Primary**: `#f8fafc` (slate-50)
- **Text Secondary**: `#94a3b8` (slate-400)
- **Warning**: `#f59e0b` (amber-500) - risque modéré
- **Danger**: `#ef4444` (red-500) - risque élevé
- **Success**: `#22c55e` (green-500) - avantage capitalize

### Typography
- **Font**: Inter (Google Fonts) avec fallback system-ui
- **Headings**: Bold, tracking-tight
- **Data**: Tabular nums pour les statistiques

### Spatial System
- Grid system 12 colonnes
- Spacing: 4px base unit (Tailwind default)
- Card padding: 24px
- Gap between cards: 24px

### Motion Philosophy
- Transitions subtiles 200ms ease-out pour hover states
- Chart animations 600ms avec easing
- Timeline scroll smooth

## Layout & Structure

### Page Structure
1. **Header** - Logo, titre, sélecteur de fichier/collage JSON
2. **Score Summary Bar** - Score final et mi-temps
3. **KPI Cards Row** - 4 indicateurs clés
4. **Main Grid**:
   - Gauche: Tableaux pénalités,图表
   - Droite: Timeline des événements
5. **Analysis Section** - Séries et avantages
6. **Print Footer** - Bouton impression

### Responsive Strategy
- Desktop-first, responsive jusqu'à 1024px minimum
- Cards stack verticalement sur mobile

## Features & Interactions

### 1. Data Input
- **File Upload**: Glisser-déposer ou clic pour charger JSON
- **Paste Area**: Zone de texte pour coller JSON directement
- **Validation**: Vérification de la structure du JSON avec messages d'erreur
- **Sample Data**: Bouton pour charger un exemple

### 2. Penalty Tables
- Tableau 1: Pénalités par type de faute × Équipe × Mi-temps
- Tableau 2: Classement des fautes les plus sifflées
- Tri par colonne possible

### 3. Penalty Pie Chart
- Camembert avec secteurs colorés par type de faute
- Tooltip: nom, total, pourcentage
- Légende interactive

### 4. Penalties by 10-Minute Periods
- Bar chart vertical
- Barres groupées par équipe (couleurs distinctes)
- Ligne verticale pour mi-temps (40 min)
- Axe X: périodes 0-10, 10-20, 20-30, 30-40, 40-50, 50-60, 60-70, 70-80+

### 5. Cumulative Penalty Chart
- Line chart avec deux courbes (HOME/AWAY)
- Échelle X: périodes de 10 minutes
- Points de données marqués

### 6. Timeline des Événements
- Axe horizontal avec temps en minutes
- Côté gauche (bleu): Événements équipe domicile
- Côté droit (gris): Événements équipe visiteur
- Marqueurs graphiques:
  - 🚩 Pénalité
  - 🟨 Carton jaune
  - 🟥 Carton rouge
  - ⬜ Carton blanc
  - ⚽ Essai/T transformation
- **Filtres multi-sélections**: Checkboxes pour Penalités, Cartons Jaunes, Cartons Rouges, Cartons Blancs, Scores
- Indicateurs: Début match, Mi-temps, Fin match avec scores

### 7. KPI Cards
- Total pénalités domicile
- Total pénalités visiteur
- Équipe la plus pénalisée
- Ratio pénalités/avantages

### 8. Penalty Series Detection
- Algorithm: Detect sequences of 3+ penalties within 10-min windows without card
- Display: Liste des séries détectées avec équipe, période, nombre de pénalités
- Severity indicators: Modéré (4), Élevé (5+)

### 9. Advantage Analysis
- Total avantages par mi-temps
- Avantages avec événement < 30s
- Avantages sans événement > 30s
- Pourcentage de conversion

### 10. Print Functionality
- Bouton dedicated
- Print stylesheet optimisé
- Todas secciones visibles

## Component Inventory

### DataInputPanel
- Default: Zone visible avec icône upload
- Drag-over: Bordure highlightée
- Error: Message rouge sous la zone
- Success: Confirmation + transition vers données

### KPICard
- Default: Fond card, icône, valeur grande, label petit
- Hover: Légère élévation (shadow)

### DataTable
- Header: Fond plus sombre, texte uppercase petit
- Rows: Alternance subtile
- Hover: Fond highlight
- Cells: Alignement dépend du type (num droite)

### PieChart
- Interactive segments avec hover effect
- Tooltip positionné dynamiquement
- Legend en dessous

### BarChart
- Grouped bars avec gap
- Baseline zero
- Grid lines subtiles
- Midtime vertical line en pointillés

### Timeline
- SVG-based horizontal timeline
- Event markers avec icônes
- Connecteurs verticaux vers timeline
- Filter buttons en haut

### SeriesAlert
- Card avec bordure colorée selon sévérité
- Icon warning
- Text explicatif

## Technical Approach

### Framework
- React 18 + TypeScript
- Vite pour le build
- Tailwind CSS pour le styling

### Libraries
- **Recharts** pour les graphiques (bar, line, pie)
- **date-fns** pour formater lesDurées
- **lucide-react** pour les icônes

### State Management
- React useState pour état local
- Props drilling pour données de match

### Data Processing
- Parsing JSON une seule fois
- Computed statistics memoized
- Time conversion: seconds → minutes pour affichage

### Print Implementation
- CSS @media print rules
- window.print() trigger
- Hide interactive elements in print
