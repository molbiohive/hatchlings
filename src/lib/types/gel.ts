/** Gel electrophoresis types for GelViewer */

export interface GelBand {
	/** Normalized position 0.0 (well) to 1.0 (bottom) — pre-computed by backend */
	position: number;
	/** Relative intensity 0.0-1.0 */
	intensity: number;
	/** Fragment size in bp or kDa */
	size: number;
	/** Optional band name/label */
	name?: string;
}

export interface GelLane {
	label: string;
	bands: GelBand[];
	/** If true, rendered as a molecular weight ladder */
	isLadder?: boolean;
}

export type GelType = 'agarose' | 'sds-page' | 'native-page';
export type StainType = 'ethidium' | 'sybr-safe' | 'sybr-gold' | 'coomassie' | 'silver';

export interface GelConfig {
	gelType: GelType;
	stain: StainType;
	percentage?: number;
}

export interface GelData {
	lanes: GelLane[];
	gelType: GelType;
	stain: StainType;
	gelPercent?: number;
}
