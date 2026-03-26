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
    <SvelteMount :component="AlignmentViewer" :props="{ data: alignmentData, width: 800, height: 400, cellWidth: 8 }" />
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
