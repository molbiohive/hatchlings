import type { CloningNode, Part, CutSite } from '../../src/lib/types/index.js';

function randSeq(n: number, seed = 42): string {
	const bases = 'ATGC';
	let s = '';
	let x = seed;
	for (let i = 0; i < n; i++) {
		x = (Math.imul(x, 1103515245) + 12345) | 0;
		s += bases[((x >>> 16) & 0x7fff) % 4];
	}
	return s;
}

// Restriction / Ligation
const reVector: CloningNode = {
	id: 're-vec', name: 'pUC19', size: 2686, topology: 'circular',
	parts: [
		{ name: 'lacZa', type: 'CDS', start: 200, end: 680, strand: 1, color: '#3b82f6' },
		{ name: 'AmpR', type: 'CDS', start: 1200, end: 2060, strand: -1, color: '#4dc3ff' },
		{ name: 'ori', type: 'rep_origin', start: 2060, end: 2500, strand: -1, color: '#9467bd' },
	],
	cutSites: [
		{ enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'AATT' },
		{ enzyme: 'BamHI', position: 418, end: 424, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'GATC' },
	],
};

const reInsert: CloningNode = {
	id: 're-ins', name: 'GFP fragment', size: 720, topology: 'linear',
	parts: [{ name: 'GFP', type: 'CDS', start: 6, end: 714, strand: 1, color: '#22c55e' }],
	cutSites: [
		{ enzyme: 'EcoRI', position: 0, end: 6, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'AATT' },
		{ enzyme: 'BamHI', position: 714, end: 720, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'GATC' },
	],
};

export const restrictionLigationResult: CloningNode = {
	id: 're-res', name: 'pUC19-GFP', size: 3400, topology: 'circular',
	source: {
		action: { paradigm: 'ligation', label: 'Ligate', enzymes: ['EcoRI', 'BamHI'], notes: 'T4 ligase, 16°C overnight' },
		inputs: [
			{ label: 'EcoRI + BamHI digest', node: reVector },
			{ label: 'EcoRI + BamHI ends', node: reInsert },
		],
	},
};

// Gibson Assembly
const gibsonBackbone: CloningNode = {
	id: 'gib-bb', name: 'pTK-Express (lin.)', size: 4820, topology: 'linear',
	sequence: randSeq(4820, 88),
};

const gibsonInsert: CloningNode = {
	id: 'gib-ins', name: 'Cbln1 amplicon', size: 780, topology: 'linear',
	sequence: randSeq(780, 99),
};

export const gibsonResult: CloningNode = {
	id: 'gib-res', name: 'Cbln1-mNG', size: 5510, topology: 'circular',
	sequence: randSeq(5510, 55),
	source: {
		action: { paradigm: 'gibson', label: 'Gibson Assembly', temperature: '50°C', duration: '1 hr' },
		inputs: [
			{ label: 'Linearized backbone', node: gibsonBackbone },
			{ label: '30bp overlap arms', node: gibsonInsert },
		],
	},
};

// Cloning history tree
const cblnRNA: CloningNode = {
	id: 'cbln-rna', name: 'Cbln1.rna', size: 1620, topology: 'linear',
	parts: [
		{ name: 'Cbln1 CDS', type: 'CDS', start: 105, end: 690, strand: 1, color: '#f97316' },
		{ name: "5' UTR", type: 'misc_feature', start: 0, end: 105, strand: 1, color: '#94a3b8' },
		{ name: "3' UTR", type: 'misc_feature', start: 690, end: 1620, strand: 1, color: '#94a3b8' },
	],
	description: 'Cerebellin-1 mRNA template',
};

