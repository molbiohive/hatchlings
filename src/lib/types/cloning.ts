import type { Part, CutSite } from './sequence.js';

export type CloningParadigm =
	| 'restriction' | 'gibson' | 'infusion' | 'slic' | 'cpec'
	| 'golden-gate' | 'gateway' | 'cre-lox' | 'flp-frt'
	| 'crispr' | 'ligation' | 'pcr';

export type CreLoxOperation = 'excision' | 'inversion' | 'insertion' | 'translocation';

export interface AttSite {
	name: string;
	position?: number;
}

/** Details of a cloning operation (for tooltip) */
export interface CloningAction {
	paradigm: CloningParadigm;
	label?: string;
	enzymes?: string[];
	operation?: CreLoxOperation;
	attSites?: AttSite[];
	/** CRISPR: sgRNA guide sequence (20nt) */
	guide?: string;
	/** CRISPR: PAM motif (e.g. 'NGG' for SpCas9) */
	pam?: string;
	primers?: string[];
	temperature?: string;
	duration?: string;
	notes?: string;
}

/** One input to a cloning operation, with per-input display label */
export interface CloningSourceInput {
	node: CloningNode;
	label?: string;
}

/** How a CloningNode was produced: one operation with 1+ inputs */
export interface CloningSource {
	action: CloningAction;
	inputs: CloningSourceInput[];
	/** Secondary outputs (e.g. Gateway byproduct) */
	byproducts?: CloningNode[];
}

/**
 * A node in the cloning history tree.
 * Leaf nodes (no `source`) are starting materials.
 * The root is the final construct — all branches converge into it.
 */
export interface CloningNode {
	id: string;
	name: string;
	size: number;
	topology?: 'circular' | 'linear';
	/** Full nucleotide sequence (sense strand, 5'→3') */
	sequence?: string;
	parts?: Part[];
	cutSites?: CutSite[];
	description?: string;
	/** How this node was produced (absent for source materials) */
	source?: CloningSource;
}
