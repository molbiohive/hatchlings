---
title: SeqLogo
---

# SeqLogo

Sequence logo (position weight matrix) showing information content per position.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import SeqLogoRaw from '../../src/lib/components/charts/SeqLogo.svelte';
import { seqLogoData } from '../data/charts.ts';

const SeqLogo = markRaw(SeqLogoRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="SeqLogo" :props="{ data: seqLogoData, width: 500, height: 200 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { SeqLogo } from '@molbiohive/hatchlings';
</script>

<SeqLogo data={logoData} width={500} height={200} />
```

## Data Type — `SeqLogoData`

| Field | Type | Required | Description |
|---|---|---|---|
| `positions` | `LogoPosition[]` | yes | Per-position base frequencies |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |

### `LogoPosition`

An object mapping base characters to their frequencies (0–1):

```typescript
{ A: 0.8, C: 0.05, G: 0.1, T: 0.05 }
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `SeqLogoData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `title` | `string` | — | Chart title |

## Example — Constructing Data

```ts
import type { SeqLogoData } from '@molbiohive/hatchlings';

const data: SeqLogoData = {
  positions: [
    { A: 0.1, C: 0.1, G: 0.1, T: 0.7 },
    { A: 0.8, C: 0.05, G: 0.1, T: 0.05 },
    { A: 0.05, C: 0.05, G: 0.05, T: 0.85 },
    { A: 0.9, C: 0.03, G: 0.04, T: 0.03 },
    { A: 0.25, C: 0.25, G: 0.25, T: 0.25 },
    { A: 0.05, C: 0.8, G: 0.1, T: 0.05 },
    { A: 0.05, C: 0.05, G: 0.85, T: 0.05 },
    { A: 0.1, C: 0.1, G: 0.7, T: 0.1 },
    { A: 0.6, C: 0.15, G: 0.15, T: 0.1 },
    { A: 0.25, C: 0.25, G: 0.25, T: 0.25 },
  ],
  alphabet: 'dna',
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
