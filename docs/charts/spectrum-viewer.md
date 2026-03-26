---
title: SpectrumViewer
---

# SpectrumViewer

UV/CD/MS spectrum viewer with peak annotation.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import SpectrumViewerRaw from '../../src/lib/components/charts/SpectrumViewer.svelte';
import { spectrumData } from '../data/charts.ts';

const SpectrumViewer = markRaw(SpectrumViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="SpectrumViewer" :props="{ data: spectrumData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { SpectrumViewer } from '@molbiohive/hatchlings';
</script>

<SpectrumViewer data={spectrumData} width={600} height={350} />
```

## Data Type — `SpectrumData`

| Field | Type | Required | Description |
|---|---|---|---|
| `x` | `number[]` | yes | X values (wavelength, m/z, etc.) |
| `y` | `number[]` | yes | Y values (absorbance, intensity) |
| `peaks` | `SpectrumPeak[]` | no | Annotated peaks |
| `xLabel` | `string` | no | X-axis label |
| `yLabel` | `string` | no | Y-axis label |
| `title` | `string` | no | Chart title |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `SpectrumData` | — | Primary data prop |
| `width` | `number` | `600` | SVG width |
| `height` | `number` | `350` | SVG height |
