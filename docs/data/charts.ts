import type {
	DoseResponseData, ChromData, SpectrumData, MeltingCurveData,
	VolcanoData, HeatmapData, SeqLogoData, KineticsData,
	ITCData, TimeSeriesData, ElectropherogramData,
	WaterfallData, DistributionData, FlowData, ScatterData,
	CompositionData, PlateData,
} from '../../src/lib/types/index.js';

// Dose-response
export const doseResponseData: DoseResponseData = {
	curves: [
		{
			label: 'Compound A',
			points: [
				{ x: 0.001, y: 98 }, { x: 0.003, y: 97 }, { x: 0.01, y: 95 }, { x: 0.03, y: 88 },
				{ x: 0.1, y: 72 }, { x: 0.3, y: 42 }, { x: 1, y: 18 }, { x: 3, y: 8 }, { x: 10, y: 5 },
			],
			fit: {
				line: Array.from({ length: 100 }, (_, i) => {
					const x = 0.0001 * Math.pow(10, i * 5 / 99);
					return { x, y: 5 + (98 - 5) / (1 + Math.pow(x / 0.35, 1.2)) };
				}),
				params: { top: 98, bottom: 5, ic50: 0.35, hillSlope: -1.2 },
				r2: 0.997,
				ci95: { ic50: [0.28, 0.43] as [number, number] },
			},
		},
		{
			label: 'Compound B',
			points: [
				{ x: 0.001, y: 99 }, { x: 0.01, y: 96 }, { x: 0.1, y: 90 }, { x: 0.3, y: 75 },
				{ x: 1, y: 50 }, { x: 3, y: 25 }, { x: 10, y: 12 }, { x: 30, y: 8 },
			],
			fit: {
				line: Array.from({ length: 100 }, (_, i) => {
					const x = 0.0001 * Math.pow(10, i * 5.5 / 99);
					return { x, y: 8 + (99 - 8) / (1 + Math.pow(x / 1.1, 1.0)) };
				}),
				params: { top: 99, bottom: 8, ic50: 1.1, hillSlope: -1.0 },
				r2: 0.994,
			},
		},
	],
};

// Chromatography
export const chromData: ChromData = {
	traces: [
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
			yAxis: 'right',
			color: '#ff7f00',
			unit: '%B',
		},
	],
	fractions: [
		{ name: 'F1', start: 6, end: 10, color: '#4daf4a' },
		{ name: 'F2', start: 10, end: 15, color: '#e41a1c' },
		{ name: 'F3', start: 16, end: 20, color: '#377eb8' },
	],
	xLabel: 'Volume (mL)',
};

// Spectrum
export const spectrumData: SpectrumData = {
	x: Array.from({ length: 200 }, (_, i) => 200 + i * 2),
	y: Array.from({ length: 200 }, (_, i) => {
		const w = 200 + i * 2;
		return 0.8 * Math.exp(-((w - 280) ** 2) / 400) + 0.3 * Math.exp(-((w - 220) ** 2) / 200);
	}),
	peaks: [
		{ x: 220, y: 0.3, label: '220 nm' },
		{ x: 280, y: 0.8, label: '280 nm' },
	],
	xLabel: 'Wavelength (nm)',
	yLabel: 'Absorbance',
	title: 'UV Absorption Spectrum',
};

// Melting curve
export const meltingCurveData: MeltingCurveData = {
	curves: [
		{
			name: 'Protein A',
			temp: Array.from({ length: 80 }, (_, i) => 25 + i),
			ratio: Array.from({ length: 80 }, (_, i) => 0.6 + 0.3 / (1 + Math.exp(-(25 + i - 58) / 2))),
			derivative: Array.from({ length: 80 }, (_, i) => {
				const e = Math.exp(-(25 + i - 58) / 2);
				return 0.3 * e / (2 * (1 + e) ** 2);
			}),
			tm: 58,
		},
		{
			name: 'Protein B',
			temp: Array.from({ length: 80 }, (_, i) => 25 + i),
			ratio: Array.from({ length: 80 }, (_, i) => 0.55 + 0.35 / (1 + Math.exp(-(25 + i - 72) / 3))),
			derivative: Array.from({ length: 80 }, (_, i) => {
				const e = Math.exp(-(25 + i - 72) / 3);
				return 0.35 * e / (3 * (1 + e) ** 2);
			}),
			tm: 72,
		},
	],
};

// Volcano plot
export const volcanoData: VolcanoData = {
	points: Array.from({ length: 200 }, (_, i) => {
		// Deterministic pseudo-random
		const seed1 = Math.sin(i * 127.1) * 43758.5453;
		const r1 = seed1 - Math.floor(seed1);
		const seed2 = Math.sin(i * 269.5) * 43758.5453;
		const r2 = seed2 - Math.floor(seed2);
		const x = (r1 - 0.5) * 8;
		const y = r2 * 6;
		return {
			x, y,
			label: Math.abs(x) > 1 && y > 1.3 ? `Gene${i}` : undefined,
			significant: Math.abs(x) > 1 && y > 1.3,
		};
	}),
	thresholds: { x: 1, y: 1.3, xNeg: -1 },
};

