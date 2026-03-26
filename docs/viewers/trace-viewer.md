---
title: TraceViewer
---

# TraceViewer

Sanger sequencing chromatogram with four-channel traces, quality scores, base calls, and alignment to reference.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import TraceViewerRaw from '../../src/lib/components/trace/TraceViewer.svelte';
import { traceData } from '../data/trace.ts';

const TraceViewer = markRaw(TraceViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="TraceViewer" :props="{ data: traceData, width: 660, height: 300, zoom: 2 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { TraceViewer } from '@molbiohive/hatchlings';
</script>

<TraceViewer data={traceData} width={800} height={300} zoom={2} />
```

## Data Type — `TraceData`

| Field | Type | Required | Description |
|---|---|---|---|
| `baseCalls` | `string` | yes | Called bases |
| `qualityScores` | `number[]` | yes | Phred quality per base |
| `channels` | `TraceChannel` | yes | `{ A, C, G, T }` signal arrays |
| `peakPositions` | `number[]` | yes | Peak center positions |
| `alignment` | `TraceAlignment` | no | Alignment to reference |
| `label` | `string` | no | Trace label |
| `trimQuality` | `number` | no | Quality trim threshold |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `TraceData` | — | Primary data prop |
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `300` | Canvas height |
| `showQuality` | `boolean` | `true` | Show quality score bars |
| `trimQuality` | `number` | `20` | Quality trim threshold |
| `highlightIndels` | `boolean` | `true` | Highlight indels |
| `zoom` | `number` | `1` | Zoom level |
| `showScrollbar` | `boolean` | `true` | Show horizontal scrollbar |
