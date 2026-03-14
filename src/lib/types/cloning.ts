import type { Part, CutSite } from './sequence.js';

/** Details of a cloning operation (for tooltip) */
export interface CloningAction {
	type: string;
	label?: string;
	primers?: string[];
	enzymes?: string[];
	temperature?: string;
	duration?: string;
	notes?: string;
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
	parts?: Part[];
	cutSites?: CutSite[];
	description?: string;
	/** How this node was produced (absent for source materials) */
	source?: CloningSource;
}
