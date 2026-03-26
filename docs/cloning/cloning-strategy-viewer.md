---
title: CloningStrategyViewer
---

# CloningStrategyViewer

Sequence-level visualization of cloning strategies showing inputs, actions, and resulting constructs.

## Demos

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import CloningStrategyViewerRaw from '../../src/lib/components/cloning/CloningStrategyViewer.svelte';
import { allStrategies } from '../data/cloning.ts';

const CloningStrategyViewer = markRaw(CloningStrategyViewerRaw);
</script>

<div v-for="strat in allStrategies" :key="strat.title">

### {{ strat.title }}

<p style="color: var(--vp-c-text-2); font-size: 14px; margin-top: -8px;">{{ strat.sub }}</p>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="CloningStrategyViewer" :props="{ node: strat.node, width: 660, height: 160, marginBp: 10 }" />
  </div>
</ClientOnly>

</div>

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
