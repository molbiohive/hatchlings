/** Types for sequence composition visualization */

export interface CompositionData {
	counts: Record<string, number>;
	alphabet?: 'dna' | 'rna' | 'protein';
	gc?: number;
	length?: number;
	name?: string;
}
