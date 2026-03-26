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

## Example — Constructing Data

```ts
import type { GelData } from '@molbiohive/hatchlings';

const data: GelData = {
  gelType: 'agarose',  // or 'sds-page', 'native-page'
  stain: 'ethidium',   // or 'sybr-safe', 'sybr-gold', 'coomassie', 'silver'
  lanes: [
    {
      label: '1kb Ladder',
      isLadder: true,
      bands: [
        { size: 10000, intensity: 0.5, position: 0.08 },
        { size: 3000, intensity: 0.8, position: 0.34 },
        { size: 1000, intensity: 0.8, position: 0.55 },
        { size: 500, intensity: 0.8, position: 0.73 },
      ],
    },
    {
      label: 'Uncut plasmid',
      bands: [
        { size: 4361, intensity: 1.0, position: 0.35, name: 'supercoiled' },
      ],
    },
    {
      label: 'EcoRI + BamHI',
      bands: [
        { size: 3085, intensity: 0.5, position: 0.33 },
        { size: 1276, intensity: 0.5, position: 0.46 },
      ],
    },
  ],
};
```

The `position` field (0–1) controls vertical placement on the gel. Set `isLadder: true` on the size standard lane to enable size labels.
