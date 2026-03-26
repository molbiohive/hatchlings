# Getting Started

Hatchlings is a Svelte 5 component library for molecular biology visualizations. Components are **pure renderers** — your backend computes the data, hatchlings draws it.

## Installation

```bash
bun add @molbiohive/hatchlings svelte@^5.0.0
```

## Your First Plasmid Map

A plasmid map in 10 lines. Define the construct data, pass it to the component:

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

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import PlasmidViewerRaw from '../../src/lib/components/plasmid/PlasmidViewer.svelte';
import GelViewerRaw from '../../src/lib/components/gel/GelViewer.svelte';
import TraceViewerRaw from '../../src/lib/components/trace/TraceViewer.svelte';
import DoseResponseCurveRaw from '../../src/lib/components/charts/DoseResponseCurve.svelte';
import { puc19 } from '../data/plasmid.ts';
import { gelData } from '../data/gel.ts';
import { traceData } from '../data/trace.ts';
import { doseResponseData } from '../data/charts.ts';

const PlasmidViewer = markRaw(PlasmidViewerRaw);
const GelViewer = markRaw(GelViewerRaw);
const TraceViewer = markRaw(TraceViewerRaw);
const DoseResponseCurve = markRaw(DoseResponseCurveRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="PlasmidViewer" :props="{ data: puc19, width: 500, height: 500 }" />
  </div>
</ClientOnly>

Hover over features and cut sites to see tooltips. Click and drag to select a region.

## Gel Electrophoresis

Simulate a restriction digest gel. Each lane gets an array of bands with size, position, and intensity:

```svelte
<script>
  import { GelViewer } from '@molbiohive/hatchlings';

  const data = {
    gelType: 'agarose',
    stain: 'ethidium',
    lanes: [
      { label: '1kb Ladder', isLadder: true, bands: [
        { size: 3000, intensity: 0.9, position: 0.34 },
        { size: 1000, intensity: 0.8, position: 0.55 },
        { size: 500, intensity: 0.8, position: 0.73 },
      ]},
      { label: 'Uncut', bands: [
        { size: 4361, intensity: 1.0, position: 0.35 },
      ]},
      { label: 'EcoRI', bands: [
        { size: 4361, intensity: 0.9, position: 0.28 },
      ]},
      { label: 'BamHI+SalI', bands: [
        { size: 3085, intensity: 0.5, position: 0.33 },
        { size: 1276, intensity: 0.5, position: 0.46 },
      ]},
    ],
  };
</script>

<GelViewer {data} width={400} height={500} />
```

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="GelViewer" :props="{ data: gelData, width: 400, height: 500 }" />
  </div>
</ClientOnly>

## Sanger Sequencing Traces

Render chromatograms with four-channel fluorescence data and quality scores:

```svelte
<script>
  import { TraceViewer } from '@molbiohive/hatchlings';
</script>

<TraceViewer data={traceData} width={660} height={300} zoom={2} />
```

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="TraceViewer" :props="{ data: traceData, width: 660, height: 300, zoom: 2 }" />
  </div>
</ClientOnly>

Scroll horizontally through the trace. Quality bars show per-base Phred scores.

## Dose-Response Curves

IC50 fitting with multiple compounds, confidence intervals, and R² values:

```svelte
<script>
  import { DoseResponseCurve } from '@molbiohive/hatchlings';
</script>

<DoseResponseCurve data={doseResponseData} width={550} height={400} />
```

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="DoseResponseCurve" :props="{ data: doseResponseData, width: 550, height: 400 }" />
  </div>
</ClientOnly>

## How It Works

Every component follows the same pattern:

```
Backend (Python/Rust) → compute data → API / WebSocket → Frontend (Svelte) → render
```

1. Your backend computes the biology (alignment, peak calling, curve fitting, etc.)
2. It sends typed data objects to the frontend
3. Hatchlings components render them — no biology computation in the browser

Each component accepts a typed `data` prop. The types are exported from the package:

```ts
import type { PlasmidData, GelData, TraceData } from '@molbiohive/hatchlings';
```

## What's Next

- **[Viewers](/viewers/plasmid-viewer)** — plasmid maps, sequence viewers, gels, traces, alignments, and more
- **[Charts](/charts/dose-response-curve)** — dose-response, volcano plots, heatmaps, kinetics, and 13 more
- **[Cloning](/cloning/cloning-node)** — cloning strategy and history visualization
- **[Reference](/reference/data-interfaces)** — complete type definitions, CSS variables, tooltip API, selection sync
