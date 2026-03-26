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
