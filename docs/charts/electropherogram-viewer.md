---
title: ElectropherogramViewer
---

# ElectropherogramViewer

Bioanalyzer/TapeStation electropherogram with peak detection and size annotation.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ElectropherogramViewerRaw from '../../src/lib/components/charts/ElectropherogramViewer.svelte';
import { electropherogramData } from '../data/charts.ts';

const ElectropherogramViewer = markRaw(ElectropherogramViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ElectropherogramViewer" :props="{ data: electropherogramData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ElectropherogramViewer } from '@molbiohive/hatchlings';
</script>

<ElectropherogramViewer data={electropherogramData} width={600} height={350} />
```

## Data Type — `ElectropherogramData`

| Field | Type | Required | Description |
|---|---|---|---|
| `x` | `number[]` | yes | Migration time values |
| `y` | `number[]` | yes | Fluorescence values |
| `peaks` | `ElectropherogramPeak[]` | yes | Detected peaks |
| `ladder` | `{ x, size }[]` | no | Size standard |
| `xLabel` | `string` | no | X-axis label |
| `yLabel` | `string` | no | Y-axis label |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ElectropherogramData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `showPeaks` | `boolean` | — | Show peak labels |
| `color` | `string` | — | Trace color |

## Example — Constructing Data

```ts
import type { ElectropherogramData } from '@molbiohive/hatchlings';

const data: ElectropherogramData = {
  x: Array.from({ length: 300 }, (_, i) => i * 0.5),
  y: Array.from({ length: 300 }, (_, i) => {
    const x = i * 0.5;
    return 50 * Math.exp(-((x - 30) ** 2) / 10) +
      120 * Math.exp(-((x - 60) ** 2) / 15) +
      35 * Math.exp(-((x - 90) ** 2) / 8) +
      80 * Math.exp(-((x - 120) ** 2) / 12);
  }),
  peaks: [
    { x: 30, height: 50, size: 200, label: '200 bp' },
    { x: 60, height: 120, size: 500, label: '500 bp' },
    { x: 90, height: 35, size: 1000, label: '1000 bp' },
    { x: 120, height: 80, size: 2000, label: '2000 bp' },
  ],
  xLabel: 'Migration time (s)',
  yLabel: 'Fluorescence (RFU)',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
