---
title: AlignmentViewer
---

# AlignmentViewer

Multiple sequence alignment with conservation scores, consensus sequence, and residue coloring.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import AlignmentViewerRaw from '../../src/lib/components/alignment/AlignmentViewer.svelte';
import { alignmentData } from '../data/alignment.ts';

const AlignmentViewer = markRaw(AlignmentViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="AlignmentViewer" :props="{ data: alignmentData, width: 660, height: 400, cellWidth: 8 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { AlignmentViewer } from '@molbiohive/hatchlings';
</script>

<AlignmentViewer data={alignmentData} width={800} height={400} />
```

## Data Type — `AlignmentData`

| Field | Type | Required | Description |
|---|---|---|---|
| `sequences` | `AlignmentSequence[]` | yes | Aligned sequences |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |
| `conservation` | `ConservationScore[]` | no | Per-position scores |
| `annotations` | `AlignmentAnnotation[]` | no | Region annotations |
| `name` | `string` | no | Alignment name |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `AlignmentData` | — | Primary data prop |
| `width` | `number` | `800` | Container width |
| `height` | `number` | `500` | Container height |
| `cellWidth` | `number` | `12` | Residue cell width |
| `cellHeight` | `number` | `16` | Residue cell height |
| `showConsensus` | `boolean` | `true` | Show consensus row |
| `showConservation` | `boolean` | `true` | Show conservation bars |
| `showNames` | `boolean` | `true` | Show sequence names |

## Example — Constructing Data

```ts
import type { AlignmentData } from '@molbiohive/hatchlings';

const data: AlignmentData = {
  sequences: [
    { id: 'human',   name: 'H. sapiens',    sequence: 'MKTLLILAVLCLG--QSQAALGT...' },
    { id: 'mouse',   name: 'M. musculus',    sequence: 'MKTLLILAVLCLG--QSQAALGT...' },
    { id: 'chicken', name: 'G. gallus',      sequence: 'MKTLLILACLCLGSEQSQAALGS...' },
    { id: 'frog',    name: 'X. tropicalis',  sequence: 'MK-LLILACLCLGSEQSQAALGS...' },
  ],
  alphabet: 'protein',
  conservation: [
    { position: 0, score: 1.0, consensus: 'M' },
    { position: 1, score: 1.0, consensus: 'K' },
    { position: 2, score: 0.75, consensus: 'T' },
    // ... one per column
  ],
};
```

Gaps are represented as `-` in the sequence strings. All sequences must be the same length (pre-aligned).
