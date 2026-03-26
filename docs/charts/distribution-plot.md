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
