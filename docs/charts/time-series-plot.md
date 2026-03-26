---
title: TimeSeriesPlot
---

# TimeSeriesPlot

Multi-line time series chart with event markers and dual Y-axes.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import TimeSeriesPlotRaw from '../../src/lib/components/charts/TimeSeriesPlot.svelte';
import { timeSeriesData } from '../data/charts.ts';

const TimeSeriesPlot = markRaw(TimeSeriesPlotRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="TimeSeriesPlot" :props="{ data: timeSeriesData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { TimeSeriesPlot } from '@molbiohive/hatchlings';
</script>

<TimeSeriesPlot data={timeSeriesData} width={600} height={350} />
```

## Data Type — `TimeSeriesData`

| Field | Type | Required | Description |
|---|---|---|---|
| `series` | `TimeSeriesLine[]` | yes | Data series |
| `events` | `TimeSeriesEvent[]` | no | Event markers |
| `xLabel` | `string` | no | X-axis label |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `TimeSeriesData` | — | Primary data prop |
| `width` | `number` | `600` | SVG width |
| `height` | `number` | `350` | SVG height |
