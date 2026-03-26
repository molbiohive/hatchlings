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
    time: Array.from({ length: 300 }, (_, i) => i * 10),
    power: Array.from({ length: 300 }, (_, i) => {
      const injection = Math.floor(i / 15);
      const inPeak = i % 15 < 3;
      if (!inPeak) return 0.1 + Math.sin(i * 0.1) * 0.05;
      const decay = Math.exp(-(injection * 0.3));
      return -8 * decay + 0.1;
    }),
  },
  isotherm: {
    ratio: Array.from({ length: 20 }, (_, i) => (i + 1) * 0.15),
    heat: Array.from({ length: 20 }, (_, i) => {
      const r = (i + 1) * 0.15;
      return -12 / (1 + Math.exp((r - 1.0) * 4)) - 0.5;
    }),
    fit: {
      x: Array.from({ length: 100 }, (_, i) => i * 0.035),
      y: Array.from({ length: 100 }, (_, i) => {
        const r = i * 0.035;
        return -12 / (1 + Math.exp((r - 1.0) * 4)) - 0.5;
      }),
    },
  },
  params: { N: 1.02, Ka: 2.5e6, deltaH: -12.3, deltaS: -8.1, Kd: 4e-7 },
};
```

This is the data powering the demo above. See [`docs/data/charts.ts`](https://github.com/molbiohive/hatchlings/blob/main/docs/data/charts.ts) for the full source.
