---
title: SequenceViewer
---

# SequenceViewer

DNA/RNA sequence display with annotations, translations, primers, cut sites, and interactive selection.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import SequenceViewerRaw from '../../src/lib/components/sequence/SequenceViewer.svelte';
import { sequenceData } from '../data/plasmid.ts';

const SequenceViewer = markRaw(SequenceViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="SequenceViewer" :props="{ data: sequenceData, width: 660, height: 500 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { SequenceViewer } from '@molbiohive/hatchlings';
</script>

<SequenceViewer data={seqData} width={700} height={500} />
```

## Data Type — `SequenceData`

| Field | Type | Required | Description |
|---|---|---|---|
| `seq` | `string` | yes | Nucleotide sequence |
| `parts` | `Part[]` | yes | Features and primers |
| `cutSites` | `CutSite[]` | yes | Restriction sites |
| `translations` | `Translation[]` | yes | Amino acid translations |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |
| `topology` | `string` | no | `'linear' \| 'circular'` |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `SequenceData` | — | Primary data prop |
| `width` | `number` | `700` | Container width |
| `height` | `number` | `500` | Container height |
| `charWidth` | `number` | `10` | Character pixel width |
| `showAnnotations` | `boolean` | `true` | Show feature annotations |
| `showTranslations` | `boolean` | `true` | Show amino acid translations |
| `showNumbers` | `boolean` | `true` | Show position numbers |
| `showComplement` | `boolean` | `true` | Show complement strand |
| `colorBases` | `boolean` | `false` | Color bases by nucleotide |
| `topology` | `string` | `'linear'` | Sequence topology |

## Example — Constructing Data

```ts
import type { SequenceData } from '@molbiohive/hatchlings';

const data: SequenceData = {
  seq: 'ATGCGATCGATCG...', // full nucleotide sequence
  parts: [
    { name: 'GFP', type: 'CDS', start: 100, end: 820, strand: 1, color: '#22c55e' },
    { name: 'T7 pro', type: 'promoter', start: 50, end: 98, strand: 1, color: '#31a354' },
    { name: 'M13 fwd', type: 'primer_bind', start: 85, end: 105, strand: 1, tm: 56.2 },
  ],
  cutSites: [
    { enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  ],
  translations: [
    { start: 100, end: 820, strand: 1, aminoAcids: 'MSKGEEL...', frame: 0 },
  ],
  topology: 'linear',
};
```

Primers with overhangs use `bindingStart`/`bindingEnd` to distinguish the binding region from the full oligo. See [Data Interfaces](/reference/data-interfaces) for the complete `Part` definition.
