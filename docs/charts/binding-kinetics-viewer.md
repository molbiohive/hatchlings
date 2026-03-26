---
title: BindingKineticsViewer
---

# BindingKineticsViewer

SPR/BLI binding kinetics sensorgrams with association/dissociation phases, fitted curves, and kinetic parameters (ka, kd, KD).

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import BindingKineticsViewerRaw from '../../src/lib/components/charts/BindingKineticsViewer.svelte';
import { kineticsData } from '../data/charts.ts';

const BindingKineticsViewer = markRaw(BindingKineticsViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="BindingKineticsViewer" :props="{ data: kineticsData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { BindingKineticsViewer } from '@molbiohive/hatchlings';
</script>

<BindingKineticsViewer data={kineticsData} width={600} height={350} />
```

## Data Type — `KineticsData`

| Field | Type | Required | Description |
|---|---|---|---|
| `curves` | `KineticsCurve[]` | yes | Sensorgram curves |
| `fit` | `KineticsFit[]` | no | Fitted curves |
| `steps` | `KineticsStep[]` | yes | Phase definitions |
| `params` | `BindingParams` | no | Kinetic parameters |

### `BindingParams`

| Field | Type | Description |
|---|---|---|
| `ka` | `number` | Association rate (M⁻¹s⁻¹) |
| `kd` | `number` | Dissociation rate (s⁻¹) |
| `KD` | `number` | Equilibrium dissociation constant (M) |
| `chi2` | `number` | Fit quality |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `KineticsData` | — | Primary data prop |
| `width` | `number` | `600` | SVG width |
| `height` | `number` | `350` | SVG height |
| `showFit` | `boolean` | — | Show fitted curves |
| `showParams` | `boolean` | — | Show kinetic parameters |
