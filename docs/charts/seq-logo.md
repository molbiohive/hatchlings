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

// Each position maps base characters to frequencies (0-1)
const data: SeqLogoData = {
  positions: [
    { A: 0.8, C: 0.05, G: 0.1, T: 0.05 },
    { A: 0.1, C: 0.1, G: 0.7, T: 0.1 },
    { A: 0.05, C: 0.85, G: 0.05, T: 0.05 },
    { A: 0.25, C: 0.25, G: 0.25, T: 0.25 },  // no conservation
    { A: 0.02, C: 0.02, G: 0.02, T: 0.94 },
  ],
  alphabet: 'dna',   // or 'rna', 'protein'
};
```

Letter heights represent information content. Fully conserved positions show tall single letters; degenerate positions show short stacked letters.
