# Tooltips

Most components emit hover data through an `onhoverinfo` callback. The library includes a `Tooltip` component that renders this data as a floating panel.

## HoverInfo

```ts
import type { HoverInfo, InfoItem } from '@molbiohive/hatchlings';
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Tooltip heading (e.g. feature name) |
| `items` | `InfoItem[]` | Rows of label/value pairs |
| `position` | `{ x: number; y: number }` | Viewport coordinates for positioning |

## InfoItem

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Left-aligned label text |
| `value` | `string \| number` | Right-aligned value |
| `unit` | `string?` | Optional unit suffix (e.g. `'bp'`, `'°C'`) |
| `color` | `string?` | Optional CSS color for the value |

## Tooltip Component

`Tooltip` renders a `HoverInfo` object as a themed floating panel with viewport clamping.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | `false` | Show/hide the tooltip |
| `x` | `number` | `0` | Viewport X position |
| `y` | `number` | `0` | Viewport Y position |
| `title` | `string` | — | Heading text |
| `items` | `InfoItem[]` | `[]` | Data rows |
| `children` | `Snippet` | — | Custom content (Svelte snippet) |

### Styling

The tooltip uses CSS custom properties for theming:

| Variable | Description |
|----------|-------------|
| `--hatch-tooltip-bg` | Background color |
| `--hatch-tooltip-border` | Border color |
| `--hatch-tooltip-text` | Title and value text color |
| `--hatch-tooltip-label` | Label text color |

## Basic Usage

Wire `onhoverinfo` to state, pass state to `Tooltip`:

```svelte
<script>
  import { PlasmidViewer, Tooltip } from '@molbiohive/hatchlings';
  import type { HoverInfo } from '@molbiohive/hatchlings';

  let hoverInfo: HoverInfo | null = $state(null);
</script>

<PlasmidViewer {data} width={500} height={500} onhoverinfo={(info) => hoverInfo = info} />

<Tooltip
  visible={!!hoverInfo}
  x={hoverInfo?.position.x ?? 0}
  y={hoverInfo?.position.y ?? 0}
  title={hoverInfo?.title}
  items={hoverInfo?.items ?? []}
/>
```

## Source Tracking Pattern

When multiple components share one tooltip, use source tracking to prevent one component from clearing another's tooltip:

```svelte
<script>
  import { PlasmidViewer, GelViewer, Tooltip } from '@molbiohive/hatchlings';
  import type { HoverInfo } from '@molbiohive/hatchlings';

  let hoverInfo: HoverInfo | null = $state(null);
  let hoverSource: string | null = $state(null);

  function hoverHandler(source: string) {
    return (info: HoverInfo | null) => {
      if (info) {
        hoverSource = source;
        hoverInfo = info;
      } else if (hoverSource === source) {
        hoverSource = null;
        hoverInfo = null;
      }
    };
  }
</script>

<PlasmidViewer {plasmidData} onhoverinfo={hoverHandler('plasmid')} />
<GelViewer {gelData} onhoverinfo={hoverHandler('gel')} />

<Tooltip
  visible={!!hoverInfo}
  x={hoverInfo?.position.x ?? 0}
  y={hoverInfo?.position.y ?? 0}
  title={hoverInfo?.title}
  items={hoverInfo?.items ?? []}
/>
```

Only the component that set the hover can clear it — so moving from one component to another doesn't briefly flash the tooltip off.

## Custom Tooltip Content

Use the `children` snippet for custom rendering:

```svelte
<Tooltip visible={!!hoverInfo} x={hoverInfo?.position.x ?? 0} y={hoverInfo?.position.y ?? 0}>
  {#snippet children()}
    <div class="my-custom-content">
      <strong>{hoverInfo.title}</strong>
      <p>{hoverInfo.items[0]?.value}</p>
    </div>
  {/snippet}
</Tooltip>
```

## Components with onhoverinfo

| Component | Hover targets |
|-----------|--------------|
| PlasmidViewer | Parts and cut sites |
| SequenceViewer | Positions, features, cut sites |
| GelViewer | Bands and lanes |
| TraceViewer | Base calls and quality scores |
| MultiTraceViewer | Base calls and peaks |
| CloningStrategyViewer | Cloning nodes and actions |
| CloningHistoryViewer | Tree nodes |
| Most chart components | Data points and series |
