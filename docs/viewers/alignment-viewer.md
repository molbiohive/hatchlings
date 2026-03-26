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
    <SvelteMount :component="AlignmentViewer" :props="{ data: alignmentData, width: 660, height: 400, cellWidth: 8 }" />
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

## Example — Constructing Data

```ts
import type {
  AlignmentData, AlignmentSequence, ConservationScore,
} from '@molbiohive/hatchlings';

const sequences: AlignmentSequence[] = [
  { id: '1', name: 'Human_HBA',
    sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH-----GSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
  { id: '2', name: 'Mouse_HBA',
    sequence: 'MVLSGEDKSNIKAAWGKIGGHGAEYGAEALERMFASFPTTKTYFPHFDVSH-----GSAQVKGHGKKVADALTNAVAHIDDMPQALSALSDLHAHKLRVDPVNFKLLSHCLLVTLANHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
  { id: '3', name: 'Chicken_HBA',
    sequence: 'MVLSAADKNNVKGIFTKIAGHAEEYGAETLERMFTTYPPTKTYFPHFDLSH-----GSAQIKGHGKKVVAALIEAANHIDDIAGTLSKLSDLHAHKLRVDPVNFKLLGQCFLVVVAIHHPSALTPEVHASLDKFLCAVGTVLTAKYR' },
  { id: '4', name: 'Zebrafish_HBA',
    sequence: 'MSLSDKDKAAVRALWSKIGKSADAIGNDALSRMLIVYPQTKTYFSHWPDLS-----PGSAPVKKHGGVIMGALAVKAHIDDIAGALSKLSDLHAQKLRVDPVNFKLLAHCILVVLARHYPGDFTPAHHASLEKFLSHVISALVSKYR' },
  { id: '5', name: 'Frog_HBA',
    sequence: 'MLTADDKKLIQQAWEKAASHADEIGHDALSRMIVVYPQTKTYFSHWQDLS-----PGSAPVKKHGITIMAAVGSQAHDDIKNFLSKLSDKHAQKLRVDPANFKILAHCILVVAAAHYPSDFTPAVHASLDKFLANVHTVLTSKYR--' },
];

// Conservation computed per column: for each position, the fraction of
// sequences sharing the most common (non-gap) residue.
const conservation: ConservationScore[] = sequences[0].sequence
  .split('')
  .map((_, i) => {
    // count residues at column i across all sequences
    // score = maxCount / totalSequences, consensus = most frequent residue
    return { position: i, score: /* 0.0–1.0 */, consensus: /* e.g. 'M' */ };
  });
// Example first 3 values:
// { position: 0, score: 1.0, consensus: 'M' }
// { position: 1, score: 0.4, consensus: 'V' }
// { position: 2, score: 0.8, consensus: 'L' }
// ... one entry per alignment column (generated programmatically)

const alignmentData: AlignmentData = {
  sequences,
  alphabet: 'protein',
  conservation,
  name: 'Hemoglobin alpha subunit',
};
```

This is the data used in the demo above. See [`docs/data/alignment.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/alignment.ts) for the full source.

Gaps are represented as `-` in the sequence strings. All sequences must be the same length (pre-aligned).
