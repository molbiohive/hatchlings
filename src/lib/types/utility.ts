/** Types for utility visualization components */

// RestrictionMap
export interface RestrictionMapData {
	length: number;
	cutSites: import('./sequence.js').CutSite[];
	parts?: import('./sequence.js').Part[];
	name?: string;
}

// DiffViewer
export interface DiffViewerData {
	seqA: string;
	seqB: string;
	nameA?: string;
	nameB?: string;
	alphabet?: 'dna' | 'rna' | 'protein';
	partsA?: import('./sequence.js').Part[];
	partsB?: import('./sequence.js').Part[];
}

// InfoBox
export interface InfoItem {
	label: string;
	value: string | number;
	unit?: string;
	color?: string;
}

export interface HoverInfo {
	title: string;
	items: InfoItem[];
	position: { x: number; y: number };
}
