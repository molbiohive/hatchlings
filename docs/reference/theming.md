# Theming

Hatchlings uses CSS custom properties with the `--hatch-*` prefix. Two built-in themes are provided: dark and light.

## Using Themes

### With ThemeProvider

```svelte
<script>
  import { ThemeProvider } from '@molbiohive/hatchlings';
</script>

<ThemeProvider theme="dark">
  <PlasmidViewer {data} />
</ThemeProvider>
```

### With applyTheme

```svelte
<script>
  import { darkTheme, applyTheme } from '@molbiohive/hatchlings';
  import { onMount } from 'svelte';

  let container;
  onMount(() => applyTheme(container, darkTheme));
</script>

<div bind:this={container}>
  <PlasmidViewer {data} />
</div>
```

### With CSS

Set the variables directly in your stylesheet:

```css
:root {
  --hatch-bg: #0c1018;
  --hatch-plot-bg: #141c26;
  --hatch-text: #d4dce6;
  /* ... */
}
```

## Variable Reference

### Core

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-bg` | `#0c1018` | `#f5f3f0` | Background |
| `--hatch-plot-bg` | `#141c26` | `#fafaf8` | Plot area background |
| `--hatch-text` | `#d4dce6` | `#2a2e34` | Primary text |
| `--hatch-text-muted` | `#8a95a5` | `#6a7080` | Secondary text |
| `--hatch-text-dim` | `#566070` | `#9aa0ac` | Dim text |
| `--hatch-border` | `#2a3848` | `#d8d6d2` | Borders |
| `--hatch-grid-color` | `#1e2a38` | `#e8e6e2` | Grid lines |
| `--hatch-highlight` | `#6ab8e0` | `#3a8ab0` | Highlight/accent |

### Axes

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-axis-color` | `#3a4858` | `#c8ccd4` | Axis lines |
| `--hatch-axis-text` | `#7a8898` | `#6a7080` | Tick labels |
| `--hatch-axis-label` | `#95a3b3` | `#5a6070` | Axis titles |

### Semantic

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-positive` | `#58b56a` | `#3a8a4a` | Success/positive |
| `--hatch-negative` | `#d45858` | `#c04040` | Error/negative |
| `--hatch-warning` | `#d9953a` | `#b87a28` | Warning |

### Selection

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-selection-fill` | `rgba(59,130,246,0.15)` | `rgba(59,130,246,0.12)` | Selection fill |
| `--hatch-selection-stroke` | `rgba(59,130,246,0.6)` | `rgba(59,130,246,0.5)` | Selection border |
| `--hatch-selection-handle` | `rgba(59,130,246,0.8)` | `rgba(59,130,246,0.8)` | Selection drag handles |
| `--hatch-caret-color` | `#ffffff` | `#000000` | Caret/cursor |

### Tooltip

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-tooltip-bg` | `#141c26` | `#fafaf8` | Tooltip background |
| `--hatch-tooltip-border` | `#2a3848` | `#d8d6d2` | Tooltip border |
| `--hatch-tooltip-text` | `#d4dce6` | `#2a2e34` | Tooltip text |
| `--hatch-tooltip-label` | `#8a95a5` | `#6a7080` | Tooltip label text |

### Plasmid

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-ring-color` | `#4a5a6a` | `#8a9098` | Plasmid ring |
| `--hatch-tick-major` | `#5a6a7a` | `#7a8088` | Major tick marks |
| `--hatch-tick-minor` | `#3a4858` | `#b8bcc4` | Minor tick marks |
| `--hatch-cut-site` | `#d45858` | `#c04040` | Cut site markers |

### Sequence Viewer

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-seq-bg` | `transparent` | `transparent` | Viewer background |
| `--hatch-seq-border` | `#2a3848` | `#d8d6d2` | Viewer border |
| `--hatch-ruler-color` | `#4a5a6a` | `#8a9098` | Ruler tick marks |
| `--hatch-ruler-text` | `#7a8898` | `#6a7080` | Ruler numbers |
| `--hatch-line-number` | `#566070` | `#9aa0ac` | Line numbers |
| `--hatch-cutsite-color` | `#d45858` | `#c04040` | Cut site indicators |

### Plate Heatmap

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-plate-bg` | `transparent` | `transparent` | Plate background |
| `--hatch-plate-border` | `#2a3848` | `#d8d6d2` | Plate border |
| `--hatch-well-border` | `#2a3848` | `#d8d6d2` | Well borders |
| `--hatch-well-text` | `#ffffff` | `#2a2e34` | Well label text |
| `--hatch-empty-well` | `#1e2a38` | `#e8e6e2` | Empty well fill |

### Controls

| Variable | Dark | Light | Description |
|---|---|---|---|
| `--hatch-controls-bg` | `#1e2a38` | `#e8e6e2` | Control bar background |
| `--hatch-controls-border` | `#3a4858` | `#c8ccd4` | Control bar border |
| `--hatch-controls-color` | `#d4dce6` | `#2a2e34` | Control text/icons |
| `--hatch-controls-hover` | `#2a3848` | `#d8d6d2` | Control hover state |

## Custom Themes

Create a custom theme by defining a `Record<string, string>` with `--hatch-*` keys:

```typescript
import type { HatchTheme } from '@molbiohive/hatchlings';

const myTheme: HatchTheme = {
  '--hatch-bg': '#1a1a2e',
  '--hatch-plot-bg': '#16213e',
  '--hatch-text': '#e8e8e8',
  '--hatch-highlight': '#e94560',
  // ... override any variables
};
```
