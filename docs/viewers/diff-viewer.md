---
title: DiffViewer
---

# DiffViewer

Side-by-side sequence comparison highlighting substitutions, insertions, and deletions.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import DiffViewerRaw from '../../src/lib/components/sequence/DiffViewer.svelte';
import { diffData } from '../data/plasmid.ts';

const DiffViewer = markRaw(DiffViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="DiffViewer" :props="{ data: diffData, width: 660 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { DiffViewer } from '@molbiohive/hatchlings';
</script>

<DiffViewer data={diffData} width={700} />
```

## Data Type — `DiffData`

| Field | Type | Required | Description |
|---|---|---|---|
| `seqA` | `string` | yes | First sequence |
| `seqB` | `string` | yes | Second sequence |
| `nameA` | `string` | no | Label for first sequence |
| `nameB` | `string` | no | Label for second sequence |
| `featuresA` | `Part[]` | no | Features on sequence A |
| `featuresB` | `Part[]` | no | Features on sequence B |
| `alphabet` | `Alphabet` | no | Sequence alphabet |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `DiffData` | — | Primary data prop |
| `width` | `number` | — | SVG width |

## Example — Comparing Sequences

```ts
import type { DiffData } from '@molbiohive/hatchlings';

const diffData: DiffData = {
  seqA: 'ATGCGATCGATCGATCGATCGATCGATCGATCGATCG',
  seqB: 'ATGCGATTGATCAATCGATC---GATCGATCAATCGATCGATCG',
  nameA: 'Wild type',
  nameB: 'Mutant',
  featuresA: [
    { name: 'CDS', type: 'CDS', start: 0, end: 36, strand: 1, color: '#4dc3ff' },
  ],
  featuresB: [
    { name: 'CDS', type: 'CDS', start: 0, end: 18, strand: 1, color: '#4dc3ff' },
    { name: 'Insert', type: 'misc_feature', start: 18, end: 25, strand: 1, color: '#58b56a' },
    { name: 'CDS-2', type: 'CDS', start: 25, end: 44, strand: 1, color: '#4dc3ff' },
  ],
};
```

This is the data used in the demo above. See [`docs/data/plasmid.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/plasmid.ts) for the full source.

Substitutions, insertions, and deletions are highlighted automatically. Gaps are represented as `-` in the sequence strings.
