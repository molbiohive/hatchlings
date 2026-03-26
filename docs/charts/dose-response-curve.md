---
title: DoseResponseCurve
---

# DoseResponseCurve

Dose-response curve with 4-parameter logistic fitting, IC50 display, and confidence intervals.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import DoseResponseCurveRaw from '../../src/lib/components/charts/DoseResponseCurve.svelte';
import { doseResponseData } from '../data/charts.ts';

const DoseResponseCurve = markRaw(DoseResponseCurveRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="DoseResponseCurve" :props="{ data: doseResponseData, width: 600, height: 400 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { DoseResponseCurve } from '@molbiohive/hatchlings';
</script>

<DoseResponseCurve data={doseResponseData} width={600} height={400} />
```

## Data Type — `DoseResponseData`

| Field | Type | Required | Description |
|---|---|---|---|
| `curves` | `DoseResponseCurveData[]` | yes | One or more curves |
| `xLabel` | `string` | no | X-axis label |
| `yLabel` | `string` | no | Y-axis label |

### `DoseResponseCurveData`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Curve name |
| `points` | `{ x, y }[]` | yes | Data points |
| `fit` | `DoseResponseFit` | no | Fitted curve + params |
| `color` | `string` | no | Curve color |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `DoseResponseData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `350` | SVG height |

## Example — Constructing Data

```ts
import type { DoseResponseData } from '@molbiohive/hatchlings';

const data: DoseResponseData = {
  curves: [
    {
      label: 'Compound A',
      points: [
        { x: 0.001, y: 98 }, { x: 0.003, y: 97 }, { x: 0.01, y: 95 }, { x: 0.03, y: 88 },
        { x: 0.1, y: 72 }, { x: 0.3, y: 42 }, { x: 1, y: 18 }, { x: 3, y: 8 }, { x: 10, y: 5 },
      ],
      fit: {
        line: Array.from({ length: 100 }, (_, i) => {
          const x = 0.0001 * Math.pow(10, i * 5 / 99);
          return { x, y: 5 + (98 - 5) / (1 + Math.pow(x / 0.35, 1.2)) };
        }),
        params: { top: 98, bottom: 5, ic50: 0.35, hillSlope: -1.2 },
        r2: 0.997,
        ci95: { ic50: [0.28, 0.43] as [number, number] },
      },
    },
    {
      label: 'Compound B',
      points: [
        { x: 0.001, y: 99 }, { x: 0.01, y: 96 }, { x: 0.1, y: 90 }, { x: 0.3, y: 75 },
        { x: 1, y: 50 }, { x: 3, y: 25 }, { x: 10, y: 12 }, { x: 30, y: 8 },
      ],
      fit: {
        line: Array.from({ length: 100 }, (_, i) => {
          const x = 0.0001 * Math.pow(10, i * 5.5 / 99);
          return { x, y: 8 + (99 - 8) / (1 + Math.pow(x / 1.1, 1.0)) };
        }),
        params: { top: 99, bottom: 8, ic50: 1.1, hillSlope: -1.0 },
        r2: 0.994,
      },
    },
  ],
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
