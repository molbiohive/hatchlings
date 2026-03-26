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
  rows: ['Gene1', 'Gene2', 'Gene3', 'Gene4', 'Gene5', 'Gene6', 'Gene7', 'Gene8'],
  cols: ['WT', 'KO_1', 'KO_2', 'OE_1', 'OE_2', 'Drug_1', 'Drug_2'],
  values: [
    [0.2, -1.8, -1.5, 1.2, 1.4, 0.3, 0.1],
    [-0.5, 1.2, 1.0, -0.8, -1.1, 0.6, 0.4],
    [1.5, -0.3, -0.5, 1.8, 2.0, -1.2, -1.0],
    [-1.2, 0.8, 0.6, -1.5, -1.3, 0.9, 1.1],
    [0.8, -1.0, -0.8, 0.5, 0.7, -0.4, -0.2],
    [-0.3, 1.5, 1.3, -0.6, -0.4, 1.2, 1.4],
    [1.0, -0.5, -0.7, 1.0, 0.8, -0.8, -0.6],
    [-0.8, 0.3, 0.5, -1.0, -0.9, 0.5, 0.7],
  ],
  colorScale: 'diverging',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
