---
title: MeltingCurve
---

# MeltingCurve

Differential scanning fluorimetry (DSF) melting curves with Tm annotation and derivative view.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import MeltingCurveRaw from '../../src/lib/components/charts/MeltingCurve.svelte';
import { meltingCurveData } from '../data/charts.ts';

const MeltingCurve = markRaw(MeltingCurveRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="MeltingCurve" :props="{ data: meltingCurveData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { MeltingCurve } from '@molbiohive/hatchlings';
</script>

<MeltingCurve data={meltingCurveData} width={600} height={350} />
```

## Data Type — `MeltingCurveData`

| Field | Type | Required | Description |
|---|---|---|---|
| `curves` | `MeltingCurve[]` | yes | Melting curves |

### Each curve

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Curve name |
| `temp` | `number[]` | yes | Temperature values |
| `ratio` | `number[]` | yes | Fluorescence ratio |
| `derivative` | `number[]` | yes | First derivative |
| `tm` | `number` | no | Melting temperature |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `MeltingCurveData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `350` | SVG height |

## Example — Constructing Data

```ts
import type { MeltingCurveData } from '@molbiohive/hatchlings';

const data: MeltingCurveData = {
  curves: [
    {
      name: 'WT protein',
      temp: [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
      ratio: [0.1, 0.1, 0.12, 0.15, 0.3, 0.5, 0.7, 0.85, 0.92, 0.95, 0.96, 0.97],
      derivative: [0, 0.01, 0.02, 0.05, 0.15, 0.2, 0.15, 0.1, 0.05, 0.02, 0.01, 0],
      tm: 52.3,
    },
    {
      name: 'Mutant',
      temp: [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
      ratio: [0.1, 0.12, 0.2, 0.4, 0.65, 0.82, 0.9, 0.95, 0.96, 0.97, 0.97, 0.98],
      derivative: [0, 0.02, 0.08, 0.2, 0.25, 0.17, 0.08, 0.03, 0.01, 0, 0, 0],
      tm: 43.1,
    },
  ],
};
```

The Tm (melting temperature) is annotated on the derivative plot. Multiple curves can be overlaid for comparison.
