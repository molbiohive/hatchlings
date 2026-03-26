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
import type { SequenceData, Part, CutSite, Translation } from '@molbiohive/hatchlings';

// plasmidParts and plasmidCutSites are the same arrays used in PlasmidViewer
// (see the PlasmidViewer example for the full definitions)

const seqTranslations: Translation[] = [
  {
    start: 2533,
    end: 2686,
    strand: 1,
    aminoAcids: '...',  // translated from pUC19 sequence positions 2533–2686
    frame: 0,
  },
];

const sequenceData: SequenceData = {
  seq: 'ATGCGA...',  // 2686 bp pUC19 sequence (generated programmatically)
  parts: plasmidParts,
  cutSites: plasmidCutSites,
  translations: seqTranslations,
  topology: 'circular',
};
```

This is the data used in the demo above. See [`docs/data/plasmid.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/plasmid.ts) for the full source.

Primers with overhangs use `bindingStart`/`bindingEnd` to distinguish the binding region from the full oligo. See [Data Interfaces](/reference/data-interfaces) for the complete `Part` definition.
