---
title: ScatterPlot
---

# ScatterPlot

XY scatter plot with optional gates, log scales, and point labels.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ScatterPlotRaw from '../../src/lib/components/charts/ScatterPlot.svelte';
import { scatterData } from '../data/charts.ts';

const ScatterPlot = markRaw(ScatterPlotRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ScatterPlot" :props="{ data: scatterData, width: 500, height: 400 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ScatterPlot } from '@molbiohive/hatchlings';
</script>

<ScatterPlot data={scatterData} width={500} height={400} />
```

## Data Type — `ScatterData`

| Field | Type | Required | Description |
|---|---|---|---|
| `points` | `DataPoint[]` | yes | Data points |
| `axes` | `{ x, y }` | no | Axis labels |
| `gates` | `Gate[]` | no | Gating regions |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ScatterData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `logX` | `boolean` | — | Log X scale |
| `logY` | `boolean` | — | Log Y scale |
| `pointSize` | `number` | — | Point radius |
