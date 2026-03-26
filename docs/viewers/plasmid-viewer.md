---
title: PlasmidViewer
---

# PlasmidViewer

Circular and linear plasmid map with features, cut sites, primers, and interactive selection.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import PlasmidViewerRaw from '../../src/lib/components/plasmid/PlasmidViewer.svelte';
import { puc19 } from '../data/plasmid.ts';

const PlasmidViewer = markRaw(PlasmidViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="PlasmidViewer" :props="{ data: puc19, width: 550, height: 550 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { PlasmidViewer } from '@molbiohive/hatchlings';
</script>

<PlasmidViewer data={plasmidData} width={500} height={500} />
```

## Data Type — `PlasmidData`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Plasmid name |
| `size` | `number` | yes | Total length in bp |
| `topology` | `'circular' \| 'linear'` | yes | Display mode |
| `seq` | `string` | no | Full nucleotide sequence |
| `parts` | `Part[]` | yes | Features and primers |
| `cutSites` | `CutSite[]` | yes | Restriction sites |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `PlasmidData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `500` | SVG height |
| `showTicks` | `boolean` | `true` | Show bp tick marks |
| `showInternalLabels` | `boolean` | `true` | Show labels inside arcs |
| `topology` | `string` | `'circular'` | Override topology |
| `interactive` | `boolean` | `true` | Enable mouse interaction |

## Events

| Event | Payload | Description |
|---|---|---|
| `onselect` | `{ start, end }` | Sequence region selected |
| `onselectionchange` | `{ start, end } \| null` | Selection changed (real-time) |
| `oncaretmove` | `number` | Caret position changed |
| `onpartclick` | `Part` | Feature/primer clicked |
| `oncopysequence` | `string` | Sequence copied to clipboard |
| `onhoverinfo` | `HoverInfo \| null` | Hover tooltip data |

## Example — Constructing Data

```ts
import type { PlasmidData } from '@molbiohive/hatchlings';

const data: PlasmidData = {
  name: 'pET-28a',
  size: 5369,
  topology: 'circular',
  parts: [
    { name: 'KanR', type: 'CDS', start: 3995, end: 4807, strand: -1, color: '#e6a24c' },
    { name: 'lacI', type: 'CDS', start: 773, end: 1855, strand: 1, color: '#3b82f6' },
    { name: 'T7 promoter', type: 'promoter', start: 4918, end: 4936, strand: 1, color: '#31a354' },
    { name: 'f1 ori', type: 'rep_origin', start: 4346, end: 4801, strand: 1, color: '#9467bd' },
  ],
  cutSites: [
    { enzyme: 'NcoI', position: 296, end: 302, strand: 1, cutPosition: 1, complementCutPosition: 5 },
    { enzyme: 'BamHI', position: 319, end: 325, strand: 1, cutPosition: 1, complementCutPosition: 5 },
    { enzyme: 'XhoI', position: 158, end: 164, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  ],
};
```

## Syncing with SequenceViewer

Share a `SelectionState` to synchronize selection across views:

```svelte
<script>
  import { PlasmidViewer, SequenceViewer, SelectionState } from '@molbiohive/hatchlings';

  const selection = new SelectionState(5369);
</script>

<PlasmidViewer {data} selectionState={selection} width={500} height={500} />
<SequenceViewer data={seqData} selectionState={selection} width={660} height={400} />
```

See [Selection & Sync](/reference/selection-sync) for details.
