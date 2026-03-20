import type { Part, CutSite } from './sequence.js';

/** End configuration for a construct in a CloningStepViewer */
export interface ClosedEnd { type: 'closed' }
export interface BluntEnd { type: 'blunt' }
export interface StickyEnd {
	type: 'sticky';
	enzyme?: string;
	overhang?: string;
	direction: '5prime' | '3prime';
}

export interface HomologyEnd {
	type: 'homology';
	length?: number;
	label?: string;
	color?: string;
}

/** Recombination site end (loxP, att sites, FRT) */
export interface RecombinationEnd {
	type: 'recombination';
	site: string;
	direction: 'forward' | 'reverse';
	color?: string;
}

/** Type IIS restriction end (BsaI, BpiI — recognition site offset from cut) */
export interface TypeIISEnd {
	type: 'type-iis';
	enzyme: string;
	overhang: string;
	direction: '5prime' | '3prime';
}

/** Double-strand break (CRISPR Cas9) */
export interface DSBEnd {
	type: 'dsb';
	guide?: string;
	pam?: string;
}

export type FragmentEnd = ClosedEnd | BluntEnd | StickyEnd | HomologyEnd
	| RecombinationEnd | TypeIISEnd | DSBEnd;

/** Details of a cloning operation (for tooltip) */
export interface CloningAction {
	type: string;
	label?: string;
	/** Operation subtype for paradigms with variants (e.g. 'excision', 'inversion', 'insertion', 'translocation') */
	subtype?: string;
	primers?: string[];
	enzymes?: string[];
	temperature?: string;
	duration?: string;
	notes?: string;
	/** CRISPR: sgRNA guide sequence (20nt) */
	guide?: string;
	/** CRISPR: PAM motif (e.g. 'NGG' for SpCas9) */
	pam?: string;
}

/** One input to a cloning operation, with per-input conditions text */
export interface CloningSourceInput {
	node: CloningNode;
	/** Display text for this input's treatment (e.g. "BglII+BamHI", "RT-PCR, 98°C") */
	conditions?: string;
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
