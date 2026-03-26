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

## Example — Constructing Data

```ts
import type { TimeSeriesData } from '@molbiohive/hatchlings';

const data: TimeSeriesData = {
  series: [
    { name: 'OD600', x: [0, 1, 2, 3, 4, 5], y: [0.1, 0.15, 0.3, 0.8, 1.5, 2.1], unit: 'AU', yAxis: 'left', color: '#3b82f6' },
    { name: 'pH', x: [0, 1, 2, 3, 4, 5], y: [7.0, 6.9, 6.7, 6.3, 5.8, 5.5], unit: '', yAxis: 'right', color: '#ef4444' },
  ],
  events: [
    { time: 2, label: 'Induction', color: '#22c55e' },
  ],
  xLabel: 'Time (hours)',
};
```

Events are drawn as vertical marker lines. Use dual Y-axes to overlay measurements with different units.
