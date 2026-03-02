# hatchlings

Svelte 5 molecular biology component library. Pure rendering components for scientific visualizations -- plasmid maps, gel electrophoresis, Sanger trace chromatograms, sequence viewers, and 16 chart types for life science data.

## Install

Not yet published to npm. To use from source:

```bash
git clone https://github.com/molbiohive/hatchlings.git
cd hatchlings
bun install
```

## Components

### Core Viewers
- **PlasmidViewer** -- circular plasmid map with features, primers, cut sites, tick marks
- **SequenceViewer** -- linear DNA/protein sequence with annotations, translations, enzyme sites
- **GelViewer** -- gel electrophoresis with multiple stain types, ladder, band tooltips
- **TraceViewer** -- Sanger sequencing chromatogram with base calls, quality scores, alignment

### Charts
- **DoseResponseCurve** -- IC50/EC50 curves with sigmoid fit
- **BindingKineticsViewer** -- SPR/BLI sensorgrams with ka/kd/KD
- **ITCViewer** -- isothermal titration calorimetry (thermogram + isotherm)
- **VolcanoPlot** -- differential expression with fold-change thresholds
- **HeatmapViewer** -- gene expression / correlation matrices
- **PlateHeatmap** -- 6 to 1536-well plate layouts with Z-factor
- **MeltingCurve** -- thermal shift / DSF with Tm annotation
- **ChromatogramViewer** -- FPLC/HPLC with UV, conductivity, fractions
- **SpectrumViewer** -- UV-Vis / fluorescence spectra with peak annotation
- **FlowCytometryViewer** -- scatter/density plots with gating
- **ElectropherogramViewer** -- capillary electrophoresis fragment analysis
- **ScatterPlot** -- general XY scatter with grouping and gates
- **TimeSeriesPlot** -- multi-series time course with dual Y axes
- **DistributionPlot** -- histogram / density / cumulative modes
- **WaterfallPlot** -- ranked bar charts (e.g. CRISPR screen hits)
- **SeqLogo** -- sequence logo (DNA/RNA/protein) with information content

## Usage

```svelte
<script>
  import { PlasmidViewer, GelViewer } from 'hatchlings';
</script>

<PlasmidViewer
  name="pUC19"
  size={2686}
  features={[
    { name: 'lacZ', type: 'CDS', start: 396, end: 1986, strand: 1 },
    { name: 'AmpR', type: 'CDS', start: 2086, end: 2686, strand: -1 },
  ]}
/>
```

## Theming

All components use `--hatch-*` CSS custom properties with sensible dark-theme defaults. Override any variable on a parent element:

```css
.my-wrapper {
  --hatch-bg: #ffffff;
  --hatch-text: #1a1a1a;
  --hatch-plot-bg: #f5f5f5;
  --hatch-axis-color: #ccc;
  --hatch-axis-text: #666;
  --hatch-grid-color: #e0e0e0;
  --hatch-font-mono: 'JetBrains Mono', monospace;
}
```

Available variables: `--hatch-bg`, `--hatch-plot-bg`, `--hatch-text`, `--hatch-text-muted`, `--hatch-text-dim`, `--hatch-axis-color`, `--hatch-axis-text`, `--hatch-axis-label`, `--hatch-grid-color`, `--hatch-border`, `--hatch-ring-color`, `--hatch-tick-major`, `--hatch-tick-minor`, `--hatch-cut-site`, `--hatch-highlight`, `--hatch-positive`, `--hatch-negative`, `--hatch-warning`, `--hatch-font-mono`, `--hatch-font`.

## Architecture

Components are pure renderers. They accept pre-computed data and produce SVG/Canvas output. Zero biology computation happens in the frontend -- all analysis (sequence parsing, band migration, trace processing) is handled by backend tools that send results via WebSocket or API.

## Development

```bash
bun install
bun run dev        # dev server at localhost:5173
bun run build      # production build + package
bun run check      # svelte-check type checking
```

## License

[MIT](LICENSE)