// Heatmap
export const heatmapData: HeatmapData = {
	rows: ['Gene1', 'Gene2', 'Gene3', 'Gene4', 'Gene5', 'Gene6', 'Gene7', 'Gene8'],
	cols: ['WT', 'KO_1', 'KO_2', 'OE_1', 'OE_2', 'Drug_1', 'Drug_2'],
	values: [
		[0.2, -1.8, -1.5, 1.2, 1.4, 0.3, 0.1],
		[-0.5, 1.2, 1.0, -0.8, -1.1, 0.6, 0.4],
		[1.5, -0.3, -0.5, 1.8, 2.0, -1.2, -1.0],
		[-1.2, 0.8, 0.6, -1.5, -1.3, 0.9, 1.1],
		[0.8, -1.0, -0.8, 0.5, 0.7, -0.4, -0.2],
		[-0.3, 1.5, 1.3, -0.6, -0.4, 1.2, 1.4],
		[1.0, -0.5, -0.7, 1.0, 0.8, -0.8, -0.6],
		[-0.8, 0.3, 0.5, -1.0, -0.9, 0.5, 0.7],
	],
	colorScale: 'diverging',
};

// Sequence logo
export const seqLogoData: SeqLogoData = {
	positions: [
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
	],
	alphabet: 'dna',
};

// Binding kinetics (SPR)
export const kineticsData: KineticsData = {
	curves: [100, 50, 25, 12.5].map((conc) => {
		const x = Array.from({ length: 200 }, (_, i) => i * 0.5);
		const ka = 1e5, kd = 1e-3, rmax = 80;
		const y = x.map((t) => {
			const cM = conc * 1e-9;
			if (t < 30) return 0;
			if (t < 130) {
				const tA = t - 30;
				return rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
			}
			const tA = 100;
			const rEq = rmax * cM * ka / (cM * ka + kd) * (1 - Math.exp(-(cM * ka + kd) * tA));
			return rEq * Math.exp(-kd * (t - 130));
		});
		return { name: `${conc} nM`, concentration: conc * 1e-9, x, y };
	}),
	steps: [
		{ name: 'Baseline', start: 0, end: 30, type: 'baseline' },
		{ name: 'Association', start: 30, end: 130, type: 'association' },
		{ name: 'Dissociation', start: 130, end: 200, type: 'dissociation' },
	],
	params: { ka: 1e5, kd: 1e-3, KD: 1e-8, chi2: 0.15, rMax: 80 },
};

// ITC
export const itcData: ITCData = {
	rawThermogram: {
		time: Array.from({ length: 300 }, (_, i) => i * 10),
		power: Array.from({ length: 300 }, (_, i) => {
			const injection = Math.floor(i / 15);
			const inPeak = i % 15 < 3;
			if (!inPeak) return 0.1 + Math.sin(i * 0.1) * 0.05;
			const decay = Math.exp(-(injection * 0.3));
			return -8 * decay + 0.1;
		}),
	},
	isotherm: {
		ratio: Array.from({ length: 20 }, (_, i) => (i + 1) * 0.15),
		heat: Array.from({ length: 20 }, (_, i) => {
			const r = (i + 1) * 0.15;
			return -12 / (1 + Math.exp((r - 1.0) * 4)) - 0.5;
		}),
		fit: {
			x: Array.from({ length: 100 }, (_, i) => i * 0.035),
			y: Array.from({ length: 100 }, (_, i) => {
				const r = i * 0.035;
				return -12 / (1 + Math.exp((r - 1.0) * 4)) - 0.5;
			}),
		},
	},
	params: { N: 1.02, Ka: 2.5e6, deltaH: -12.3, deltaS: -8.1, Kd: 4e-7 },
};

// Time series
export const timeSeriesData: TimeSeriesData = {
	series: [{
		name: 'OD600',
		x: Array.from({ length: 25 }, (_, i) => i),
		y: Array.from({ length: 25 }, (_, i) => {
			const growth = 0.05 * Math.exp(0.3 * Math.min(i, 12)) / (1 + (0.05 / 2.0) * (Math.exp(0.3 * Math.min(i, 12)) - 1));
			return growth + Math.sin(i * 0.5) * 0.02;
		}),
		unit: 'OD600',
	}],
	events: [
		{ time: 5, label: 'IPTG induction', color: '#d45858' },
	],
	xLabel: 'Time (hr)',
};

// Plate heatmap
export const plateData: PlateData = {
	format: 96,
	wells: (() => {
		const w = [];
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 12; c++) {
				const id = String.fromCharCode(65 + r) + (c + 1);
				// Deterministic values
				const seed = Math.sin((r * 12 + c) * 127.1) * 43758.5453;
				let v = (seed - Math.floor(seed)) * 100;
				let g = 'sample';
				if (c === 0) { v = 95 + (seed - Math.floor(seed)) * 5; g = 'positive'; }
				if (c === 11) { v = (seed - Math.floor(seed)) * 8; g = 'negative'; }
				w.push({ id, value: v, group: g });
			}
		}
		return w;
	})(),
};

