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
  curves: [100, 50, 25, 12.5].map((conc) => {
    const x = Array.from({ length: 200 }, (_, i) => i * 0.5);
    const ka = 1e5, kd = 1e-3, rmax = 80;
    const y = x.map((t) => {
      const cM = conc * 1e-9;
      if (t < 30) return 0;
      if (t < 130) {
        const tA = t - 30;
        return rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
      }
      const tA = 100;
      const rEq = rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
      return rEq * Math.exp(-kd * (t - 130));
    });
    return { name: `${conc} nM`, concentration: conc * 1e-9, x, y };
  }),
  steps: [
    { name: 'Baseline', start: 0, end: 30, type: 'baseline' },
    { name: 'Association', start: 30, end: 130, type: 'association' },
    { name: 'Dissociation', start: 130, end: 200, type: 'dissociation' },
  ],
  params: { ka: 1e5, kd: 1e-3, KD: 1e-8, chi2: 0.15, rMax: 80 },
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
