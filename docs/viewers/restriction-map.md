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
    <SvelteMount :component="RestrictionMap" :props="{ length: puc19.size, cutSites: puc19.cutSites, features: puc19.parts, width: 700 }" />
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
