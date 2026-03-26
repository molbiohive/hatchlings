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
      color: '#3b82f6',
      points: [
        { x: 0.001, y: 95 }, { x: 0.01, y: 90 }, { x: 0.1, y: 70 },
        { x: 1, y: 40 }, { x: 10, y: 15 }, { x: 100, y: 5 },
      ],
      fit: {
        line: [{ x: 0.001, y: 97 }, /* ... fitted points ... */ { x: 100, y: 3 }],
        params: { top: 97, bottom: 3, ic50: 0.8, hillSlope: -1.2 },
        r2: 0.98,
      },
    },
  ],
  xLabel: 'Concentration (µM)',
  yLabel: '% Activity',
};
```

X values are concentrations (plotted on log scale). Y values are response measurements. The `fit` object contains the 4-parameter logistic curve and IC50.
