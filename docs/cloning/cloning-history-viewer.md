---
title: CloningHistoryViewer
---

# CloningHistoryViewer

Interactive tree visualization of construct cloning history. Navigate through recursive cloning steps, from source materials to final product.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import CloningHistoryViewerRaw from '../../src/lib/components/cloning/CloningHistoryViewer.svelte';
import { cloningHistoryRoot } from '../data/cloning.ts';

const CloningHistoryViewer = markRaw(CloningHistoryViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="CloningHistoryViewer" :props="{ root: cloningHistoryRoot, width: 660, height: 450 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { CloningHistoryViewer } from '@molbiohive/hatchlings';
</script>

<CloningHistoryViewer root={cloningTree} width={800} height={500} />
```

## Data Type — `CloningNode`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | Unique node ID |
| `name` | `string` | yes | Construct name |
| `size` | `number` | yes | Size in bp |
| `topology` | `string` | no | `'circular' \| 'linear'` |
| `parts` | `Part[]` | no | Features |
| `cutSites` | `CutSite[]` | no | Restriction sites |
| `source` | `CloningSource` | no | How it was made |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `root` | `CloningNode` | — | Root of cloning tree |
| `width` | `number` | — | Container width |
| `height` | `number` | — | Container height |
| `onnodeclick` | `function` | — | Node click handler |
