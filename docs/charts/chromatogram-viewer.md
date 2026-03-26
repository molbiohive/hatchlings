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
    { name: 'UV 280nm', x: [0, 1, 2, ...], y: [0.01, 0.02, 0.5, ...], yAxis: 'left', color: '#3b82f6', unit: 'mAU' },
    { name: 'Conductivity', x: [0, 1, 2, ...], y: [5, 5, 10, ...], yAxis: 'right', color: '#ef4444', unit: 'mS/cm' },
  ],
  peaks: [
    { start: 8.2, end: 12.5, apex: 10.1, height: 450, area: 2840, label: 'Peak 1' },
  ],
  fractions: [
    { name: 'A1', start: 8.0, end: 10.0, color: '#22c55e33' },
    { name: 'A2', start: 10.0, end: 12.0, color: '#3b82f633' },
  ],
  xLabel: 'Volume (mL)',
};
```

Use `yAxis: 'left'` or `'right'` for dual Y-axis support. Fractions are drawn as colored background regions.
