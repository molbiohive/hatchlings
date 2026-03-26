import { defineConfig } from 'vitepress';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	title: 'hatchlings',
	description: 'Svelte 5 molecular biology component library',
	base: '/hatchlings/',
	vite: {
		plugins: [svelte()],
		ssr: { external: ['3dmol'] },
	},
	themeConfig: {
		sidebar: [
			{
				text: 'Guide',
				items: [
					{ text: 'Getting Started', link: '/guide/getting-started' },
					{ text: 'Theming', link: '/guide/theming' },
				],
			},
			{
				text: 'Viewers',
				items: [
					{ text: 'PlasmidViewer', link: '/viewers/plasmid-viewer' },
					{ text: 'SequenceViewer', link: '/viewers/sequence-viewer' },
					{ text: 'GelViewer', link: '/viewers/gel-viewer' },
					{ text: 'TraceViewer', link: '/viewers/trace-viewer' },
					{ text: 'MultiTraceViewer', link: '/viewers/multi-trace-viewer' },
					{ text: 'AlignmentViewer', link: '/viewers/alignment-viewer' },
					{ text: 'ProteinViewer', link: '/viewers/protein-viewer' },
					{ text: 'ProteinSequenceViewer', link: '/viewers/protein-sequence-viewer' },
					{ text: 'DiffViewer', link: '/viewers/diff-viewer' },
					{ text: 'RestrictionMap', link: '/viewers/restriction-map' },
					{ text: 'CloningHistoryViewer', link: '/viewers/cloning-history-viewer' },
					{ text: 'CloningStrategyViewer', link: '/viewers/cloning-strategy-viewer' },
				],
			},
			{
				text: 'Charts',
				items: [
					{ text: 'DoseResponseCurve', link: '/charts/dose-response-curve' },
					{ text: 'ChromatogramViewer', link: '/charts/chromatogram-viewer' },
					{ text: 'PlateHeatmap', link: '/charts/plate-heatmap' },
					{ text: 'TimeSeriesPlot', link: '/charts/time-series-plot' },
					{ text: 'SpectrumViewer', link: '/charts/spectrum-viewer' },
					{ text: 'MeltingCurve', link: '/charts/melting-curve' },
					{ text: 'VolcanoPlot', link: '/charts/volcano-plot' },
					{ text: 'HeatmapViewer', link: '/charts/heatmap-viewer' },
					{ text: 'SeqLogo', link: '/charts/seq-logo' },
					{ text: 'BindingKineticsViewer', link: '/charts/binding-kinetics-viewer' },
					{ text: 'CompositionChart', link: '/charts/composition-chart' },
					{ text: 'ScatterPlot', link: '/charts/scatter-plot' },
					{ text: 'DistributionPlot', link: '/charts/distribution-plot' },
					{ text: 'FlowCytometryViewer', link: '/charts/flow-cytometry-viewer' },
					{ text: 'WaterfallPlot', link: '/charts/waterfall-plot' },
					{ text: 'ElectropherogramViewer', link: '/charts/electropherogram-viewer' },
					{ text: 'ITCViewer', link: '/charts/itc-viewer' },
				],
			},
		],
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/molbiohive/hatchlings' },
		],
	},
});
