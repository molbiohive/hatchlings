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

## Example — Constructing Data

```ts
import type { TraceData } from '@molbiohive/hatchlings';

const data: TraceData = {
  label: 'Sample_001_fwd',
  baseCalls: 'ATGCGATCGATCG...',
  qualityScores: [30, 35, 40, 38, ...],       // Phred scores per base
  peakPositions: [12, 24, 36, 48, ...],        // signal index of each peak
  channels: {
    A: [0, 10, 80, 5, ...],                    // fluorescence intensities
    C: [5, 2, 0, 90, ...],
    G: [2, 70, 5, 0, ...],
    T: [90, 0, 3, 2, ...],
  },
  alignment: {                                  // optional reference alignment
    refSeq: 'ATGCGATCGATCG...',
    querySeq: 'ATGCGATTGATCG...',
    mismatches: [
      { position: 7, type: 'substitution', refBase: 'C', queryBase: 'T' },
    ],
    identity: 0.98,
  },
  trimQuality: 20,                              // quality threshold for trimming
};
```

The `channels` object contains raw fluorescence arrays (same length). `peakPositions` maps each base call to a signal index in the channel arrays. `qualityScores` and `baseCalls` must be the same length.
