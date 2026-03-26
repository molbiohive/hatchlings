---
title: VolcanoPlot
---

# VolcanoPlot

Volcano plot for differential expression analysis with significance thresholds and gene labels.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import VolcanoPlotRaw from '../../src/lib/components/charts/VolcanoPlot.svelte';
import { volcanoData } from '../data/charts.ts';

const VolcanoPlot = markRaw(VolcanoPlotRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="VolcanoPlot" :props="{ data: volcanoData, width: 500, height: 400 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { VolcanoPlot } from '@molbiohive/hatchlings';
</script>

<VolcanoPlot data={volcanoData} width={500} height={400} />
```

## Data Type — `VolcanoData`

| Field | Type | Required | Description |
|---|---|---|---|
| `points` | `DataPoint[]` | yes | Gene data points |
| `thresholds` | `Thresholds` | no | Significance cutoffs |

### `DataPoint`

| Field | Type | Description |
|---|---|---|
| `x` | `number` | log2(fold change) |
| `y` | `number` | -log10(p-value) |
| `label` | `string` | Gene name (shown for significant) |
| `significant` | `boolean` | Whether it passes thresholds |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `VolcanoData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `400` | SVG height |
| `highlightSignificant` | `boolean` | `true` | Highlight significant points |

## Example — Constructing Data

```ts
import type { VolcanoData } from '@molbiohive/hatchlings';

const data: VolcanoData = {
  points: [
    { x: 2.5, y: 8.3, label: 'BRCA1', significant: true },
    { x: -1.8, y: 6.1, label: 'TP53', significant: true },
    { x: 0.3, y: 1.2, label: 'GAPDH', significant: false },
    // x = log2(fold change), y = -log10(p-value)
  ],
  thresholds: {
    x: 1.0,       // |log2FC| cutoff
    y: 2.0,       // -log10(p) cutoff (p < 0.01)
  },
};
```

Points above both thresholds are colored as significant. Labels are shown for significant genes. Use `thresholds.xNeg` for asymmetric fold-change cutoffs.
