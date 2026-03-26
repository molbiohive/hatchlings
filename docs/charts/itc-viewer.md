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
