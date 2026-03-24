/** Types for multiple sequence alignment visualization */

import type { Alphabet } from './sequence.js';

export interface AlignmentSequence {
	id: string;
	name: string;
	sequence: string;
	group?: string;
}

export interface ConservationScore {
	position: number;
	score: number;
	consensus: string;
}

export interface AlignmentAnnotation {
	start: number;
	end: number;
	label: string;
	color?: string;
}

export interface AlignmentData {
	sequences: AlignmentSequence[];
	alphabet?: Alphabet;
	conservation?: ConservationScore[];
	annotations?: AlignmentAnnotation[];
	name?: string;
}
