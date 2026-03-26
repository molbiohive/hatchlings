---
title: CloningStrategyViewer
---

# CloningStrategyViewer

Sequence-level visualization of cloning strategies showing inputs, actions (restriction, Gibson, Golden Gate, etc.), and resulting constructs.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import CloningStrategyViewerRaw from '../../src/lib/components/cloning/CloningStrategyViewer.svelte';
import { restrictionLigationResult } from '../data/cloning.ts';

const CloningStrategyViewer = markRaw(CloningStrategyViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="CloningStrategyViewer" :props="{ node: restrictionLigationResult, width: 800, height: 160, marginBp: 10 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { CloningStrategyViewer } from '@molbiohive/hatchlings';
</script>

<CloningStrategyViewer node={cloningResult} width={800} height={160} />
```

## Supported Paradigms

- **Restriction / Ligation** — EcoRI, BamHI, etc.
- **Gibson Assembly** — overlapping homology arms
- **Golden Gate** — type IIS assembly (BsaI, BbsI)
- **Gateway** — attL/attR recombination
- **Cre-lox** — excision, inversion, insertion, translocation
- **CRISPR-Cas9** — HDR with donor template
- **PCR** — amplification with primers

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `node` | `CloningNode` | — | Result construct with `source` |
| `width` | `number` | — | SVG width |
| `height` | `number` | `160` | SVG height |
| `marginBp` | `number` | — | bp to show at construct ends |
