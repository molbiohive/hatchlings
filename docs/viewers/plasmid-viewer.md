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
import type { PlasmidData, Part, CutSite } from '@molbiohive/hatchlings';

const plasmidParts: Part[] = [
  { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
  { name: 'AmpR promoter', type: 'promoter', start: 2490, end: 2594, strand: 1, color: '#31a354' },
  { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  { name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
  { name: 'MCS', type: 'misc_feature', start: 396, end: 452, strand: 1, color: '#d4915e' },
  { name: 'lac promoter', type: 'promoter', start: 168, end: 198, strand: 1, color: '#31a354' },
  { name: 'M13 fwd', type: 'primer_bind', start: 361, end: 378, strand: 1, tm: 56.2,
    sequence: 'TGTAAAACGACGGCCAGT' },  // binding region with mismatch at pos 370
  { name: 'M13 rev', type: 'primer_bind', start: 488, end: 505, strand: -1, tm: 55.8,
    sequence: 'CAGGAAACAGCTATGAC' },
  { name: 'Gibson fwd', type: 'primer_bind', start: 340, end: 395, strand: 1, tm: 62.1,
    sequence: 'AATTCGGTACCGGATCCATCG...' },  // 5' overhang + binding region
  { name: 'Gibson rev', type: 'primer_bind', start: 450, end: 526, strand: -1, tm: 63.4,
    sequence: 'GCTAGCAATTCCCGGATCCAT...' },  // 5' overhang + binding region
  { name: 'CAP site', type: 'protein_bind', start: 145, end: 166, strand: 1, color: '#e377c2' },
  { name: 'f1 ori', type: 'rep_origin', start: 2574, end: 2686, strand: 1, color: '#8c564b' },
];

const plasmidCutSites: CutSite[] = [
  { enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  { enzyme: 'SacI', position: 402, end: 408, strand: 1, cutPosition: 5, complementCutPosition: 1 },
  { enzyme: 'KpnI', position: 408, end: 414, strand: 1, cutPosition: 5, complementCutPosition: 1 },
  { enzyme: 'BamHI', position: 417, end: 423, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  { enzyme: 'XbaI', position: 423, end: 429, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  { enzyme: 'SalI', position: 429, end: 435, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  { enzyme: 'PstI', position: 439, end: 445, strand: 1, cutPosition: 5, complementCutPosition: 1 },
  { enzyme: 'SphI', position: 445, end: 451, strand: 1, cutPosition: 5, complementCutPosition: 1 },
  { enzyme: 'HindIII', position: 447, end: 453, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  { enzyme: 'NdeI', position: 183, end: 189, strand: 1, cutPosition: 2, complementCutPosition: 4 },
  { enzyme: 'ScaI', position: 2177, end: 2183, strand: 1, cutPosition: 3, complementCutPosition: 3 },
];

const puc19: PlasmidData = {
  name: 'pUC19',
  size: 2686,
  topology: 'circular',
  seq: 'ATGCGA...',  // 2686 bp sequence generated programmatically
  parts: plasmidParts,
  cutSites: plasmidCutSites,
};
```

This is the data used in the demo above. See [`docs/data/plasmid.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/plasmid.ts) for the full source.

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
