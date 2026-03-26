---
layout: home

hero:
  name: hatchlings
  text: Molecular Biology Components
  tagline: Svelte 5 component library for scientific visualizations — plasmid maps, gel electrophoresis, chromatograms, sequence viewers, and more.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/molbiohive/hatchlings

features:
  - title: Pure Rendering
    details: Zero biology computation in frontend. Backend tools handle all computation; components receive pre-computed data and render it.
  - title: SVG + Canvas
    details: SVG for most components, Canvas for high-density views like TraceViewer and FlowCytometryViewer. No D3.js dependency.
  - title: Themeable
    details: CSS custom properties with --hatch-* prefix. Dark and light themes included, fully customizable.
  - title: Svelte 5 Runes
    details: Built with Svelte 5 runes ($state, $derived, $effect, $props) for fine-grained reactivity.
---

<script setup>
import { markRaw } from 'vue';
import SvelteMount from './.vitepress/components/SvelteMount.vue';
import PlasmidViewerRaw from '../src/lib/components/plasmid/PlasmidViewer.svelte';
import { puc19 } from './data/plasmid.ts';
const PlasmidViewer = markRaw(PlasmidViewerRaw);
</script>

<div style="text-align: center; margin-top: -20px; margin-bottom: 24px;">

[![npm version](https://img.shields.io/npm/v/@molbiohive/hatchlings?color=4dc3ff&label=npm)](https://www.npmjs.com/package/@molbiohive/hatchlings)
[![license](https://img.shields.io/npm/l/@molbiohive/hatchlings?color=58b56a)](https://github.com/molbiohive/hatchlings/blob/main/LICENSE)

</div>

<ClientOnly>
  <div class="hero-plasmid">
    <SvelteMount :component="PlasmidViewer" :props="{ data: puc19, width: 680, height: 680 }" />
  </div>
</ClientOnly>

<style>
.hero-plasmid {
  display: flex;
  justify-content: center;
  margin: 24px auto 48px;
  max-height: 50vh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
}
</style>
