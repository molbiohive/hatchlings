/** Binding kinetics types for SPR/BLI viewers */

export interface KineticsCurve {
	name: string;
	concentration?: number;
	x: number[];
	y: number[];
}

export interface KineticsFit {
	x: number[];
	y: number[];
	residuals?: number[];
}

export interface KineticsStep {
	name: string;
	start: number;
	end: number;
	type: 'association' | 'dissociation' | 'baseline' | 'regeneration';
}

export interface BindingParams {
	ka: number;
	kd: number;
	KD: number;
	chi2?: number;
	rMax?: number;
}

export interface KineticsData {
	curves: KineticsCurve[];
	fit?: KineticsFit[];
	steps: KineticsStep[];
	params?: BindingParams;
}

/** ITC types */

export interface ITCThermogram {
	time: number[];
	power: number[];
}

export interface ITCIsotherm {
	ratio: number[];
	heat: number[];
	fit?: { x: number[]; y: number[] };
}

export interface ITCParams {
	N: number;
	Ka: number;
	deltaH: number;
	deltaS?: number;
	Kd?: number;
}

export interface ITCData {
	rawThermogram: ITCThermogram;
	isotherm: ITCIsotherm;
	params?: ITCParams;
}

/** Melting curve / DSF types */

export interface MeltingCurveData {
	curves: {
		name: string;
		temp: number[];
		ratio: number[];
		derivative: number[];
		tm?: number;
	}[];
}

/** Dose-response types */

export interface DoseResponseFit {
	line: { x: number; y: number }[];
	params: {
		top: number;
		bottom: number;
		ic50: number;
		hillSlope: number;
	};
	r2: number;
	ci95?: { ic50: [number, number] };
}

export interface DoseResponseCurveData {
	label: string;
	color?: string;
	points: { x: number; y: number }[];
	fit?: DoseResponseFit;
}

export interface DoseResponseData {
	curves: DoseResponseCurveData[];
	xLabel?: string;
	yLabel?: string;
}
