<script lang="ts">
	interface Props {
		min: number;
		max: number;
		height: number;
		x: number;
		y?: number;
		label?: string;
		ticks?: number;
		formatTick?: (v: number) => string;
		side?: 'left' | 'right';
	}

	let {
		min, max, height, x, y = 0,
		label = '', ticks = 5,
		formatTick = defaultFormat,
		side = 'left',
	}: Props = $props();

	function defaultFormat(v: number): string {
		if (Math.abs(v) >= 1000) return v.toExponential(1);
		if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(1);
		return Number.isInteger(v) ? v.toString() : v.toPrecision(3);
	}

	function scaleY(val: number): number {
		return y + height - ((val - min) / (max - min)) * height;
	}

	const tickValues = $derived.by(() => {
		const step = (max - min) / (ticks - 1);
		return Array.from({ length: ticks }, (_, i) => min + step * i);
	});
</script>

<g class="hatch-axis-y">
	<!-- Axis line -->
	<line x1={x} y1={y} x2={x} y2={y + height} stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" />

	<!-- Ticks -->
	{#each tickValues as val}
		{@const ty = scaleY(val)}
		{#if side === 'left'}
			<line x1={x - 6} y1={ty} x2={x} y2={ty} stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" />
			<text
				x={x - 8}
				y={ty + 3}
				text-anchor="end"
				fill="var(--hatch-axis-text, #7a8898)"
				font-size="10"
				font-family="var(--hatch-font-mono, monospace)"
			>{formatTick(val)}</text>
		{:else}
			<line x1={x} y1={ty} x2={x + 6} y2={ty} stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" />
			<text
				x={x + 8}
				y={ty + 3}
				text-anchor="start"
				fill="var(--hatch-axis-text, #7a8898)"
				font-size="10"
				font-family="var(--hatch-font-mono, monospace)"
			>{formatTick(val)}</text>
		{/if}
	{/each}

	<!-- Label (rotated) -->
	{#if label}
		{@const lx = side === 'left' ? x - 40 : x + 40}
		<text
			x={lx}
			y={y + height / 2}
			text-anchor="middle"
			fill="var(--hatch-axis-label, #95a3b3)"
			font-size="12"
			font-family="var(--hatch-font, sans-serif)"
			transform="rotate(-90, {lx}, {y + height / 2})"
		>{label}</text>
	{/if}
</g>
