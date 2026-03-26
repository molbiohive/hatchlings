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
  series: [{
    name: 'OD600',
    x: Array.from({ length: 25 }, (_, i) => i),
    y: Array.from({ length: 25 }, (_, i) => {
      const growth = 0.05 * Math.exp(0.3 * Math.min(i, 12)) /
        (1 + (0.05 / 2.0) * (Math.exp(0.3 * Math.min(i, 12)) - 1));
      return growth + Math.sin(i * 0.5) * 0.02;
    }),
    unit: 'OD600',
  }],
  events: [
    { time: 5, label: 'IPTG induction', color: '#d45858' },
  ],
  xLabel: 'Time (hr)',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
