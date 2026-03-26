---
title: DistributionPlot
---

# DistributionPlot

Histogram with optional overlay curve for density or cumulative distribution.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import DistributionPlotRaw from '../../src/lib/components/charts/DistributionPlot.svelte';
import { distributionData } from '../data/charts.ts';

const DistributionPlot = markRaw(DistributionPlotRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="DistributionPlot" :props="{ data: distributionData, width: 500, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { DistributionPlot } from '@molbiohive/hatchlings';
</script>

<DistributionPlot data={distributionData} width={500} height={350} />
```

## Data Type — `DistributionData`

| Field | Type | Required | Description |
|---|---|---|---|
| `bins` | `{ start, end, count }[]` | yes | Histogram bins |
| `overlay` | `{ x[], y[] }` | no | Overlay curve |
| `mode` | `string` | no | `'histogram' \| 'density' \| 'cumulative'` |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `DistributionData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `xLabel` | `string` | — | X-axis label |
| `yLabel` | `string` | — | Y-axis label |
| `color` | `string` | — | Bar color |

## Example — Constructing Data

```ts
import type { DistributionData } from '@molbiohive/hatchlings';

const data: DistributionData = {
  bins: [
    { start: 0, end: 10, count: 5 },
    { start: 10, end: 20, count: 12 },
    { start: 20, end: 30, count: 28 },
    { start: 30, end: 40, count: 35 },
    { start: 40, end: 50, count: 20 },
    { start: 50, end: 60, count: 8 },
  ],
  overlay: {
    x: [0, 10, 20, 30, 40, 50, 60],
    y: [3, 10, 25, 35, 22, 9, 4],
  },
  mode: 'histogram',  // or 'density', 'cumulative'
};
```

The `overlay` curve (e.g. fitted normal distribution) is drawn on top of the histogram bars.