const pTK_Backbone: CloningNode = {
	id: 'ptk-bb', name: 'pTK-Express', size: 4820, topology: 'circular',
	parts: [
		{ name: 'mNeonGreen', type: 'CDS', start: 679, end: 1395, strand: 1, color: '#e6c84c' },
		{ name: 'T7 pro', type: 'promoter', start: 1, end: 589, strand: 1, color: '#31a354' },
		{ name: 'AmpR', type: 'CDS', start: 1631, end: 2425, strand: 1, color: '#4dc3ff' },
		{ name: 'ColE1', type: 'rep_origin', start: 2844, end: 3432, strand: -1, color: '#9467bd' },
		{ name: 'rrnB T1', type: 'terminator', start: 1420, end: 1580, strand: 1, color: '#e377c2' },
	],
	cutSites: [
		{ enzyme: 'EcoRI', position: 619, end: 625, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'AATT' },
		{ enzyme: 'NdeI', position: 668, end: 674, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'TA' },
	],
	description: 'Expression backbone vector',
};

const fusionParts: Part[] = [
	{ name: 'Cbln1', type: 'CDS', start: 679, end: 1369, strand: 1, color: '#f97316' },
	{ name: 'mNeonGreen', type: 'CDS', start: 1369, end: 2085, strand: 1, color: '#e6c84c' },
	{ name: 'T7 pro', type: 'promoter', start: 1, end: 589, strand: 1, color: '#31a354' },
	{ name: 'AmpR', type: 'CDS', start: 2321, end: 3115, strand: 1, color: '#4dc3ff' },
	{ name: 'ColE1', type: 'rep_origin', start: 3534, end: 4122, strand: -1, color: '#9467bd' },
	{ name: 'rrnB T1', type: 'terminator', start: 2110, end: 2270, strand: 1, color: '#e377c2' },
];

const fusionCutSites: CutSite[] = [
	{ enzyme: 'XhoI', position: 2092, end: 2100, strand: 1, cutPosition: 2, complementCutPosition: 6 },
	{ enzyme: 'HindIII', position: 2103, end: 2109, strand: 1, cutPosition: 1, complementCutPosition: 5 },
];

export const cloningHistoryRoot: CloningNode = {
	id: 'gg-frag', name: 'pTK_Cbln1_BsaI_GG1', size: 4780, topology: 'linear',
	parts: [
		{ name: 'Cbln1', type: 'CDS', start: 640, end: 1330, strand: 1, color: '#f97316' },
		{ name: 'mNeonGreen', type: 'CDS', start: 1330, end: 2046, strand: 1, color: '#e6c84c' },
		{ name: 'AmpR', type: 'CDS', start: 2282, end: 3076, strand: 1, color: '#4dc3ff' },
	],
	description: 'GoldenGate-ready fragment (GG1 linker)',
	source: {
		action: { paradigm: 'pcr', label: 'Amplify GG1', primers: ['BsaI_GG1_fwd', 'BsaI_GG1_rev'], temperature: '98°C', notes: '30 cycles' },
		inputs: [{ label: '30 cycles, 98°C', node: {
			id: 'cbln1-ng-v1', name: 'Cbln1-mNG', size: 5510, topology: 'circular',
			parts: fusionParts, cutSites: fusionCutSites,
			description: 'Cbln1-mNeonGreen fusion',
			source: {
				action: { paradigm: 'gibson', label: 'Gibson', enzymes: ['EcoRI', 'NdeI'], temperature: '50°C', duration: '1 hr' },
				inputs: [
					{ label: 'EcoRI + HindIII linearized', node: pTK_Backbone },
					{ label: 'NdeI + EcoRI flanking', node: {
						id: 'cbln1-amplicon', name: 'Cbln1_amplicon', size: 780, topology: 'linear',
						parts: [{ name: 'Cbln1', type: 'CDS', start: 30, end: 720, strand: 1, color: '#f97316' }],
						description: 'PCR-amplified Cbln1 insert',
						source: {
							action: { paradigm: 'pcr', label: 'PCR', primers: ['Cbln1_fwd', 'Cbln1_rev'], temperature: '98°C', notes: 'RT-PCR' },
							inputs: [{ label: 'RT-PCR, 98°C', node: cblnRNA }],
						},
					} },
				],
			},
		} }],
	},
};
