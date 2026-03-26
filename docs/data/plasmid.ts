import type { PlasmidData, SequenceData, DiffData, Part, CutSite, Translation } from '../../src/lib/types/index.js';

// Deterministic pseudo-random sequence generator
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

const pUC19seq = randSeq(2686, 19);

const COMP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const MUTATE: Record<string, string> = { A: 'G', T: 'C', G: 'A', C: 'T' };

function buildPrimerSeq(
	tpl: string, start: number, end: number, strand: 1 | -1,
	overhang5?: string, mismatchPositions?: number[],
): string {
	let binding = '';
	if (strand === 1) {
		for (let i = start; i < end; i++) {
			const base = tpl[i]?.toUpperCase() ?? 'N';
			binding += mismatchPositions?.includes(i) ? (MUTATE[base] ?? base) : base;
		}
	} else {
		for (let i = end - 1; i >= start; i--) {
			const base = COMP[tpl[i]?.toUpperCase() ?? 'N'] ?? 'N';
			binding += mismatchPositions?.includes(i) ? (MUTATE[base] ?? base) : base;
		}
	}
	return (overhang5 ?? '') + binding;
}

const plasmidParts: Part[] = [
	{ name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
	{ name: 'AmpR promoter', type: 'promoter', start: 2490, end: 2594, strand: 1, color: '#31a354' },
	{ name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
	{ name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
	{ name: 'MCS', type: 'misc_feature', start: 396, end: 452, strand: 1, color: '#d4915e' },
	{ name: 'lac promoter', type: 'promoter', start: 168, end: 198, strand: 1, color: '#31a354' },
	{ name: 'M13 fwd', type: 'primer_bind', start: 361, end: 378, strand: 1, tm: 56.2,
		sequence: buildPrimerSeq(pUC19seq, 361, 378, 1, undefined, [370]) },
	{ name: 'M13 rev', type: 'primer_bind', start: 488, end: 505, strand: -1, tm: 55.8,
		sequence: buildPrimerSeq(pUC19seq, 488, 505, -1) },
	{ name: 'Gibson fwd', type: 'primer_bind', start: 340, end: 395, strand: 1, tm: 62.1,
		sequence: buildPrimerSeq(pUC19seq, 361, 395, 1, 'AATTCGGTACCGGATCCATCG', [375, 388]) },
	{ name: 'Gibson rev', type: 'primer_bind', start: 450, end: 526, strand: -1, tm: 63.4,
		sequence: buildPrimerSeq(pUC19seq, 450, 505, -1, 'GCTAGCAATTCCCGGATCCAT', [465, 498]) },
	{ name: 'CAP site', type: 'protein_bind', start: 145, end: 166, strand: 1, color: '#e377c2' },
	{ name: 'f1 ori', type: 'rep_origin', start: 2574, end: 2686, strand: 1, color: '#8c564b' },
];

const plasmidCutSites: CutSite[] = [
	{ enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5 },
	{ enzyme: 'SacI', position: 402, end: 408, strand: 1, cutPosition: 5, complementCutPosition: 1 },
	{ enzyme: 'KpnI', position: 408, end: 414, strand: 1, cutPosition: 5, complementCutPosition: 1 },
	{ enzyme: 'BamHI', position: 417, end: 423, strand: 1, cutPosition: 1, complementCutPosition: 5 },
	{ enzyme: 'XbaI', position: 423, end: 429, strand: 1, cutPosition: 1, complementCutPosition: 5 },
	{ enzyme: 'SalI', position: 429, end: 435, strand: 1, cutPosition: 1, complementCutPosition: 5 },
	{ enzyme: 'PstI', position: 439, end: 445, strand: 1, cutPosition: 5, complementCutPosition: 1 },
	{ enzyme: 'SphI', position: 445, end: 451, strand: 1, cutPosition: 5, complementCutPosition: 1 },
	{ enzyme: 'HindIII', position: 447, end: 453, strand: 1, cutPosition: 1, complementCutPosition: 5 },
	{ enzyme: 'NdeI', position: 183, end: 189, strand: 1, cutPosition: 2, complementCutPosition: 4 },
	{ enzyme: 'ScaI', position: 2177, end: 2183, strand: 1, cutPosition: 3, complementCutPosition: 3 },
];

export const puc19: PlasmidData = {
	name: 'pUC19',
	size: 2686,
	topology: 'circular',
	seq: pUC19seq,
	parts: plasmidParts,
	cutSites: plasmidCutSites,
};

// Codon table for translation
const codonTable: Record<string, string> = {
	TTT:'F',TTC:'F',TTA:'L',TTG:'L',CTT:'L',CTC:'L',CTA:'L',CTG:'L',
	ATT:'I',ATC:'I',ATA:'I',ATG:'M',GTT:'V',GTC:'V',GTA:'V',GTG:'V',
	TCT:'S',TCC:'S',TCA:'S',TCG:'S',CCT:'P',CCC:'P',CCA:'P',CCG:'P',
	ACT:'T',ACC:'T',ACA:'T',ACG:'T',GCT:'A',GCC:'A',GCA:'A',GCG:'A',
	TAT:'Y',TAC:'Y',TAA:'*',TAG:'*',CAT:'H',CAC:'H',CAA:'Q',CAG:'Q',
	AAT:'N',AAC:'N',AAA:'K',AAG:'K',GAT:'D',GAC:'D',GAA:'E',GAG:'E',
	TGT:'C',TGC:'C',TGA:'*',TGG:'W',CGT:'R',CGC:'R',CGA:'R',CGG:'R',
	AGT:'S',AGC:'S',AGA:'R',AGG:'R',GGT:'G',GGC:'G',GGA:'G',GGG:'G',
};
function trDNA(dna: string): string {
	let p = '';
	for (let i = 0; i + 2 < dna.length; i += 3) p += codonTable[dna.slice(i, i + 3).toUpperCase()] ?? '?';
	return p;
}

const seqTranslations: Translation[] = [
	{ start: 2533, end: 2686, strand: 1, aminoAcids: trDNA(pUC19seq.slice(2533, 2686)), frame: 0 },
];

export const sequenceData: SequenceData = {
	seq: pUC19seq,
	parts: plasmidParts,
	cutSites: plasmidCutSites,
	translations: seqTranslations,
	topology: 'circular',
};

export const diffData: DiffData = {
	seqA: 'ATGCGATCGATCGATCGATCGATCGATCGATCGATCG',
	seqB: 'ATGCGATTGATCAATCGATC---GATCGATCAATCGATCGATCG',
	nameA: 'Wild type',
	nameB: 'Mutant',
	featuresA: [
		{ name: 'CDS', type: 'CDS', start: 0, end: 36, strand: 1, color: '#4dc3ff' },
	],
	featuresB: [
		{ name: 'CDS', type: 'CDS', start: 0, end: 18, strand: 1, color: '#4dc3ff' },
		{ name: 'Insert', type: 'misc_feature', start: 18, end: 25, strand: 1, color: '#58b56a' },
		{ name: 'CDS-2', type: 'CDS', start: 25, end: 44, strand: 1, color: '#4dc3ff' },
	],
};
