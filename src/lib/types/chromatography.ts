/** Chromatography types for FPLC/HPLC/SEC viewers */

export interface ChromTrace {
	name: string;
	x: number[];
	y: number[];
	yAxis?: 'left' | 'right';
	color?: string;
	unit?: string;
}

export interface ChromPeak {
	start: number;
	end: number;
	apex: number;
	height: number;
	area?: number;
	label?: string;
}

export interface ChromFraction {
	name: string;
	start: number;
	end: number;
	color?: string;
}

export interface ChromData {
	traces: ChromTrace[];
	peaks?: ChromPeak[];
	fractions?: ChromFraction[];
	xLabel?: string;
}

/** Spectrum types (UV/CD/MS) */

export interface SpectrumPeak {
	x: number;
	y: number;
	label?: string;
}

export interface SpectrumData {
	x: number[];
	y: number[];
	peaks?: SpectrumPeak[];
	xLabel: string;
	yLabel: string;
	title?: string;
}

/** Electropherogram types (Bioanalyzer/TapeStation) */

export interface ElectropherogramPeak {
	x: number;
	height: number;
	area?: number;
	size?: number;
	label?: string;
}

export interface ElectropherogramData {
	x: number[];
	y: number[];
	peaks: ElectropherogramPeak[];
	ladder?: { x: number; size: number }[];
	virtualGel?: GelBandSimple[];
	xLabel?: string;
	yLabel?: string;
}

interface GelBandSimple {
	position: number;
	intensity: number;
	size?: number;
}

/** Time series types */

export interface TimeSeriesLine {
	name: string;
	x: number[];
	y: number[];
	unit?: string;
	yAxis?: 'left' | 'right';
	color?: string;
}

export interface TimeSeriesEvent {
	time: number;
	label: string;
	color?: string;
}

export interface TimeSeriesData {
	series: TimeSeriesLine[];
	events?: TimeSeriesEvent[];
	xLabel?: string;
}
