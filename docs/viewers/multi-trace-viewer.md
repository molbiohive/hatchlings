---
title: MultiTraceViewer
---

# MultiTraceViewer

Multiple Sanger sequencing traces with synchronized scroll and zoom.

## Demo

<script setup>
import { markRaw } from 'vue';
import SvelteMount from '../.vitepress/components/SvelteMount.vue';
import MultiTraceViewerRaw from '../../src/lib/components/trace/MultiTraceViewer.svelte';
import { multiTraceData } from '../data/trace.ts';

const MultiTraceViewer = markRaw(MultiTraceViewerRaw);
</script>

<ClientOnly>
  <div class="demo-container">
    <SvelteMount :component="MultiTraceViewer" :props="{ traces: multiTraceData, width: 660, height: 500, zoom: 2 }" />
  </div>
</ClientOnly>

## Usage

```svelte
<script>
  import { MultiTraceViewer } from '@molbiohive/hatchlings';
</script>

<MultiTraceViewer traces={[fwdTrace, revTrace]} width={800} height={600} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `traces` | `TraceData[]` | `[]` | Array of trace data |
| `width` | `number` | `800` | Total width |
| `height` | `number` | `600` | Total height |
| `zoom` | `number` | `1` | Zoom level (synced across traces) |
| `showQuality` | `boolean` | `true` | Show quality scores |

## Example — Forward + Reverse Traces

```svelte
<script>
  import { MultiTraceViewer } from '@molbiohive/hatchlings';

  // Each trace is a TraceData object (see TraceViewer page)
  const traces = [
    { label: 'Forward', baseCalls: '...', qualityScores: [...], channels: {...}, peakPositions: [...] },
    { label: 'Reverse', baseCalls: '...', qualityScores: [...], channels: {...}, peakPositions: [...] },
  ];
</script>

<MultiTraceViewer {traces} width={660} height={500} zoom={2} />
```

Scroll and zoom are synchronized across all traces. Each trace is stacked vertically.
