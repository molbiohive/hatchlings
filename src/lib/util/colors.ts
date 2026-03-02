/** Color palettes for molecular biology visualizations */

/** Nucleotide colors (standard bioinformatics convention) */
export const nucleotideColors: Record<string, string> = {
	A: '#4daf4a', // green
	T: '#e41a1c', // red
	U: '#e41a1c', // red (RNA)
	G: '#377eb8', // blue (dark)
	C: '#ff7f00', // orange
	N: '#999999', // grey
};

/** Feature type colors */
export const featureColors: Record<string, string> = {
	CDS: '#4dc3ff',
	promoter: '#31a354',
	terminator: '#d62728',
	rep_origin: '#9467bd',
	misc_feature: '#8c564b',
	regulatory: '#e377c2',
	gene: '#7f7f7f',
	primer_bind: '#bcbd22',
	protein_bind: '#17becf',
	RBS: '#ff9896',
	sig_peptide: '#aec7e8',
	transit_peptide: '#ffbb78',
	mat_peptide: '#98df8a',
	misc_binding: '#c5b0d5',
	enhancer: '#c49c94',
	intron: '#f7b6d2',
	exon: '#dbdb8d',
	polyA_signal: '#9edae5',
	"3'UTR": '#c7c7c7',
	"5'UTR": '#d9d9d9',
};

/** Amino acid color scheme (Taylor) */
export const aminoAcidColors: Record<string, string> = {
	A: '#ccff00', C: '#ffff00', D: '#ff0000', E: '#ff0066',
	F: '#00ff66', G: '#ff9900', H: '#0066ff', I: '#66ff00',
	K: '#6600ff', L: '#33ff00', M: '#00ff00', N: '#cc00ff',
	P: '#ffcc00', Q: '#ff00cc', R: '#0000ff', S: '#ff3300',
	T: '#ff6600', V: '#99ff00', W: '#00ccff', Y: '#00ffcc',
	'*': '#999999',
};

/** Gel stain color schemes */
export const stainColors = {
	ethidium: {
		background: '#1a0a00',
		band: '#ff6600',
		glow: '#ff9933',
	},
	'sybr-safe': {
		background: '#001a0a',
		band: '#33ff66',
		glow: '#66ff99',
	},
	'sybr-gold': {
		background: '#1a1400',
		band: '#ffcc00',
		glow: '#ffdd44',
	},
	coomassie: {
		background: '#e8e8ff',
		band: '#0033cc',
		glow: '#0044dd',
	},
	silver: {
		background: '#f0f0f0',
		band: '#333333',
		glow: '#555555',
	},
} as const;

/** Sequential color scales */
export const colorScales = {
	viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
	plasma: ['#0d0887', '#4b03a1', '#7d03a8', '#a82296', '#cb4679', '#e56b5d', '#f89441', '#fdc328', '#f0f921'],
	inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
	magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#fcfdbf'],
	blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
	reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
	diverging: ['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b'],
} as const;

/** Get a color for a value in range [min, max] using a color scale */
export function interpolateColor(value: number, min: number, max: number, scale: keyof typeof colorScales = 'viridis'): string {
	const colors = colorScales[scale];
	const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
	const idx = t * (colors.length - 1);
	const lo = Math.floor(idx);
	const hi = Math.min(lo + 1, colors.length - 1);
	const frac = idx - lo;

	if (frac === 0) return colors[lo];

	const r1 = parseInt(colors[lo].slice(1, 3), 16);
	const g1 = parseInt(colors[lo].slice(3, 5), 16);
	const b1 = parseInt(colors[lo].slice(5, 7), 16);
	const r2 = parseInt(colors[hi].slice(1, 3), 16);
	const g2 = parseInt(colors[hi].slice(3, 5), 16);
	const b2 = parseInt(colors[hi].slice(5, 7), 16);

	const r = Math.round(r1 + frac * (r2 - r1));
	const g = Math.round(g1 + frac * (g2 - g1));
	const b = Math.round(b1 + frac * (b2 - b1));

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Default categorical color palette (10 distinct colors) */
export const categoricalColors = [
	'#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
	'#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

/** Get a feature color, falling back to a default */
export function getFeatureColor(type: string, customColor?: string): string {
	return customColor ?? featureColors[type] ?? '#8c564b';
}
