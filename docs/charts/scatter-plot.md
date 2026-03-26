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
  points: Array.from({ length: 100 }, (_, i) => {
    const s1 = Math.sin(i * 127.1) * 43758.5453;
    const s2 = Math.sin(i * 269.5) * 43758.5453;
    const r1 = s1 - Math.floor(s1);
    const r2 = s2 - Math.floor(s2);
    const x = r1 * 10;
    const y = x * 0.8 + (r2 - 0.5) * 3;
    return { x, y, label: i % 20 === 0 ? `Sample ${i}` : undefined };
  }),
  axes: { x: 'Expression (log2)', y: 'Enrichment (fold)' },
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
