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

// Golden Gate (BsaI, 3 parts)
const ggPart1: CloningNode = {
	id: 'gg-p1', name: 'Part1 (Pro)', size: 520, topology: 'linear',
	parts: [{ name: 'T7 pro', type: 'promoter', start: 20, end: 500, strand: 1, color: '#31a354' }],
	cutSites: [
		{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'AATG' },
		{ enzyme: 'BsaI', position: 513, end: 520, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'TTCG' },
	],
};
const ggPart2: CloningNode = {
	id: 'gg-p2', name: 'Part2 (CDS)', size: 840, topology: 'linear',
	parts: [{ name: 'sfGFP', type: 'CDS', start: 20, end: 820, strand: 1, color: '#22c55e' }],
	cutSites: [
		{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'TTCG' },
		{ enzyme: 'BsaI', position: 833, end: 840, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'GCAA' },
	],
};
const ggPart3: CloningNode = {
	id: 'gg-p3', name: 'Part3 (Ter)', size: 280, topology: 'linear',
	parts: [{ name: 'rrnB T1', type: 'terminator', start: 20, end: 260, strand: 1, color: '#e377c2' }],
	cutSites: [
		{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'GCAA' },
		{ enzyme: 'BsaI', position: 273, end: 280, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'AATG' },
	],
};

export const goldenGateResult: CloningNode = {
	id: 'gg-res', name: 'pGG-T7sfGFP', size: 4200, topology: 'circular',
	sequence: randSeq(4200, 42),
	source: {
		action: { paradigm: 'golden-gate', label: 'Golden Gate (BsaI)', enzymes: ['BsaI'], temperature: '37°C/16°C', notes: '30 cycles' },
		inputs: [
			{ label: 'BsaI flanked', node: ggPart1 },
			{ label: 'BsaI flanked', node: ggPart2 },
			{ label: 'BsaI flanked', node: ggPart3 },
		],
	},
};

// Cre-loxP Excision
const LOXP_FWD = 'ATAACTTCGTATAATGTATGCTATACGAAGTTAT';
const floxedLocus: CloningNode = {
	id: 'cre-in', name: 'Floxed locus', size: 8000, topology: 'linear',
	sequence: randSeq(2400, 44) + LOXP_FWD + randSeq(1200, 45) + LOXP_FWD + randSeq(3332, 46),
};

export const creLoxExcisionResult: CloningNode = {
	id: 'cre-exc-res', name: 'KO locus', size: 6600, topology: 'linear',
	sequence: randSeq(6600, 66),
	source: {
		action: { paradigm: 'cre-lox', label: 'Cre recombinase', operation: 'excision', notes: 'same-orientation loxP sites' },
		inputs: [{ label: '+ Cre recombinase', node: floxedLocus }],
		byproducts: [{
			id: 'cre-ex', name: 'Excised circle', size: 1400, topology: 'circular',
			sequence: randSeq(1400, 14),
		}],
	},
};

// Gateway LR
const gwEntry: CloningNode = {
	id: 'gw-entry', name: 'pENTR-GOI', size: 3800, topology: 'circular',
	sequence: randSeq(3800, 38),
};
const gwDest: CloningNode = {
	id: 'gw-dest', name: 'pDEST-AmpR', size: 5600, topology: 'circular',
	sequence: randSeq(5600, 56),
};

export const gatewayResult: CloningNode = {
	id: 'gw-res', name: 'pEXP-GOI', size: 6200, topology: 'circular',
	sequence: randSeq(6200, 62),
	source: {
		action: {
			paradigm: 'gateway', label: 'LR Clonase II', temperature: '25°C',
			attSites: [{ name: 'attL1' }, { name: 'attL2' }, { name: 'attR1' }, { name: 'attR2' }],
			notes: 'attL x attR -> attB + attP',
		},
		inputs: [
			{ label: 'Entry clone (attL)', node: gwEntry },
			{ label: 'Dest vector (attR)', node: gwDest },
		],
		byproducts: [{
			id: 'gw-bp', name: 'Byproduct', size: 2400, topology: 'circular',
			sequence: randSeq(2400, 24),
			description: 'ccdB counter-selected',
		}],
	},
};

// CRISPR-Cas9 HDR
const genomicLocus: CloningNode = {
	id: 'cr-locus', name: 'Rosa26 locus', size: 12000, topology: 'linear',
	sequence: randSeq(12000, 120),
};
const donorTemplate: CloningNode = {
	id: 'cr-donor', name: 'HDR donor', size: 2400, topology: 'linear',
	sequence: randSeq(2400, 77),
};

export const crisprResult: CloningNode = {
	id: 'cr-res', name: 'Rosa26::GFP', size: 13200, topology: 'linear',
	sequence: randSeq(13200, 132),
	source: {
		action: {
			paradigm: 'crispr', label: 'CRISPR-Cas9 HDR',
			guide: 'ATGCGATCGTACGATCGATC',
			pam: 'AGG',
			notes: 'sgRNA + Cas9 RNP + HDR donor',
		},
		inputs: [
			{ label: 'Cas9 + sgRNA (DSB)', node: genomicLocus },
			{ label: 'HDR donor (800bp arms)', node: donorTemplate },
		],
	},
};

// All strategies for the demo page
export const allStrategies = [
	{ title: 'Restriction / Ligation', sub: 'EcoRI + BamHI directional cloning', node: restrictionLigationResult },
	{ title: 'Gibson Assembly', sub: '30bp homology overlaps, 50°C isothermal', node: gibsonResult },
	{ title: 'Golden Gate (BsaI)', sub: 'Type IIS: 4nt overhang codes AATG->TTCG->GCAA->AATG', node: goldenGateResult },
	{ title: 'Cre-loxP Excision', sub: 'Same-orientation loxP sites, floxed region excised', node: creLoxExcisionResult },
	{ title: 'Gateway LR', sub: 'attL x attR recombination (LR Clonase II)', node: gatewayResult },
	{ title: 'CRISPR-Cas9 HDR', sub: 'sgRNA-guided DSB + homology-directed repair', node: crisprResult },
];

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
