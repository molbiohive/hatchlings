---
title: HeatmapViewer
---

# HeatmapViewer

Gene expression heatmap with row/column labels and multiple color scales.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import HeatmapViewerRaw from '../../src/lib/components/charts/HeatmapViewer.svelte';
import { heatmapData } from '../data/charts.ts';

const HeatmapViewer = markRaw(HeatmapViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="HeatmapViewer" :props="{ data: heatmapData, width: 500, height: 400 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { HeatmapViewer } from '@molbiohive/hatchlings';
</script>

<HeatmapViewer data={heatmapData} width={500} height={400} />
```

## Data Type — `HeatmapData`

| Field | Type | Required | Description |
|---|---|---|---|
| `rows` | `string[]` | yes | Row labels |
| `cols` | `string[]` | yes | Column labels |
| `values` | `number[][]` | yes | Data matrix |
| `colorScale` | `string` | no | Color scale name |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `HeatmapData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `400` | SVG height |
| `showLabels` | `boolean` | `true` | Show row/col labels |
| `cellBorder` | `boolean` | — | Show cell borders |

## Example — Constructing Data

```ts
import type { HeatmapData } from '@molbiohive/hatchlings';

const data: HeatmapData = {
  rows: ['BRCA1', 'TP53', 'MYC', 'EGFR', 'KRAS'],
  cols: ['Sample A', 'Sample B', 'Sample C', 'Sample D'],
  values: [
    [2.1, -0.5, 1.8, 0.3],
    [-1.2, 3.0, -0.8, 2.5],
    [0.5, 0.8, -2.1, 1.0],
    [1.9, -1.5, 0.2, -0.3],
    [-0.3, 2.2, 1.5, -1.8],
  ],
  colorScale: 'RdBu',
};
```

Each row in `values` corresponds to a row label. Values are typically z-scores or log2 fold-changes.
