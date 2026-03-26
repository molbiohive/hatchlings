---
title: MeltingCurve
---

# MeltingCurve

Differential scanning fluorimetry (DSF) melting curves with Tm annotation and derivative view.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import MeltingCurveRaw from '../../src/lib/components/charts/MeltingCurve.svelte';
import { meltingCurveData } from '../data/charts.ts';

const MeltingCurve = markRaw(MeltingCurveRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="MeltingCurve" :props="{ data: meltingCurveData, width: 600, height: 350 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { MeltingCurve } from '@molbiohive/hatchlings';
</script>

<MeltingCurve data={meltingCurveData} width={600} height={350} />
```

## Data Type — `MeltingCurveData`

| Field | Type | Required | Description |
|---|---|---|---|
| `curves` | `MeltingCurve[]` | yes | Melting curves |

### Each curve

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Curve name |
| `temp` | `number[]` | yes | Temperature values |
| `ratio` | `number[]` | yes | Fluorescence ratio |
| `derivative` | `number[]` | yes | First derivative |
| `tm` | `number` | no | Melting temperature |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `MeltingCurveData` | — | Primary data prop |
| `width` | `number` | `500` | SVG width |
| `height` | `number` | `350` | SVG height |
