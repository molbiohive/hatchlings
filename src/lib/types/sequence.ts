/** Sequence and annotation types for PlasmidViewer and SequenceViewer */

export interface Feature {
	name: string;
	type: FeatureType;
	start: number;
	end: number;
	strand: 1 | -1;
	color?: string;
	label?: string;
	note?: string;
}

export type FeatureType =
	| 'CDS'
	| 'promoter'
	| 'terminator'
	| 'rep_origin'
	| 'misc_feature'
	| 'regulatory'
	| 'gene'
	| 'primer_bind'
	| 'protein_bind'
	| 'RBS'
	| 'sig_peptide'
	| 'transit_peptide'
	| 'mat_peptide'
	| 'misc_binding'
	| 'enhancer'
	| 'intron'
	| 'exon'
	| 'polyA_signal'
	| '3\'UTR'
	| '5\'UTR'
	| string;

export interface Primer {
	name: string;
	start: number;
	end: number;
	strand: 1 | -1;
	tm?: number;
	sequence?: string;
	color?: string;
}

export interface CutSite {
	enzyme: string;
	position: number;
	strand: 1 | -1;
	overhang?: string;
	cutPosition?: number;
	complementCutPosition?: number;
}

export interface Translation {
	start: number;
	end: number;
	strand: 1 | -1;
	aminoAcids: string;
	frame?: 0 | 1 | 2;
}

export interface PlasmidData {
	name: string;
	size: number;
	topology: 'circular' | 'linear';
	seq?: string;
	features: Feature[];
	primers: Primer[];
	cutSites: CutSite[];
}

export interface SequenceData {
	seq: string;
	features: Feature[];
	primers: Primer[];
	cutSites: CutSite[];
	translations: Translation[];
}
