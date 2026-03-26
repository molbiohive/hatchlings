---
title: FlowCytometryViewer
---

# FlowCytometryViewer

Flow cytometry scatter/density plot with gating regions. Canvas-based for high-density event rendering.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import FlowCytometryViewerRaw from '../../src/lib/components/charts/FlowCytometryViewer.svelte';
import { flowData } from '../data/charts.ts';

const FlowCytometryViewer = markRaw(FlowCytometryViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="FlowCytometryViewer" :props="{ data: flowData, width: 500, height: 500 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { FlowCytometryViewer } from '@molbiohive/hatchlings';
</script>

<FlowCytometryViewer data={flowData} width={500} height={500} />
```

## Data Type — `FlowData`

| Field | Type | Required | Description |
|---|---|---|---|
| `events` | `number[][]` | yes | Cell events as arrays |
| `axes` | `{ name, index }[]` | yes | Axis definitions |
| `gates` | `Gate[]` | no | Gating regions |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `FlowData` | — | Primary data prop |
| `width` | `number` | — | Canvas width |
| `height` | `number` | — | Canvas height |
| `logX` | `boolean` | — | Log X scale |
| `logY` | `boolean` | — | Log Y scale |
| `mode` | `string` | `'scatter'` | `'scatter' \| 'density'` |

## Example — Constructing Data

```ts
import type { FlowData } from '@molbiohive/hatchlings';

const data: FlowData = {
  events: [
    [250, 1500, 800],    // each sub-array is one cell event
    [300, 2200, 1200],   // values correspond to axes by index
    [180, 900, 600],
    // ... typically 10,000-100,000 events
  ],
  axes: [
    { name: 'FSC-A', index: 0 },
    { name: 'FITC-A', index: 1 },
    { name: 'PE-A', index: 2 },
  ],
  gates: [
    { name: 'Live cells', type: 'polygon', coordinates: [{x:100,y:100},{x:400,y:100},{x:400,y:3000},{x:100,y:3000}], color: '#22c55e44' },
  ],
};
```

Switch between `mode: 'scatter'` and `mode: 'density'` for different visualizations. Use `logX`/`logY` for fluorescence channels. Canvas-based rendering handles 100k+ events.
