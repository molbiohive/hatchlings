---
title: MultiTraceViewer
---

# MultiTraceViewer

Multiple Sanger sequencing traces with synchronized scroll and zoom.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import MultiTraceViewerRaw from '../../src/lib/components/trace/MultiTraceViewer.svelte';
import { multiTraceData } from '../data/trace.ts';

const MultiTraceViewer = markRaw(MultiTraceViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="MultiTraceViewer" :props="{ traces: multiTraceData, width: 660, height: 500, zoom: 2 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { MultiTraceViewer } from '@molbiohive/hatchlings';
</script>

<MultiTraceViewer traces={[fwdTrace, revTrace]} width={800} height={600} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `traces` | `TraceData[]` | `[]` | Array of trace data |
| `width` | `number` | `800` | Total width |
| `height` | `number` | `600` | Total height |
| `zoom` | `number` | `1` | Zoom level (synced across traces) |
| `showQuality` | `boolean` | `true` | Show quality scores |

## Example — Forward + Reverse Traces

```ts
import type { TraceData, TraceAlignment } from '@molbiohive/hatchlings';

const baseCalls = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
const numBases = baseCalls.length;  // 60

// Each trace is generated with Gaussian peaks per base call.
// The generateTrace(seed, label, baseStr) helper produces channels,
// quality scores, and peak positions (see TraceViewer example for the pattern).

// Forward trace — same alignment as the single TraceViewer example
const fwdTrace: TraceData = {
  label: 'Forward',
  baseCalls,
  qualityScores: [/* ... generated per seed=1 */],
  channels: { A: [/* ... */], C: [/* ... */], G: [/* ... */], T: [/* ... */] },
  peakPositions: [/* 5, 15, 25, ... */],
  alignment: {
    refSeq: 'ATCGATCGATCGGTCGATCGATCGATCGATCCTCGATCGATCGATCGATCGATCGATCG',
    querySeq: baseCalls,
    mismatches: [
      { pos: 12, type: 'substitution', refBase: 'G', queryBase: 'A' },
      { pos: 30, type: 'substitution', refBase: 'C', queryBase: 'T' },
    ],
    identity: 0.9667,
  },
};

// Reverse trace — substitutions introduced at positions 8 and 45
const revQueryBases = 'ATCGATCGCTCGATCGATCGATCGATCGATCGATCGATCGATCGATCATCGATCGATCG';
const revTrace: TraceData = {
  label: 'Reverse',
  baseCalls: revQueryBases,
  qualityScores: [/* ... generated per seed=2 */],
  channels: { A: [/* ... */], C: [/* ... */], G: [/* ... */], T: [/* ... */] },
  peakPositions: [/* 5, 15, 25, ... */],
  alignment: {
    refSeq: baseCalls,
    querySeq: revQueryBases,
    mismatches: [
      { pos: 8, type: 'substitution', refBase: baseCalls[8], queryBase: revQueryBases[8] },
      { pos: 45, type: 'substitution', refBase: baseCalls[45], queryBase: revQueryBases[45] },
    ],
    identity: 0.9667,
  },
};

// Resequencing trace — substitutions at positions 15 and 40
const reseqBases = 'ATCGATCGATCGATCGGTCGATCGATCGATCGATCGATCGGTCGATCGATCGATCGATCG';
const reseqTrace: TraceData = {
  label: 'Resequencing',
  baseCalls: reseqBases,
  qualityScores: [/* ... generated per seed=3 */],
  channels: { A: [/* ... */], C: [/* ... */], G: [/* ... */], T: [/* ... */] },
  peakPositions: [/* 5, 15, 25, ... */],
  alignment: {
    refSeq: baseCalls,
    querySeq: reseqBases,
    mismatches: [
      { pos: 15, type: 'substitution', refBase: baseCalls[15], queryBase: reseqBases[15] },
      { pos: 40, type: 'substitution', refBase: baseCalls[40], queryBase: reseqBases[40] },
    ],
    identity: 0.9667,
  },
};

const multiTraceData: TraceData[] = [fwdTrace, revTrace, reseqTrace];
```

This is the data used in the demo above. Channel arrays and quality scores are generated programmatically -- see [`docs/data/trace.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/trace.ts) for the full source.

Scroll and zoom are synchronized across all traces. Each trace is stacked vertically.
