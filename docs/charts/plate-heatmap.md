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
  format: 96,
  wells: (() => {
    const w = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        const id = String.fromCharCode(65 + r) + (c + 1);
        // Deterministic values
        const seed = Math.sin((r * 12 + c) * 127.1) * 43758.5453;
        let v = (seed - Math.floor(seed)) * 100;
        let g = 'sample';
        if (c === 0) { v = 95 + (seed - Math.floor(seed)) * 5; g = 'positive'; }
        if (c === 11) { v = (seed - Math.floor(seed)) * 8; g = 'negative'; }
        w.push({ id, value: v, group: g });
      }
    }
    return w;
  })(),
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
