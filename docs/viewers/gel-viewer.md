---
title: GelViewer
---

# GelViewer

Gel electrophoresis visualization with realistic or simple band rendering, multiple stain types, and molecular weight ladders.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import GelViewerRaw from '../../src/lib/components/gel/GelViewer.svelte';
import { gelData } from '../data/gel.ts';

const GelViewer = markRaw(GelViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="GelViewer" :props="{ data: gelData, width: 400, height: 500 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { GelViewer } from '@molbiohive/hatchlings';
</script>

<GelViewer data={gelData} width={400} height={500} />
```

## Data Type — `GelData`

| Field | Type | Required | Description |
|---|---|---|---|
| `lanes` | `GelLane[]` | yes | Lanes with bands |
| `gelType` | `GelType` | yes | `'agarose' \| 'sds-page' \| 'native-page'` |
| `stain` | `StainType` | yes | Stain type |
| `gelPercent` | `number` | no | Gel percentage |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `GelData` | — | Primary data prop |
| `width` | `number` | `400` | SVG width |
| `height` | `number` | `500` | SVG height |
| `showSizeLabels` | `boolean` | `true` | Show size labels on ladder |
| `showLaneLabels` | `boolean` | `true` | Show lane labels |
| `bandStyle` | `string` | `'realistic'` | `'realistic' \| 'simple'` |
