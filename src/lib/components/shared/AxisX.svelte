<script lang="ts">
	interface Props {
		/** Data min value */
		min: number;
		/** Data max value */
		max: number;
		/** Pixel width of the axis */
		width: number;
		/** Y position of the axis line */
		y: number;
		/** X offset (left margin) */
		x?: number;
		/** Axis label */
		label?: string;
		/** Number of ticks */
		ticks?: number;
		/** Log scale */
		log?: boolean;
		/** Format function for tick labels */
		formatTick?: (v: number) => string;
	}

	let {
		min, max, width, y, x = 0,
		label = '', ticks = 5, log = false,
		formatTick = defaultFormat,
	}: Props = $props();

	function defaultFormat(v: number): string {
		if (Math.abs(v) >= 1000) return v.toExponential(1);
		if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(1);
		return Number.isInteger(v) ? v.toString() : v.toPrecision(3);
	}

	function generateTickValues(): number[] {
		if (log) {
			const logMin = Math.floor(Math.log10(Math.max(min, 1e-10)));
			const logMax = Math.ceil(Math.log10(Math.max(max, 1e-10)));
			const vals: number[] = [];
			for (let i = logMin; i <= logMax; i++) {
				vals.push(Math.pow(10, i));
			}
			return vals;
		}
		const step = (max - min) / (ticks - 1);
		return Array.from({ length: ticks }, (_, i) => min + step * i);
	}

	function scaleX(val: number): number {
		if (log) {
			const logMin = Math.log10(Math.max(min, 1e-10));
			const logMax = Math.log10(Math.max(max, 1e-10));
			return x + ((Math.log10(Math.max(val, 1e-10)) - logMin) / (logMax - logMin)) * width;
		}
		return x + ((val - min) / (max - min)) * width;
	}

	const tickValues = $derived(generateTickValues());
</script>

<g class="hatch-axis-x">
	<!-- Axis line -->
	<line x1={x} y1={y} x2={x + width} y2={y} stroke="var(--hatch-axis-color, #666)" stroke-width="1" />

	<!-- Ticks -->
	{#each tickValues as val}
		{@const tx = scaleX(val)}
		<line x1={tx} y1={y} x2={tx} y2={y + 6} stroke="var(--hatch-axis-color, #666)" stroke-width="1" />
		<text
			x={tx}
			y={y + 18}
			text-anchor="middle"
			fill="var(--hatch-axis-text, #888)"
			font-size="10"
			font-family="var(--hatch-font-mono, monospace)"
		>{formatTick(val)}</text>
	{/each}

	<!-- Label -->
	{#if label}
		<text
			x={x + width / 2}
			y={y + 34}
			text-anchor="middle"
			fill="var(--hatch-axis-label, #aaa)"
			font-size="12"
			font-family="var(--hatch-font, sans-serif)"
		>{label}</text>
	{/if}
</g>
