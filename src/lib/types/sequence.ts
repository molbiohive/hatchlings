/** Sequence and annotation types for PlasmidViewer and SequenceViewer */

export interface Part {
	id?: string;
	name: string;
	type: string;
	start: number;
	end: number;
	strand: 1 | -1;
	color?: string;
	label?: string;
	note?: string;
	tm?: number;
	sequence?: string;
	/** Start of binding region (for primers with overhangs) */
	bindingStart?: number;
	/** End of binding region (for primers with overhangs) */
	bindingEnd?: number;
	/** Positions of mismatched bases (absolute bp positions) */
	mismatches?: number[];
}

export interface CutSite {
	id?: string;
	enzyme: string;
	position: number;
	/** End of the recognition site (position + recognition length) */
	end?: number;
	strand: 1 | -1;
	overhang?: string;
	cutPosition?: number;
	complementCutPosition?: number;
	/** Recognition site sequence (e.g., 'GAATTC' for EcoRI). If provided, used for cut-site rendering. */
	recognitionSeq?: string;
	/** Sense strand cut offset within recognition site (0-indexed, e.g., 1 for EcoRI G^AATTC) */
	senseCutOffset?: number;
	/** Complement strand cut offset within recognition site (0-indexed from sense 5' end, e.g., 5 for EcoRI) */
	complementCutOffset?: number;
}

export interface ORF {
	id?: string;
	start: number;
	end: number;
	strand: 1 | -1;
	frame: 0 | 1 | 2;
	length: number;
	aminoAcids?: string;
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
	parts: Part[];
	cutSites: CutSite[];
}

export interface SequenceData {
	seq: string;
	parts: Part[];
	cutSites: CutSite[];
	translations: Translation[];
	alphabet?: 'dna' | 'rna' | 'protein';
}
