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

const features: Part[] = [
  { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
  { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  { name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
];

const cutSites: CutSite[] = [
  { enzyme: 'EcoRI', position: 396, end: 402, strand: 1 },
  { enzyme: 'BamHI', position: 417, end: 423, strand: 1 },
  { enzyme: 'HindIII', position: 447, end: 453, strand: 1 },
];
```

```svelte
<RestrictionMap length={2686} {cutSites} {features} width={660} />
```

The zoom prop is bindable — use `bind:zoom` for a two-way binding with external controls.
