# Getting Started

## Installation

```bash
bun add @molbiohive/hatchlings
```

Svelte 5 is a peer dependency:

```bash
bun add svelte@^5.0.0
```

## Basic Usage

```svelte
<script>
  import { PlasmidViewer } from '@molbiohive/hatchlings';

  const data = {
    name: 'pUC19',
    size: 2686,
    topology: 'circular',
    parts: [
      { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
      { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
      { name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
    ],
    cutSites: [
      { enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5 },
    ],
  };
</script>

<PlasmidViewer {data} width={500} height={500} />
```

## Data Flow

Hatchlings components are **pure renderers**. They receive pre-computed data and render it — no biology computation happens in the frontend.

```
Backend (Python) → compute data → WebSocket/API → Frontend (Svelte) → render
```

Each component accepts a `data` prop with a typed data object. See individual component pages for the exact data types.

## Components

### Viewers

Interactive molecular biology visualizations:

- **PlasmidViewer** — circular/linear plasmid maps with features and cut sites
- **SequenceViewer** — DNA/RNA sequence with annotations, translations, primers
- **GelViewer** — gel electrophoresis with realistic band rendering
- **TraceViewer** — Sanger sequencing chromatograms
- **AlignmentViewer** — multiple sequence alignment with conservation
- **ProteinViewer** — 3D protein structure (3Dmol.js)
- **CloningStrategyViewer** — cloning workflow diagrams

### Charts

Scientific data visualization:

- **DoseResponseCurve** — IC50 fitting
- **PlateHeatmap** — microplate data (6 to 1536 wells)
- **VolcanoPlot** — differential expression
- **HeatmapViewer** — gene expression matrices
- **ChromatogramViewer** — HPLC/FPLC traces
- **MeltingCurve** — DSF thermal shift
- **BindingKineticsViewer** — SPR/BLI kinetics
- And more...

## Next Steps

- **[Data Interfaces](/guide/data-interfaces)** — understand the typed `data` prop pattern and all type modules
- **[Cloning Data Model](/cloning/cloning-node)** — learn how `CloningNode`, `CloningAction`, and cloning trees work
- **[Theming](/guide/theming)** — customize component appearance with CSS custom properties
