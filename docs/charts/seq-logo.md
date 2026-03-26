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
