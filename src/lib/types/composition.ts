/** Types for sequence composition visualization */

import type { Alphabet } from './sequence.js';

export interface CompositionData {
	counts: Record<string, number>;
	alphabet?: Alphabet;
	gc?: number;
	length?: number;
	name?: string;
}
