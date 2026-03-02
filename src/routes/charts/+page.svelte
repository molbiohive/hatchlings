<script lang="ts">
	import DoseResponseCurve from '$lib/components/charts/DoseResponseCurve.svelte';
	import ChromatogramViewer from '$lib/components/charts/ChromatogramViewer.svelte';
	import PlateHeatmap from '$lib/components/charts/PlateHeatmap.svelte';
	import TimeSeriesPlot from '$lib/components/charts/TimeSeriesPlot.svelte';
	import SpectrumViewer from '$lib/components/charts/SpectrumViewer.svelte';
	import MeltingCurve from '$lib/components/charts/MeltingCurve.svelte';
	import VolcanoPlot from '$lib/components/charts/VolcanoPlot.svelte';
	import HeatmapViewer from '$lib/components/charts/HeatmapViewer.svelte';
	import SeqLogo from '$lib/components/charts/SeqLogo.svelte';
	import BindingKineticsViewer from '$lib/components/charts/BindingKineticsViewer.svelte';
	import type { DoseResponseCurveData } from '$lib/types/index.js';

	// Mock dose-response data
	const doseResponseCurves: DoseResponseCurveData[] = [
		{
			label: 'Compound A',
			points: [
				{ x: 0.001, y: 98 }, { x: 0.003, y: 97 }, { x: 0.01, y: 95 },
				{ x: 0.03, y: 88 }, { x: 0.1, y: 72 }, { x: 0.3, y: 42 },
				{ x: 1, y: 18 }, { x: 3, y: 8 }, { x: 10, y: 5 },
			],
			fit: {
				line: Array.from({ length: 100 }, (_, i) => {
					const x = 0.0001 * Math.pow(10, i * 5 / 99);
					const y = 5 + (98 - 5) / (1 + Math.pow(x / 0.35, 1.2));
					return { x, y };
				}),
				params: { top: 98, bottom: 5, ic50: 0.35, hillSlope: -1.2 },
				r2: 0.997,
				ci95: { ic50: [0.28, 0.43] as [number, number] },
			},
		},
		{
			label: 'Compound B',
			points: [
				{ x: 0.001, y: 99 }, { x: 0.01, y: 96 }, { x: 0.1, y: 90 },
				{ x: 0.3, y: 75 }, { x: 1, y: 50 }, { x: 3, y: 25 },
				{ x: 10, y: 12 }, { x: 30, y: 8 },
			],
			fit: {
				line: Array.from({ length: 100 }, (_, i) => {
					const x = 0.0001 * Math.pow(10, i * 5.5 / 99);
					const y = 8 + (99 - 8) / (1 + Math.pow(x / 1.1, 1.0));
					return { x, y };
				}),
				params: { top: 99, bottom: 8, ic50: 1.1, hillSlope: -1.0 },
				r2: 0.994,
			},
		},
	];

	// Mock chromatogram data (SEC)
	const chromTraces = [
		{
			name: 'UV 280nm',
			x: Array.from({ length: 200 }, (_, i) => i * 0.15),
			y: Array.from({ length: 200 }, (_, i) => {
				const x = i * 0.15;
				return 20 * Math.exp(-((x - 8) ** 2) / 1.5) + 80 * Math.exp(-((x - 12) ** 2) / 2) + 5 * Math.exp(-((x - 18) ** 2) / 3);
			}),
			unit: 'mAU',
		},
		{
			name: '% Buffer B',
			x: Array.from({ length: 200 }, (_, i) => i * 0.15),
			y: Array.from({ length: 200 }, (_, i) => Math.min(100, Math.max(0, (i - 50) * 0.8))),
			yAxis: 'right' as const,
			color: '#ff7f00',
			unit: '%B',
		},
	];
	const chromFractions = [
		{ name: 'F1', start: 6, end: 10, color: '#4daf4a' },
		{ name: 'F2', start: 10, end: 15, color: '#e41a1c' },
		{ name: 'F3', start: 16, end: 20, color: '#377eb8' },
	];

	// Mock plate data (96-well)
	const plateWells = (() => {
		const wells = [];
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 12; c++) {
				const id = String.fromCharCode(65 + r) + (c + 1);
				let value = Math.random() * 100;
				let group = 'sample';
				if (c === 0) { value = 95 + Math.random() * 5; group = 'positive'; }
				if (c === 11) { value = Math.random() * 8; group = 'negative'; }
				wells.push({ id, value, group });
			}
		}
		return wells;
	})();

	// Mock growth curve data
	const growthSeries = [
		{
			name: 'OD600',
			x: Array.from({ length: 25 }, (_, i) => i),
			y: Array.from({ length: 25 }, (_, i) => {
				const t = i;
				return 0.05 * Math.exp(0.3 * Math.min(t, 12)) / (1 + (0.05 / 2.0) * (Math.exp(0.3 * Math.min(t, 12)) - 1)) + (Math.random() - 0.5) * 0.02;
			}),
			unit: 'OD600',
		},
	];

	// Mock UV spectrum
	const specX = Array.from({ length: 200 }, (_, i) => 200 + i * 2);
	const specY = specX.map(wl => {
		return 0.8 * Math.exp(-((wl - 280) ** 2) / 400) + 0.3 * Math.exp(-((wl - 220) ** 2) / 200);
	});

	// Mock melting curve
	const meltCurves = [
		{
			name: 'Protein A',
			temp: Array.from({ length: 80 }, (_, i) => 25 + i),
			ratio: Array.from({ length: 80 }, (_, i) => {
				const t = 25 + i;
				return 0.6 + 0.3 / (1 + Math.exp(-(t - 58) / 2));
			}),
			derivative: Array.from({ length: 80 }, (_, i) => {
				const t = 25 + i;
				const e = Math.exp(-(t - 58) / 2);
				return 0.3 * e / (2 * (1 + e) ** 2);
			}),
			tm: 58,
		},
		{
			name: 'Protein B',
			temp: Array.from({ length: 80 }, (_, i) => 25 + i),
			ratio: Array.from({ length: 80 }, (_, i) => {
				const t = 25 + i;
				return 0.55 + 0.35 / (1 + Math.exp(-(t - 72) / 3));
			}),
			derivative: Array.from({ length: 80 }, (_, i) => {
				const t = 25 + i;
				const e = Math.exp(-(t - 72) / 3);
				return 0.35 * e / (3 * (1 + e) ** 2);
			}),
			tm: 72,
		},
	];

	// Mock volcano plot
	const volcanoPoints = Array.from({ length: 200 }, (_, i) => {
		const x = (Math.random() - 0.5) * 8;
		const y = Math.random() * 6;
		const significant = Math.abs(x) > 1 && y > 1.3;
		return { x, y, label: significant ? `Gene${i}` : undefined, significant };
	});

	// Mock heatmap
	const heatRows = ['Gene1', 'Gene2', 'Gene3', 'Gene4', 'Gene5', 'Gene6', 'Gene7', 'Gene8'];
	const heatCols = ['WT', 'KO_1', 'KO_2', 'OE_1', 'OE_2', 'Drug_1', 'Drug_2'];
	const heatValues = heatRows.map(() => heatCols.map(() => (Math.random() - 0.5) * 4));

	// Mock SeqLogo
	const logoPositions = [
		{ A: 0.1, C: 0.1, G: 0.1, T: 0.7 },
		{ A: 0.8, C: 0.05, G: 0.1, T: 0.05 },
		{ A: 0.05, C: 0.05, G: 0.05, T: 0.85 },
		{ A: 0.9, C: 0.03, G: 0.04, T: 0.03 },
		{ A: 0.25, C: 0.25, G: 0.25, T: 0.25 },
		{ A: 0.05, C: 0.8, G: 0.1, T: 0.05 },
		{ A: 0.05, C: 0.05, G: 0.85, T: 0.05 },
		{ A: 0.1, C: 0.1, G: 0.7, T: 0.1 },
		{ A: 0.6, C: 0.15, G: 0.15, T: 0.1 },
		{ A: 0.25, C: 0.25, G: 0.25, T: 0.25 },
	];

	// Mock kinetics data (SPR)
	const kineticsCurves = [100, 50, 25, 12.5].map((conc, idx) => {
		const x = Array.from({ length: 200 }, (_, i) => i * 0.5);
		const ka = 1e5, kd = 1e-3, rmax = 80;
		const y = x.map(t => {
			const cM = conc * 1e-9;
			if (t < 30) return 0;
			if (t < 130) {
				const tA = t - 30;
				return rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
			}
			const tA = 100;
			const rEq = rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
			const tD = t - 130;
			return rEq * Math.exp(-kd * tD);
		});
		return { name: `${conc} nM`, concentration: conc * 1e-9, x, y };
	});