// Electropherogram
export const electropherogramData: ElectropherogramData = {
	x: Array.from({ length: 300 }, (_, i) => i * 0.5),
	y: Array.from({ length: 300 }, (_, i) => {
		const x = i * 0.5;
		return 50 * Math.exp(-((x - 30) ** 2) / 10) +
			120 * Math.exp(-((x - 60) ** 2) / 15) +
			35 * Math.exp(-((x - 90) ** 2) / 8) +
			80 * Math.exp(-((x - 120) ** 2) / 12);
	}),
	peaks: [
		{ x: 30, height: 50, size: 200, label: '200 bp' },
		{ x: 60, height: 120, size: 500, label: '500 bp' },
		{ x: 90, height: 35, size: 1000, label: '1000 bp' },
		{ x: 120, height: 80, size: 2000, label: '2000 bp' },
	],
	xLabel: 'Migration time (s)',
	yLabel: 'Fluorescence (RFU)',
};

// Waterfall plot
export const waterfallData: WaterfallData = {
	bars: [
		{ label: 'Patient 1', value: -45, category: 'responder', color: '#4dc3ff' },
		{ label: 'Patient 2', value: -38, category: 'responder', color: '#4dc3ff' },
		{ label: 'Patient 3', value: -30, category: 'responder', color: '#4dc3ff' },
		{ label: 'Patient 4', value: -22, category: 'partial', color: '#58b56a' },
		{ label: 'Patient 5', value: -15, category: 'partial', color: '#58b56a' },
		{ label: 'Patient 6', value: -8, category: 'stable', color: '#d9953a' },
		{ label: 'Patient 7', value: 2, category: 'stable', color: '#d9953a' },
		{ label: 'Patient 8', value: 12, category: 'progression', color: '#d45858' },
		{ label: 'Patient 9', value: 25, category: 'progression', color: '#d45858' },
		{ label: 'Patient 10', value: 40, category: 'progression', color: '#d45858' },
	],
};

// Distribution plot
export const distributionData: DistributionData = {
	bins: Array.from({ length: 30 }, (_, i) => {
		const start = i * 2;
		const end = start + 2;
		// Normal-ish distribution centered at 30
		const mid = start + 1;
		const count = Math.round(100 * Math.exp(-((mid - 30) ** 2) / 200));
		return { start, end, count };
	}),
	overlay: {
		x: Array.from({ length: 100 }, (_, i) => i * 0.6),
		y: Array.from({ length: 100 }, (_, i) => {
			const x = i * 0.6;
			return 100 * Math.exp(-((x - 30) ** 2) / 200);
		}),
	},
};

// Flow cytometry
export const flowData: FlowData = {
	events: Array.from({ length: 2000 }, (_, i) => {
		const s1 = Math.sin(i * 127.1) * 43758.5453;
		const s2 = Math.sin(i * 269.5) * 43758.5453;
		const s3 = Math.sin(i * 419.2) * 43758.5453;
		const r1 = s1 - Math.floor(s1);
		const r2 = s2 - Math.floor(s2);
		const cluster = s3 - Math.floor(s3);
		if (cluster < 0.4) {
			return [r1 * 200 + 100, r2 * 200 + 100];
		} else if (cluster < 0.7) {
			return [r1 * 300 + 500, r2 * 300 + 500];
		} else {
			return [r1 * 150 + 800, r2 * 150 + 200];
		}
	}),
	axes: [
		{ name: 'FSC-A', index: 0 },
		{ name: 'SSC-A', index: 1 },
	],
	gates: [
		{ name: 'Lymphocytes', type: 'rectangle', coordinates: [50, 50, 350, 350], color: '#4dc3ff' },
		{ name: 'Granulocytes', type: 'rectangle', coordinates: [400, 400, 850, 850], color: '#58b56a' },
	],
};

// Scatter plot
export const scatterData: ScatterData = {
	points: Array.from({ length: 100 }, (_, i) => {
		const s1 = Math.sin(i * 127.1) * 43758.5453;
		const s2 = Math.sin(i * 269.5) * 43758.5453;
		const r1 = s1 - Math.floor(s1);
		const r2 = s2 - Math.floor(s2);
		const x = r1 * 10;
		const y = x * 0.8 + (r2 - 0.5) * 3;
		return { x, y, label: i % 20 === 0 ? `Sample ${i}` : undefined };
	}),
	axes: { x: 'Expression (log2)', y: 'Enrichment (fold)' },
};

// Composition
export const compositionData: CompositionData = {
	counts: { A: 58, T: 42, G: 55, C: 48 },
	alphabet: 'dna',
	gc: 0.507,
	length: 203,
};
