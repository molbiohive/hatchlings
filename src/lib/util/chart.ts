/** Shared chart utilities */

/** Compute min/max of a numeric array, optionally filtering for log scale */
export function dataRange(values: number[], log = false): { min: number; max: number } {
	const filtered = log ? values.filter(v => v > 0) : values;
	if (filtered.length === 0) return { min: 0, max: 1 };
	return { min: Math.min(...filtered), max: Math.max(...filtered) };
}

/** Find the index of the nearest value in a sorted-ish array (linear scan) */
export function findNearestIndex(arr: number[], target: number): number {
	let closest = 0;
	let minDist = Infinity;
	for (let i = 0; i < arr.length; i++) {
		const d = Math.abs(arr[i] - target);
		if (d < minDist) { minDist = d; closest = i; }
	}
	return closest;
}
