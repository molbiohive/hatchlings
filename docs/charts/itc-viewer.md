---
title: ITCViewer
---

# ITCViewer

Isothermal titration calorimetry viewer with raw thermogram and integrated isotherm panels.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ITCViewerRaw from '../../src/lib/components/charts/ITCViewer.svelte';
import { itcData } from '../data/charts.ts';

const ITCViewer = markRaw(ITCViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ITCViewer" :props="{ data: itcData, width: 600, height: 500 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ITCViewer } from '@molbiohive/hatchlings';
</script>

<ITCViewer data={itcData} width={600} height={500} />
```

## Data Type — `ITCData`

| Field | Type | Required | Description |
|---|---|---|---|
| `rawThermogram` | `ITCThermogram` | yes | Raw power vs time |
| `isotherm` | `ITCIsotherm` | yes | Integrated heats |
| `params` | `ITCParams` | no | Fitted parameters |

### `ITCParams`

| Field | Type | Description |
|---|---|---|
| `N` | `number` | Stoichiometry |
| `Ka` | `number` | Association constant (M⁻¹) |
| `deltaH` | `number` | Enthalpy (kcal/mol) |
| `deltaS` | `number` | Entropy (cal/mol/K) |
| `Kd` | `number` | Dissociation constant (M) |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ITCData` | — | Primary data prop |
| `width` | `number` | — | SVG width |
| `height` | `number` | — | SVG height |
| `showFit` | `boolean` | — | Show fitted curve |
| `showParams` | `boolean` | — | Show parameters |

## Example — Constructing Data

```ts
import type { ITCData } from '@molbiohive/hatchlings';

const data: ITCData = {
  rawThermogram: {
    time: [0, 120, 240, 360, ...],       // seconds
    power: [0, -2.5, -0.3, -2.2, ...],  // µcal/sec
  },
  isotherm: {
    ratio: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0],   // molar ratio [ligand]/[protein]
    heat: [-12, -10, -7, -3, -1, -0.5],        // kcal/mol of injectant
    fit: {
      x: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
      y: [-11.5, -9.8, -6.5, -3.2, -1.1, -0.4],
    },
  },
  params: {
    N: 1.02,           // stoichiometry
    Ka: 2.5e6,         // M⁻¹
    deltaH: -12.3,     // kcal/mol
    deltaS: -8.5,      // cal/mol/K
    Kd: 400e-9,        // M
  },
};
```

Top panel shows the raw thermogram (power vs time). Bottom panel shows integrated heats vs molar ratio with the fitted binding isotherm.