</script>

<h1>Scientific Charts</h1>

<section>
	<h2>Dose-Response Curve</h2>
	<DoseResponseCurve
		curves={doseResponseCurves}
		xLabel="Concentration (\u00B5M)"
		yLabel="% Viability"
	/>
</section>

<section>
	<h2>Chromatogram (SEC)</h2>
	<ChromatogramViewer
		traces={chromTraces}
		fractions={chromFractions}
		xLabel="Volume (mL)"
	/>
</section>

<section>
	<h2>Plate Heatmap (96-well)</h2>
	<PlateHeatmap
		format={96}
		wells={plateWells}
		zFactor={0.62}
		title="Viability Assay"
		colorScale="viridis"
	/>
</section>

<section>
	<h2>Growth Curve</h2>
	<TimeSeriesPlot
		series={growthSeries}
		xLabel="Time (h)"
		showPoints={true}
	/>
</section>

<section>
	<h2>UV Absorption Spectrum</h2>
	<SpectrumViewer
		x={specX}
		y={specY}
		peaks={[{ x: 280, y: 0.8, label: 'A280' }, { x: 220, y: 0.3, label: 'A220' }]}
		xLabel="Wavelength (nm)"
		yLabel="Absorbance (AU)"
		title="BSA UV Spectrum"
	/>
</section>

<section>
	<h2>Melting Curve (nanoDSF)</h2>
	<MeltingCurve curves={meltCurves} />
</section>

<section>
	<h2>Volcano Plot</h2>
	<VolcanoPlot points={volcanoPoints} />
</section>

<section>
	<h2>Heatmap</h2>
	<HeatmapViewer rows={heatRows} cols={heatCols} values={heatValues} colorScale="diverging" />
</section>

<section>
	<h2>Sequence Logo</h2>
	<SeqLogo positions={logoPositions} title="TATA Box Motif" />
</section>

<section>
	<h2>Binding Kinetics (SPR)</h2>
	<BindingKineticsViewer
		curves={kineticsCurves}
		steps={[
			{ name: 'Baseline', start: 0, end: 30, type: 'baseline' },
			{ name: 'Association', start: 30, end: 130, type: 'association' },
			{ name: 'Dissociation', start: 130, end: 200, type: 'dissociation' },
		]}
		params={{ ka: 1e5, kd: 1e-3, KD: 1e-8 }}
	/>
</section>

<style>
	h1 {
		color: #7dd3fc;
		font-family: 'SF Mono', 'Fira Code', monospace;
		margin-bottom: 24px;
	}

	section {
		margin-bottom: 40px;
	}

	h2 {
		color: #ccc;
		font-size: 18px;
		margin-bottom: 12px;
		border-bottom: 1px solid #2a2a4a;
		padding-bottom: 6px;
	}
</style>
