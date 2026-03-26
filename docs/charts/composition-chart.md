---
title: CompositionChart
---

# CompositionChart

Nucleotide/amino acid composition pie chart with GC content donut.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import CompositionChartRaw from '../../src/lib/components/charts/CompositionChart.svelte';
import { compositionData } from '../data/charts.ts';

const CompositionChart = markRaw(CompositionChartRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="CompositionChart" :props="{ data: compositionData, width: 300, height: 300 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { CompositionChart } from '@molbiohive/hatchlings';
</script>

<CompositionChart data={compositionData} width={300} height={300} />
```

## Data Type — `CompositionData`

| Field | Type | Required | Description |
|---|---|---|---|
| `counts` | `Record<string, number>` | yes | e.g. `{ A: 100, T: 95, G: 110, C: 105 }` |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |
| `gc` | `number` | no | GC content (0–1) |
| `length` | `number` | no | Total sequence length |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `CompositionData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |

## Example — Constructing Data

```ts
import type { CompositionData } from '@molbiohive/hatchlings';

const data: CompositionData = {
  counts: { A: 58, T: 42, G: 55, C: 48 },
  alphabet: 'dna',
  gc: 0.507,
  length: 203,
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
