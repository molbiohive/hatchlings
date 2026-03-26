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
  points: Array.from({ length: 200 }, (_, i) => {
    // Deterministic pseudo-random
    const seed1 = Math.sin(i * 127.1) * 43758.5453;
    const r1 = seed1 - Math.floor(seed1);
    const seed2 = Math.sin(i * 269.5) * 43758.5453;
    const r2 = seed2 - Math.floor(seed2);
    const x = (r1 - 0.5) * 8;
    const y = r2 * 6;
    return {
      x, y,
      label: Math.abs(x) > 1 && y > 1.3 ? `Gene${i}` : undefined,
      significant: Math.abs(x) > 1 && y > 1.3,
    };
  }),
  thresholds: { x: 1, y: 1.3, xNeg: -1 },
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
