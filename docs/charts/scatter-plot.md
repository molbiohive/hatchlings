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

## Example — Constructing Data

```ts
import type { ScatterData } from '@molbiohive/hatchlings';

const data: ScatterData = {
  points: [
    { x: 1.2, y: 3.5, label: 'Sample 1', group: 'treated', color: '#3b82f6' },
    { x: 2.8, y: 1.1, label: 'Sample 2', group: 'control', color: '#ef4444' },
    { x: 0.5, y: 4.2, label: 'Sample 3', group: 'treated', color: '#3b82f6' },
  ],
  axes: { x: 'PC1 (45%)', y: 'PC2 (23%)' },
  gates: [
    { name: 'Region A', type: 'rectangle', coordinates: [{ x: 0, y: 3 }, { x: 2, y: 5 }], color: '#22c55e44' },
  ],
};
```

Use `gates` to define rectangular, polygon, or ellipse regions. Set `logX`/`logY` for log-scale axes.
