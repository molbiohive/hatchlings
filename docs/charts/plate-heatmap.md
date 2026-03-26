---
title: PlateHeatmap
---

# PlateHeatmap

Microplate heatmap supporting 6 to 1536-well formats with multiple color scales.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import PlateHeatmapRaw from '../../src/lib/components/charts/PlateHeatmap.svelte';
import { plateData } from '../data/charts.ts';

const PlateHeatmap = markRaw(PlateHeatmapRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="PlateHeatmap" :props="{ data: plateData, width: 500, height: 350, colorScale: 'viridis' }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { PlateHeatmap } from '@molbiohive/hatchlings';
</script>

<PlateHeatmap data={plateData} width={500} height={350} />
```

## Data Type — `PlateData`

| Field | Type | Required | Description |
|---|---|---|---|
| `format` | `PlateFormat` | yes | `6 \| 12 \| 24 \| 48 \| 96 \| 384 \| 1536` |
| `wells` | `Well[]` | yes | Well data |
| `title` | `string` | no | Plate title |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `PlateData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `350` | SVG height |
| `colorScale` | `string` | `'viridis'` | Color scale |
| `showLabels` | `boolean` | `true` | Show well labels |

## Example — Constructing Data

```ts
import type { PlateData } from '@molbiohive/hatchlings';

const data: PlateData = {
  format: 96,   // 6, 12, 24, 48, 96, 384, or 1536
  title: 'Luciferase assay — Plate 1',
  wells: [
    { id: 'A1', value: 45000, label: 'DMSO',  group: 'control', row: 0, col: 0 },
    { id: 'A2', value: 38000, label: '1 µM',  group: 'compound', row: 0, col: 1 },
    { id: 'A3', value: 12000, label: '10 µM', group: 'compound', row: 0, col: 2 },
    // ... one entry per well
  ],
};
```

Available color scales: `'viridis'`, `'plasma'`, `'inferno'`, `'magma'`, `'cividis'`, `'blues'`, `'reds'`. The `group` field is optional and can be used for categorical coloring.
