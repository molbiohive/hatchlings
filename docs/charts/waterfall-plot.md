---
title: WaterfallPlot
---

# WaterfallPlot

Waterfall bar chart showing ranked contributions (e.g., tumor response, enrichment scores).

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import WaterfallPlotRaw from '../../src/lib/components/charts/WaterfallPlot.svelte';
import { waterfallData } from '../data/charts.ts';

const WaterfallPlot = markRaw(WaterfallPlotRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="WaterfallPlot" :props="{ data: waterfallData, width: 500, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { WaterfallPlot } from '@molbiohive/hatchlings';
</script>

<WaterfallPlot data={waterfallData} width={500} height={350} />
```

## Data Type — `WaterfallData`

| Field | Type | Required | Description |
|---|---|---|---|
| `bars` | `WaterfallBar[]` | yes | Bar data |

### `WaterfallBar`

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Bar label |
| `value` | `number` | Bar value |
| `category` | `string` | Optional grouping |
| `color` | `string` | Bar color |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `WaterfallData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `sortDescending` | `boolean` | — | Sort bars |

## Example — Constructing Data

```ts
import type { WaterfallData } from '@molbiohive/hatchlings';

const data: WaterfallData = {
  bars: [
    { label: 'Patient 1', value: -45, category: 'responder', color: '#4dc3ff' },
    { label: 'Patient 2', value: -38, category: 'responder', color: '#4dc3ff' },
    { label: 'Patient 3', value: -30, category: 'responder', color: '#4dc3ff' },
    { label: 'Patient 4', value: -22, category: 'partial', color: '#58b56a' },
    { label: 'Patient 5', value: -15, category: 'partial', color: '#58b56a' },
    { label: 'Patient 6', value: -8, category: 'stable', color: '#d9953a' },
    { label: 'Patient 7', value: 2, category: 'stable', color: '#d9953a' },
    { label: 'Patient 8', value: 12, category: 'progression', color: '#d45858' },
    { label: 'Patient 9', value: 25, category: 'progression', color: '#d45858' },
    { label: 'Patient 10', value: 40, category: 'progression', color: '#d45858' },
  ],
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
