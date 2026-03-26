---
title: RestrictionMap
---

# RestrictionMap

Linear restriction enzyme cut site map with zoomable view and feature annotations.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import RestrictionMapRaw from '../../src/lib/components/sequence/RestrictionMap.svelte';
import { puc19 } from '../data/plasmid.ts';

const RestrictionMap = markRaw(RestrictionMapRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="RestrictionMap" :props="{ length: puc19.size, cutSites: puc19.cutSites, features: puc19.parts, width: 660 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { RestrictionMap } from '@molbiohive/hatchlings';
</script>

<RestrictionMap length={2686} cutSites={cutSites} features={parts} width={700} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `length` | `number` | — | Sequence length in bp |
| `cutSites` | `CutSite[]` | — | Restriction sites |
| `features` | `Part[]` | `[]` | Feature annotations |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `zoom` | `number` | `1` | Zoom level (bindable) |

## Example — Building a Map

```ts
import type { Part, CutSite } from '@molbiohive/hatchlings';

// pUC19 features used as the RestrictionMap features prop
const features: Part[] = [
  { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
  { name: 'AmpR promoter', type: 'promoter', start: 2490, end: 2594, strand: 1, color: '#31a354' },
  { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  { name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
  { name: 'MCS', type: 'misc_feature', start: 396, end: 452, strand: 1, color: '#d4915e' },
  { name: 'lac promoter', type: 'promoter', start: 168, end: 198, strand: 1, color: '#31a354' },
  { name: 'M13 fwd', type: 'primer_bind', start: 361, end: 378, strand: 1, tm: 56.2 },
  { name: 'M13 rev', type: 'primer_bind', start: 488, end: 505, strand: -1, tm: 55.8 },
  { name: 'Gibson fwd', type: 'primer_bind', start: 340, end: 395, strand: 1, tm: 62.1 },
  { name: 'Gibson rev', type: 'primer_bind', start: 450, end: 526, strand: -1, tm: 63.4 },
  { name: 'CAP site', type: 'protein_bind', start: 145, end: 166, strand: 1, color: '#e377c2' },
  { name: 'f1 ori', type: 'rep_origin', start: 2574, end: 2686, strand: 1, color: '#8c564b' },
];

// pUC19 restriction cut sites
const cutSites: CutSite[] = [
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
```

This is the data used in the demo above. The component is called as `<RestrictionMap length={2686} {cutSites} {features} width={660} />`. See [`docs/data/plasmid.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/plasmid.ts) for the full source.

```svelte
<RestrictionMap length={2686} {cutSites} {features} width={660} />
```

The zoom prop is bindable — use `bind:zoom` for a two-way binding with external controls.
