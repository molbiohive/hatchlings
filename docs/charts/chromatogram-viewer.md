---
title: ChromatogramViewer
---

# ChromatogramViewer

HPLC/FPLC chromatogram with multiple traces, peak annotations, fraction markers, and dual Y-axes.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ChromatogramViewerRaw from '../../src/lib/components/charts/ChromatogramViewer.svelte';
import { chromData } from '../data/charts.ts';

const ChromatogramViewer = markRaw(ChromatogramViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ChromatogramViewer" :props="{ data: chromData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ChromatogramViewer } from '@molbiohive/hatchlings';
</script>

<ChromatogramViewer data={chromData} width={600} height={350} />
```

## Data Type — `ChromData`

| Field | Type | Required | Description |
|---|---|---|---|
| `traces` | `ChromTrace[]` | yes | Signal traces |
| `peaks` | `ChromPeak[]` | no | Detected peaks |
| `fractions` | `ChromFraction[]` | no | Collected fractions |
| `xLabel` | `string` | no | X-axis label |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ChromData` | — | Primary data prop |
| `width` | `number` | `600` | SVG width |
| `height` | `number` | `350` | SVG height |
| `showPeaks` | `boolean` | `true` | Show peak labels |
| `showFractions` | `boolean` | `true` | Show fraction markers |

## Example — Constructing Data

```ts
import type { ChromData } from '@molbiohive/hatchlings';

const data: ChromData = {
  traces: [
    {
      name: 'UV 280nm',
      x: Array.from({ length: 200 }, (_, i) => i * 0.15),
      y: Array.from({ length: 200 }, (_, i) => {
        const x = i * 0.15;
        return 20 * Math.exp(-((x - 8) ** 2) / 1.5) +
          80 * Math.exp(-((x - 12) ** 2) / 2) +
          5 * Math.exp(-((x - 18) ** 2) / 3);
      }),
      unit: 'mAU',
    },
    {
      name: '% Buffer B',
      x: Array.from({ length: 200 }, (_, i) => i * 0.15),
      y: Array.from({ length: 200 }, (_, i) => Math.min(100, Math.max(0, (i - 50) * 0.8))),
      yAxis: 'right',
      color: '#ff7f00',
      unit: '%B',
    },
  ],
  fractions: [
    { name: 'F1', start: 6, end: 10, color: '#4daf4a' },
    { name: 'F2', start: 10, end: 15, color: '#e41a1c' },
    { name: 'F3', start: 16, end: 20, color: '#377eb8' },
  ],
  xLabel: 'Volume (mL)',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
