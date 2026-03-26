---
title: ProteinViewer
---

# ProteinViewer

3D protein structure viewer powered by 3Dmol.js. Supports PDB, mmCIF, and SDF formats with various rendering styles.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import ProteinViewerRaw from '../../src/lib/components/protein/ProteinViewer.svelte';
import { proteinStructureData } from '../data/protein.ts';

const ProteinViewer = markRaw(ProteinViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="ProteinViewer" :props="{ data: proteinStructureData, width: 600, height: 400, style: 'cartoon', colorScheme: 'spectrum' }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { ProteinViewer } from '@molbiohive/hatchlings';
</script>

<ProteinViewer data={proteinData} width={600} height={400} />
```

## Data Type — `ProteinStructureData`

| Field | Type | Required | Description |
|---|---|---|---|
| `pdbData` | `string` | yes | PDB/mmCIF/SDF string |
| `format` | `string` | no | `'pdb' \| 'mmcif' \| 'sdf'` |
| `name` | `string` | no | Structure name |
| `selection` | `ProteinSelection` | no | Highlight selection |
| `labels` | `ProteinLabel[]` | no | Residue labels |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ProteinStructureData` | — | Primary data prop |
| `width` | `number` | — | Viewer width |
| `height` | `number` | — | Viewer height |
| `style` | `string` | `'cartoon'` | Rendering style |
| `colorScheme` | `string` | `'chain'` | Color scheme |
| `spin` | `boolean` | `false` | Auto-rotate |

::: warning
Requires `3dmol` as an optional peer dependency.
:::
