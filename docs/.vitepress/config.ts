import { defineConfig } from 'vitepress';
import { svelteDocs } from './svelte-plugin';

export default defineConfig({
	title: 'hatchlings',
	description: 'Svelte 5 molecular biology component library',
	base: '/hatchlings/',
	vite: {
		plugins: [...svelteDocs()],
		ssr: { external: ['3dmol'] },
	},
	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/getting-started' },
			{ text: 'Viewers', link: '/viewers/plasmid-viewer' },
			{ text: 'Cloning', link: '/cloning/cloning-node' },
			{ text: 'Charts', link: '/charts/dose-response-curve' },
			{ text: 'Reference', link: '/reference/data-interfaces' },
			{
				text: 'v0.8.0',
				items: [
					{ text: 'npm', link: 'https://www.npmjs.com/package/@molbiohive/hatchlings' },
					{ text: 'Changelog', link: 'https://github.com/molbiohive/hatchlings/releases' },
				],
			},
		],
		sidebar: {
			'/guide/': [
				{
					text: 'Guide',
					items: [
						{ text: 'Getting Started', link: '/guide/getting-started' },
					],
				},
			],
			'/reference/': [
				{
					text: 'Reference',
					items: [
						{ text: 'Data Interfaces', link: '/reference/data-interfaces' },
						{ text: 'Theming', link: '/reference/theming' },
						{ text: 'Tooltips', link: '/reference/tooltips' },
						{ text: 'Selection & Sync', link: '/reference/selection-sync' },
					],
				},
			],
			'/viewers/': [
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
					],
				},
			],
			'/cloning/': [
				{
					text: 'Cloning',
					items: [
						{ text: 'CloningNode', link: '/cloning/cloning-node' },
						{ text: 'CloningAction', link: '/cloning/cloning-action' },
						{ text: 'Cloning Tree', link: '/cloning/cloning-tree' },
						{ text: 'CloningStrategyViewer', link: '/cloning/cloning-strategy-viewer' },
						{ text: 'CloningHistoryViewer', link: '/cloning/cloning-history-viewer' },
					],
				},
			],
			'/charts/': [
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
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/molbiohive/hatchlings' },
		],
	},
});
