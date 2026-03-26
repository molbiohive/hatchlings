# Data Interfaces

Every component receives pre-computed data through a typed `data` prop. Components never fetch, parse, or compute data on their own.

## Type Modules

All types are exported from the package root:

```ts
import type { PlasmidData, Part, CutSite } from '@molbiohive/hatchlings';
```

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

## Core Shared Types

### `Part`

Annotated region on a sequence — genes, promoters, primers, misc features.

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

Used by PlasmidViewer, SequenceViewer, DiffViewer, RestrictionMap, and CloningNode.

### `CutSite`

Restriction enzyme recognition and cut site.

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

Translated reading frame displayed as amino acids below the sequence.

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

Used by SequenceViewer, AlignmentViewer, and DiffViewer to select residue coloring and validation.

## PlasmidData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Plasmid name |
| `size` | `number` | yes | Total length in bp |
| `topology` | `'circular' \| 'linear'` | yes | Display mode |
| `seq` | `string` | no | Full nucleotide sequence |
| `parts` | `Part[]` | yes | Features and primers |
| `cutSites` | `CutSite[]` | yes | Restriction sites |

## SequenceData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `seq` | `string` | yes | Nucleotide sequence |
| `parts` | `Part[]` | yes | Features and primers |
| `cutSites` | `CutSite[]` | yes | Restriction sites |
| `translations` | `Translation[]` | yes | Amino acid translations |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |
| `topology` | `string` | no | `'linear' \| 'circular'` |

## GelData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lanes` | `GelLane[]` | yes | Lanes with bands |
| `gelType` | `GelType` | yes | `'agarose' \| 'sds-page' \| 'native-page'` |
| `stain` | `StainType` | yes | `'ethidium' \| 'sybr-safe' \| 'sybr-gold' \| 'coomassie' \| 'silver'` |
| `gelPercent` | `number` | no | Gel percentage |

## TraceData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `baseCalls` | `string` | yes | Called bases |
| `qualityScores` | `number[]` | yes | Phred quality per base |
| `channels` | `TraceChannel` | yes | `{ A, C, G, T }` signal arrays |
| `peakPositions` | `number[]` | yes | Peak center positions |
| `alignment` | `TraceAlignment` | no | Alignment to reference |
| `label` | `string` | no | Trace label |
| `trimQuality` | `number` | no | Quality trim threshold |

## AlignmentData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sequences` | `AlignmentSequence[]` | yes | Aligned sequences |
| `alphabet` | `Alphabet` | no | `'dna' \| 'rna' \| 'protein'` |
| `conservation` | `ConservationScore[]` | no | Per-position scores |
| `annotations` | `AlignmentAnnotation[]` | no | Region annotations |
| `name` | `string` | no | Alignment name |

## DiffData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `seqA` | `string` | yes | First sequence |
| `seqB` | `string` | yes | Second sequence |
| `nameA` | `string` | no | Label for first sequence |
| `nameB` | `string` | no | Label for second sequence |
| `featuresA` | `Part[]` | no | Features on sequence A |
| `featuresB` | `Part[]` | no | Features on sequence B |
| `alphabet` | `Alphabet` | no | Sequence alphabet |
