/** Microplate types for PlateHeatmap */

export type PlateFormat = 6 | 12 | 24 | 48 | 96 | 384 | 1536;

export interface Well {
	/** Well ID like "A1", "B12" */
	id: string;
	/** Numeric value for heatmap coloring */
	value: number;
	/** Display label */
	label?: string;
	/** Group for legend/coloring (e.g. "positive", "negative", "sample") */
	group?: string;
	/** Row index (0-based) */
	row?: number;
	/** Column index (0-based) */
	col?: number;
}

export interface PlateData {
	format: PlateFormat;
	wells: Well[];
	/** Z-factor for assay quality */
	zFactor?: number;
	/** Optional title */
	title?: string;
}
