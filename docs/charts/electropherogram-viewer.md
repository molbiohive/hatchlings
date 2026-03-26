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
  x: [20, 21, 22, 23, ...],                     // migration time (seconds)
  y: [0, 5, 120, 15, ...],                      // fluorescence intensity
  peaks: [
    { x: 22, height: 120, area: 450, size: 200, label: 'Lower marker' },
    { x: 45, height: 85, area: 1200, size: 1500, label: '18S' },
    { x: 52, height: 110, area: 1800, size: 4000, label: '28S' },
  ],
  ladder: [
    { x: 22, size: 200 }, { x: 35, size: 500 }, { x: 45, size: 1500 },
  ],
  xLabel: 'Time (s)',
  yLabel: 'Fluorescence (FU)',
};
```

Used for Bioanalyzer / TapeStation electropherograms. The `ladder` maps migration times to fragment sizes for size calling.
