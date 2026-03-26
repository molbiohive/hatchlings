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
    <SvelteMount :component="DiffViewer" :props="{ data: diffData, width: 700 }" />
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
