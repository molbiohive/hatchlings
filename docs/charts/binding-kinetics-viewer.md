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

## Example — Constructing Data

```ts
import type { KineticsData } from '@molbiohive/hatchlings';

const data: KineticsData = {
  curves: [
    { name: '100 nM', concentration: 100e-9, x: [0, 10, 20, ...], y: [0, 0.5, 0.8, ...] },
    { name: '50 nM', concentration: 50e-9, x: [0, 10, 20, ...], y: [0, 0.3, 0.5, ...] },
    { name: '25 nM', concentration: 25e-9, x: [0, 10, 20, ...], y: [0, 0.15, 0.25, ...] },
  ],
  steps: [
    { name: 'Baseline', start: 0, end: 60, type: 'baseline' },
    { name: 'Association', start: 60, end: 360, type: 'association' },
    { name: 'Dissociation', start: 360, end: 660, type: 'dissociation' },
  ],
  params: {
    ka: 2.5e5,     // M⁻¹s⁻¹
    kd: 1.2e-3,    // s⁻¹
    KD: 4.8e-9,    // M (= kd/ka)
    chi2: 0.15,
    rMax: 1.2,
  },
};
```

Steps define the phase boundaries drawn as background regions. The fit curves and residuals are computed by your backend.
