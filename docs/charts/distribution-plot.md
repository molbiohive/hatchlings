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
  bins: Array.from({ length: 30 }, (_, i) => {
    const start = i * 2;
    const end = start + 2;
    // Normal-ish distribution centered at 30
    const mid = start + 1;
    const count = Math.round(100 * Math.exp(-((mid - 30) ** 2) / 200));
    return { start, end, count };
  }),
  overlay: {
    x: Array.from({ length: 100 }, (_, i) => i * 0.6),
    y: Array.from({ length: 100 }, (_, i) => {
      const x = i * 0.6;
      return 100 * Math.exp(-((x - 30) ** 2) / 200);
    }),
  },
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
