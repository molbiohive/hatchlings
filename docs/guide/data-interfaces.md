# Data Interfaces

Hatchlings is a **pure rendering** library. Every component receives pre-computed data through a typed `data` prop and renders it — no biology computation happens in the frontend.

```
Backend (Python/Rust) → compute data → WebSocket / API → Frontend (Svelte) → render
```

## The `data` Prop Pattern

Every component follows the same pattern:

```svelte
<script>
  import { PlasmidViewer } from '@molbiohive/hatchlings';
  import type { PlasmidData } from '@molbiohive/hatchlings';

  let data: PlasmidData = { ... };
</script>

<PlasmidViewer {data} width={500} height={500} />
```

The `data` object is the single source of truth. Components never fetch, parse, or compute data on their own.

## Type Modules

All types are exported from the package root. They are organized into modules by domain:

| Module | Types | Components |
|--------|-------|------------|
| `sequence` | `PlasmidData`, `SequenceData`, `DiffData`, `ProteinSequenceData`, `Part`, `CutSite`, `Translation`, `Alphabet` | PlasmidViewer, SequenceViewer, DiffViewer, ProteinSequenceViewer, RestrictionMap |
| `gel` | `GelData`, `GelLane`, `GelBand`, `GelType`, `StainType` | GelViewer |
| `trace` | `TraceData`, `TraceChannel`, `TraceAlignment`, `TraceMismatch` | TraceViewer, MultiTraceViewer |
| `alignment` | `AlignmentData`, `AlignmentSequence`, `ConservationScore` | AlignmentViewer |
| `plate` | `PlateData`, `Well`, `PlateFormat` | PlateHeatmap |
| `kinetics` | `KineticsData`, `KineticsCurve`, `BindingParams`, `DoseResponseData`, `MeltingCurveData`, `ITCData` | BindingKineticsViewer, DoseResponseCurve, MeltingCurve, ITCViewer |
| `chromatography` | `ChromData`, `ChromTrace`, `ChromPeak`, `SpectrumData`, `ElectropherogramData`, `TimeSeriesData` | ChromatogramViewer, SpectrumViewer, ElectropherogramViewer, TimeSeriesPlot |
| `interaction` | `VolcanoData`, `HeatmapData`, `SeqLogoData`, `ScatterData`, `FlowData`, `DistributionData`, `WaterfallBar` | VolcanoPlot, HeatmapViewer, SeqLogo, ScatterPlot, FlowCytometryViewer, DistributionPlot, WaterfallPlot |
| `cloning` | `CloningNode`, `CloningAction`, `CloningSource`, `CloningParadigm` | CloningStrategyViewer, CloningHistoryViewer |
| `protein` | `ProteinStructureData`, `ProteinSelection`, `ProteinLabel` | ProteinViewer |
| `composition` | `CompositionData` | CompositionChart |
| `utility` | `HoverInfo`, `InfoItem` | Shared tooltip model |

## Import Pattern

All types are re-exported from the package root:

```ts
import type { PlasmidData, Part, CutSite } from '@molbiohive/hatchlings';
import type { GelData, GelLane } from '@molbiohive/hatchlings';
```

## Core Shared Types

Several types are shared across multiple components. These are defined in the `sequence` module.

### `Part`

Represents any annotated region on a sequence — genes, promoters, primers, misc features.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | no | Unique identifier |
| `name` | `string` | yes | Display name |
| `type` | `string` | yes | Feature type (`'CDS'`, `'promoter'`, `'primer_bind'`, `'rep_origin'`, etc.) |
| `start` | `number` | yes | Start position (0-indexed bp) |
| `end` | `number` | yes | End position (exclusive) |
| `strand` | `1 \| -1` | yes | Sense (`1`) or antisense (`-1`) strand |
| `color` | `string` | no | CSS color for rendering |
| `label` | `string` | no | Override display label (defaults to `name`) |
| `note` | `string` | no | Tooltip description |
| `tm` | `number` | no | Melting temperature (primers) |
| `sequence` | `string` | no | Oligo sequence (primers — includes overhangs) |
| `bindingStart` | `number` | no | Start of binding region (primers with overhangs) |
| `bindingEnd` | `number` | no | End of binding region |
| `mismatches` | `number[]` | no | Positions of mismatched bases (absolute bp) |

Parts are used by PlasmidViewer, SequenceViewer, DiffViewer, RestrictionMap, and CloningNode.

### `CutSite`

