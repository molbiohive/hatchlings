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
      name: 'Protein A',
      temp: Array.from({ length: 80 }, (_, i) => 25 + i),
      ratio: Array.from({ length: 80 }, (_, i) =>
        0.6 + 0.3 / (1 + Math.exp(-(25 + i - 58) / 2))),
      derivative: Array.from({ length: 80 }, (_, i) => {
        const e = Math.exp(-(25 + i - 58) / 2);
        return 0.3 * e / (2 * (1 + e) ** 2);
      }),
      tm: 58,
    },
    {
      name: 'Protein B',
      temp: Array.from({ length: 80 }, (_, i) => 25 + i),
      ratio: Array.from({ length: 80 }, (_, i) =>
        0.55 + 0.35 / (1 + Math.exp(-(25 + i - 72) / 3))),
      derivative: Array.from({ length: 80 }, (_, i) => {
        const e = Math.exp(-(25 + i - 72) / 3);
        return 0.35 * e / (3 * (1 + e) ** 2);
      }),
      tm: 72,
    },
  ],
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
