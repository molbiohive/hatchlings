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
  events: Array.from({ length: 2000 }, (_, i) => {
    const s1 = Math.sin(i * 127.1) * 43758.5453;
    const s2 = Math.sin(i * 269.5) * 43758.5453;
    const s3 = Math.sin(i * 419.2) * 43758.5453;
    const r1 = s1 - Math.floor(s1);
    const r2 = s2 - Math.floor(s2);
    const cluster = s3 - Math.floor(s3);
    if (cluster < 0.4) {
      return [r1 * 200 + 100, r2 * 200 + 100];
    } else if (cluster < 0.7) {
      return [r1 * 300 + 500, r2 * 300 + 500];
    } else {
      return [r1 * 150 + 800, r2 * 150 + 200];
    }
  }),
  axes: [
    { name: 'FSC-A', index: 0 },
    { name: 'SSC-A', index: 1 },
  ],
  gates: [
    { name: 'Lymphocytes', type: 'rectangle', coordinates: [50, 50, 350, 350], color: '#4dc3ff' },
    { name: 'Granulocytes', type: 'rectangle', coordinates: [400, 400, 850, 850], color: '#58b56a' },
  ],
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
