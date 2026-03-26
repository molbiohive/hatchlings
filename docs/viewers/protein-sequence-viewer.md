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
    <SvelteMount :component="ProteinSequenceViewer" :props="{ data: proteinSequenceData, width: 700, height: 400, colorResidues: true }" />
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
