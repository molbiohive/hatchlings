---
title: ProteinSequenceViewer
---

# ProteinSequenceViewer

Protein sequence display with amino acid annotations, codon view, and residue coloring.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ProteinSequenceViewerRaw from '../../src/lib/components/protein-sequence/ProteinSequenceViewer.svelte';
import { proteinSequenceData } from '../data/protein.ts';

const ProteinSequenceViewer = markRaw(ProteinSequenceViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ProteinSequenceViewer" :props="{ data: proteinSequenceData, width: 660, height: 400, colorResidues: true }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ProteinSequenceViewer } from '@molbiohive/hatchlings';
</script>

<ProteinSequenceViewer data={proteinSeqData} width={700} height={400} />
```

## Data Type — `ProteinSequenceData`

| Field | Type | Required | Description |
|---|---|---|---|
| `seq` | `string` | no | Amino acid sequence |
| `dnaSource` | `string` | no | Source DNA sequence |
| `frame` | `0 \| 1 \| 2` | no | Reading frame |
| `annotations` | `ProteinAnnotation[]` | no | Sequence annotations |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ProteinSequenceData` | — | Primary data prop |
| `width` | `number` | `700` | Container width |
| `height` | `number` | — | Container height |
| `showCodons` | `boolean` | — | Show codon view |
| `colorResidues` | `boolean` | `false` | Color amino acids |
| `showNumbers` | `boolean` | — | Show position numbers |

## Example — Constructing Data

```ts
import type { ProteinSequenceData } from '@molbiohive/hatchlings';

const proteinSequenceData: ProteinSequenceData = {
  seq: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH',
  annotations: [
    { name: 'Helix A', type: 'helix', start: 3, end: 18, color: '#e377c2' },
    { name: 'Helix B', type: 'helix', start: 20, end: 35, color: '#ff7f0e' },
    { name: 'Active site', type: 'site', start: 37, end: 38, color: '#d62728' },
    { name: 'Helix C', type: 'helix', start: 40, end: 49, color: '#2ca02c' },
  ],
};
```

This is the data used in the demo above. See [`docs/data/protein.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/protein.ts) for the full source.

When `dnaSource` is provided, the viewer shows codons below each amino acid.
