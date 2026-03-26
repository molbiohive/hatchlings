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
