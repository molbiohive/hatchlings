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
