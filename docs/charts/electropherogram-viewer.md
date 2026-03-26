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
