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
import type { GelData, GelLane } from '@molbiohive/hatchlings';

const ladder: GelLane = {
  label: '1 kb Ladder',
  isLadder: true,
  bands: [
    { position: 0.08, intensity: 0.5, size: 10000 },
    { position: 0.14, intensity: 0.3, size: 8000 },
    { position: 0.18, intensity: 0.5, size: 6000 },
    { position: 0.23, intensity: 0.3, size: 5000 },
    { position: 0.28, intensity: 0.5, size: 4000 },
    { position: 0.34, intensity: 0.8, size: 3000 },
    { position: 0.42, intensity: 0.4, size: 2000 },
    { position: 0.48, intensity: 0.3, size: 1500 },
    { position: 0.55, intensity: 0.8, size: 1000 },
    { position: 0.66, intensity: 0.3, size: 750 },
    { position: 0.73, intensity: 0.8, size: 500 },
    { position: 0.85, intensity: 0.3, size: 250 },
  ],
};

const sampleLanes: GelLane[] = [
  { label: 'Uncut', bands: [
    { position: 0.35, intensity: 1.0, size: 4361, name: 'supercoiled' },
  ] },
  { label: 'EcoRI', bands: [
    { position: 0.28, intensity: 0.9, size: 4361, name: 'linear' },
  ] },
  { label: 'EcoRI+HindIII', bands: [
    { position: 0.28, intensity: 0.6, size: 4331 },
    { position: 0.95, intensity: 0.3, size: 30 },
  ] },
  { label: 'BamHI+SalI', bands: [
    { position: 0.33, intensity: 0.5, size: 3085 },
    { position: 0.46, intensity: 0.5, size: 1276 },
  ] },
];

const gelData: GelData = {
  lanes: [ladder, ...sampleLanes],
  gelType: 'agarose',
  stain: 'ethidium',
};
```

This is the data used in the demo above. See [`docs/data/gel.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/gel.ts) for the full source.

The `position` field (0–1) controls vertical placement on the gel. Set `isLadder: true` on the size standard lane to enable size labels.
