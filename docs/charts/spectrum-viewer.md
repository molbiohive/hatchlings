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

## Example — Constructing Data

```ts
import type { SpectrumData } from '@molbiohive/hatchlings';

const data: SpectrumData = {
  x: [200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300],
  y: [0.1, 0.15, 0.3, 0.25, 0.2, 0.18, 0.45, 0.35, 0.8, 0.2, 0.05],
  peaks: [
    { x: 280, y: 0.8, label: 'A280 (Trp/Tyr)' },
    { x: 260, y: 0.45, label: 'A260 (nucleic acid)' },
  ],
  xLabel: 'Wavelength (nm)',
  yLabel: 'Absorbance (AU)',
  title: 'UV absorption spectrum',
};
```

Works for UV-Vis, CD, fluorescence, mass spectra -- any x/y data with optional peak annotations.
