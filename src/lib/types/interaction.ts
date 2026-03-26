/** Shared data model types for scatter, volcano, heatmap, flow cytometry etc. */

import type { Alphabet } from './sequence.js';

/** Volcano / scatter point */
export interface DataPoint {
	x: number;
	y: number;
	label?: string;
	significant?: boolean;
	color?: string;
	group?: string;
}

/** Thresholds for volcano / scatter plots */
export interface Thresholds {
	x?: number;
	y?: number;
	xNeg?: number;
}

/** Heatmap types */
export interface HeatmapData {
	rows: string[];
	cols: string[];
	values: number[][];
	colorScale?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'blues' | 'reds' | 'diverging';
	rowLabels?: string[];
	colLabels?: string[];
}

/** Sequence logo position */
export interface LogoPosition {
	[base: string]: number;
}

export interface SeqLogoData {
	positions: LogoPosition[];
	alphabet?: Alphabet;
}

/** Waterfall bar */
export interface WaterfallBar {
	label: string;
	value: number;
	category?: string;
	color?: string;
}

/** Distribution data */
export interface DistributionData {
	bins: { start: number; end: number; count: number }[];
	overlay?: { x: number[]; y: number[] };
	mode?: 'histogram' | 'density' | 'cumulative';
}

/** Gate for scatter / flow cytometry */
export interface Gate {
	name: string;
	type: 'rectangle' | 'polygon' | 'ellipse';
	/** For rectangle: [x1, y1, x2, y2]; polygon: [x1,y1, x2,y2, ...]; ellipse: [cx,cy,rx,ry] */
	coordinates: number[];
	color?: string;
}

/** Flow cytometry types */
export interface FlowData {
	events: number[][];
	axes: { name: string; index: number }[];
	gates?: Gate[];
}
