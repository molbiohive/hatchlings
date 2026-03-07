/** Sanger sequencing trace types for TraceViewer */

export interface TraceChannel {
	A: number[];
	C: number[];
	G: number[];
	T: number[];
}

export interface TraceMismatch {
	pos: number;
	type: 'substitution' | 'insertion' | 'deletion';
	refBase?: string;
	queryBase?: string;
}

export interface TraceAlignment {
	refSeq: string;
	querySeq: string;
	mismatches: TraceMismatch[];
	identity?: number;
}

export interface TraceData {
	/** Optional lane label (e.g. "Forward", "Reverse") */
	label?: string;
	baseCalls: string;
	qualityScores: number[];
	channels: TraceChannel;
	peakPositions: number[];
	alignment?: TraceAlignment;
	/** Per-trace quality trim threshold override */
	trimQuality?: number;
}
