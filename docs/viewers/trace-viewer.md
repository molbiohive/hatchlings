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
import type { TraceData, TraceChannel, TraceAlignment } from '@molbiohive/hatchlings';

const baseCalls = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
const numBases = baseCalls.length;  // 60
const ppb = 10;                     // data points per base
const tp = numBases * ppb;          // 600 total data points

// Deterministic quality scores — mostly 32–45, with dips at positions 8, 22, 37, 51
// and ramps at the start/end of the read
const qualityScores: number[] = [];
for (let i = 0; i < numBases; i++) {
  let q = 32 + ((i * 7 + 3) % 14);
  if (i === 8 || i === 22 || i === 37 || i === 51) q = 12;
  if (i < 4) q = Math.max(15, q - (4 - i) * 5);
  if (i > numBases - 5) q = Math.max(12, q - (i - numBases + 5) * 4);
  qualityScores.push(q);
}

const peakPositions = Array.from({ length: numBases }, (_, i) => 5 + i * ppb);

// Channel signals generated via Gaussian peaks centered at each base call.
// Each channel is a number[] of length 600.
// Primary base gets amplitude ~800, off-bases get ~5% crosstalk.
const channels: TraceChannel = {
  A: [/* ... 600 values generated programmatically */],
  C: [/* ... 600 values */],
  G: [/* ... 600 values */],
  T: [/* ... 600 values */],
};

// Reference has substitutions at positions 12 and 30
const traceAlignment: TraceAlignment = {
  refSeq: 'ATCGATCGATCGGTCGATCGATCGATCGATCCTCGATCGATCGATCGATCGATCGATCG',
  querySeq: baseCalls,
  mismatches: [
    { pos: 12, type: 'substitution', refBase: 'G', queryBase: 'A' },
    { pos: 30, type: 'substitution', refBase: 'C', queryBase: 'T' },
  ],
  identity: 0.9667,
};

const traceData: TraceData = {
  label: 'Forward',
  baseCalls,
  qualityScores,
  channels,
  peakPositions,
  alignment: traceAlignment,
};
```

This is the data used in the demo above. Channel arrays are generated via Gaussian peak functions -- see [`docs/data/trace.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/trace.ts) for the full source.

The `channels` object contains raw fluorescence arrays (same length). `peakPositions` maps each base call to a signal index in the channel arrays. `qualityScores` and `baseCalls` must be the same length.
