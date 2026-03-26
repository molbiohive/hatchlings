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
| `onpartclick` | `Part` | Feature/primer clicked |
| `onhoverinfo` | `HoverInfo \| null` | Hover tooltip data |
