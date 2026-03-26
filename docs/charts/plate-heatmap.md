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
