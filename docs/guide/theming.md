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
| `--hatch-caret-color` | `#ffffff` | `#000000` | Caret/cursor |

## Custom Themes

Create a custom theme by defining a `Record<string, string>` with `--hatch-*` keys:

```typescript
import type { HatchTheme } from '@molbiohive/hatchlings';

const myTheme: HatchTheme = {
  '--hatch-bg': '#1a1a2e',
  '--hatch-plot-bg': '#16213e',
  '--hatch-text': '#e8e8e8',
  // ... override any variables
};
```
