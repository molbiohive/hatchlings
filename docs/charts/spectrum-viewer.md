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
  x: Array.from({ length: 200 }, (_, i) => 200 + i * 2),
  y: Array.from({ length: 200 }, (_, i) => {
    const w = 200 + i * 2;
    return 0.8 * Math.exp(-((w - 280) ** 2) / 400) +
      0.3 * Math.exp(-((w - 220) ** 2) / 200);
  }),
  peaks: [
    { x: 220, y: 0.3, label: '220 nm' },
    { x: 280, y: 0.8, label: '280 nm' },
  ],
  xLabel: 'Wavelength (nm)',
  yLabel: 'Absorbance',
  title: 'UV Absorption Spectrum',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