Represents a restriction enzyme recognition and cut site.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | no | Unique identifier |
| `enzyme` | `string` | yes | Enzyme name (e.g. `'EcoRI'`) |
| `position` | `number` | yes | Start of recognition site (0-indexed bp) |
| `end` | `number` | no | End of recognition site |
| `strand` | `1 \| -1` | yes | Strand of recognition site |
| `overhang` | `string` | no | Overhang sequence after cut |
| `cutPosition` | `number` | no | Sense strand cut offset within recognition site |
| `complementCutPosition` | `number` | no | Complement strand cut offset |
| `recognitionSeq` | `string` | no | Recognition sequence (e.g. `'GAATTC'`) |
| `senseCutOffset` | `number` | no | Sense cut offset (0-indexed from 5' end) |
| `complementCutOffset` | `number` | no | Complement cut offset (0-indexed from sense 5' end) |

### `Translation`

A translated reading frame displayed as amino acids below the sequence.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | `number` | yes | Start position (bp) |
| `end` | `number` | yes | End position (bp) |
| `strand` | `1 \| -1` | yes | Reading direction |
| `aminoAcids` | `string` | yes | Pre-computed amino acid string |
| `frame` | `0 \| 1 \| 2` | no | Reading frame offset |

### `Alphabet`

```ts
type Alphabet = 'dna' | 'rna' | 'protein';
```

Used by SequenceViewer, AlignmentViewer, and DiffViewer to select residue coloring and validation rules.

## Constructing Data

Here's a complete example building a `PlasmidData` object:

```ts
import type { PlasmidData } from '@molbiohive/hatchlings';

const myPlasmid: PlasmidData = {
  name: 'pUC19',
  size: 2686,
  topology: 'circular',
  parts: [
    {
      name: 'AmpR',
      type: 'CDS',
      start: 1629,
      end: 2489,
      strand: -1,
      color: '#4dc3ff',
    },
    {
      name: 'ori',
      type: 'rep_origin',
      start: 836,
      end: 1424,
      strand: -1,
      color: '#9467bd',
    },
    {
      name: 'lacZa',
      type: 'CDS',
      start: 217,
      end: 508,
      strand: 1,
      color: '#e6a24c',
    },
  ],
  cutSites: [
    {
      enzyme: 'EcoRI',
      position: 396,
      end: 402,
      strand: 1,
      cutPosition: 1,
      complementCutPosition: 5,
    },
    {
      enzyme: 'BamHI',
      position: 417,
      end: 423,
      strand: 1,
      cutPosition: 1,
      complementCutPosition: 5,
    },
  ],
};
```

And a `GelData` object:

```ts
import type { GelData } from '@molbiohive/hatchlings';

const myGel: GelData = {
  gelType: 'agarose',
  stain: 'ethidium',
  lanes: [
    {
      label: '1kb Ladder',
      isLadder: true,
      bands: [
        { size: 10000, intensity: 0.8, position: 0.1 },
        { size: 3000, intensity: 0.9, position: 0.35 },
        { size: 1000, intensity: 1.0, position: 0.6 },
        { size: 500, intensity: 0.7, position: 0.75 },
      ],
    },
    {
      label: 'Sample 1',
      bands: [
        { size: 2686, intensity: 0.9, position: 0.38 },
      ],
    },
  ],
};
```

## Tooltips

Most components emit hover data through an `onhoverinfo` callback. The library includes a `Tooltip` component that renders this data.

### HoverInfo and InfoItem

```ts
import type { HoverInfo, InfoItem } from '@molbiohive/hatchlings';
```

| Field | Type | Description |
|-------|------|-------------|
| `HoverInfo.title` | `string` | Tooltip heading (e.g. feature name) |
| `HoverInfo.items` | `InfoItem[]` | Rows of label/value pairs |
| `HoverInfo.position` | `{ x: number; y: number }` | Viewport coordinates for positioning |

| Field | Type | Description |
|-------|------|-------------|
| `InfoItem.label` | `string` | Left-aligned label text |
| `InfoItem.value` | `string \| number` | Right-aligned value |
| `InfoItem.unit` | `string?` | Optional unit suffix |
| `InfoItem.color` | `string?` | Optional CSS color for the value |

### Using the Tooltip Component

The `Tooltip` component renders a `HoverInfo` object as a floating panel. Wire it to any component's `onhoverinfo` callback:

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

The tooltip automatically clamps to viewport edges so it never overflows off-screen.

### Source Tracking (Multiple Components)

When a page has multiple components sharing one tooltip, use source tracking to prevent one component from clearing another's tooltip:

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

### Components with Tooltip Support

These components emit `onhoverinfo`:

- PlasmidViewer — parts and cut sites
- SequenceViewer — positions, features, cut sites
- GelViewer — bands and lanes
- TraceViewer / MultiTraceViewer — base calls and peaks
- CloningStrategyViewer / CloningHistoryViewer — cloning nodes
- Most chart components — data points and series

## Next Steps

- Browse the [Viewers](/viewers/plasmid-viewer) and [Charts](/charts/dose-response-curve) for component-specific data types
- See the [Cloning Data Model](/cloning/cloning-node) for the recursive cloning tree structure
- Read [Theming](/guide/theming) to customize component appearance
