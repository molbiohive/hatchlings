// Types
export * from './types/index.js';

// State
export { SelectionState } from './state/index.js';
export type { SelectionRange } from './state/index.js';

// Utilities
export * from './util/index.js';

// Shared components
export {
	Tooltip,
	SelectionOverlay,
	ContextMenu,
	AxisX,
	AxisY,
	ZoomControls,
	ExportButton,
	ColorLegend,
	ThemeProvider,
} from './components/shared/index.js';

// Domain-specific components
export { PlasmidViewer, PlasmidRing, PartArc, CutSiteMarker, PlasmidLabel, CircularSelection } from './components/plasmid/index.js';
export { SequenceViewer, SequenceRow, AnnotationTrack, TranslationTrack, Ruler, RestrictionMap, DiffViewer } from './components/sequence/index.js';
export { GelViewer, GelBand, GelLane, GelLadder } from './components/gel/index.js';
export { TraceViewer, TracePeaks, BaseCallTrack, AlignmentView } from './components/trace/index.js';
export { ProteinViewer } from './components/protein/index.js';
export { AlignmentViewer } from './components/alignment/index.js';

// InfoBox component
export { default as InfoBox } from './components/shared/InfoBox.svelte';

// Editor components
export { FeatureEditDialog } from './components/editor/index.js';

// Scientific chart components
export {
	ChromatogramViewer,
	SpectrumViewer,
	DoseResponseCurve,
	MeltingCurve,
	BindingKineticsViewer,
	ITCViewer,
	TimeSeriesPlot,
	PlateHeatmap,
	ElectropherogramViewer,
	VolcanoPlot,
	WaterfallPlot,
	DistributionPlot,
	HeatmapViewer,
	ScatterPlot,
	SeqLogo,
	FlowCytometryViewer,
	CompositionChart,
} from './components/charts/index.js';

// Widget wrappers (for hive-browser integration)
export {
	PlasmidWidget,
	SequenceWidget,
	GelWidget,
	TraceWidget,
	PlateWidget,
	DoseResponseWidget,
	ChromatogramWidget,
	KineticsWidget,
	TimeSeriesWidget,
	VolcanoWidget,
	HeatmapWidget,
	ElectropherogramWidget,
	SeqLogoWidget,
} from './widgets/index.js';
