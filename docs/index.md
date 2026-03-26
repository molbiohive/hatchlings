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
  <div class="hero-plasmid-wrapper">
    <div class="hero-plasmid">
      <SvelteMount :component="PlasmidViewer" :props="{ data: puc19, width: 2400, height: 2400 }" />
    </div>
  </div>
</ClientOnly>

<style>
.hero-plasmid-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.12;
}
.dark .hero-plasmid-wrapper {
  opacity: 0.08;
}
.hero-plasmid {
  flex-shrink: 0;
}
</style>
