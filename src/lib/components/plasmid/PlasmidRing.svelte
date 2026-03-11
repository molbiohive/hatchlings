<script lang="ts">
	import { generateTicks, bpToAngle, angleToXY } from '../../util/coordinates.js';

	interface Props {
		size: number;
		radius: number;
		cx: number;
		cy: number;
		showTicks?: boolean;
		rotation?: number;
	}

	let { size, radius, cx, cy, showTicks = true, rotation = 0 }: Props = $props();

	let ticks = $derived(generateTicks(size));

	/** Scale band: ticks and labels sit between outer and inner circles */
	const BAND_WIDTH = 16;
	const TICK_LENGTH = 6;
	const RAD_TO_DEG = 180 / Math.PI;
</script>

<g class="plasmid-ring">
	<!-- Outer backbone circle -->
	<circle
		{cx}
		{cy}
		r={radius}
		fill="none"
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="1.5"
	/>
	<!-- Inner scale circle -->
	<circle
		{cx}
		{cy}
		r={radius - BAND_WIDTH}
		fill="none"
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="0.5"
		stroke-opacity="0.4"
	/>

	<!-- Tick marks and labels inside the scale band -->
	{#if showTicks}
		{#each ticks as tick}
			{@const angle = bpToAngle(tick.position, size)}
			{@const outer = angleToXY(angle, radius, cx, cy)}
			{@const inner = angleToXY(angle, radius - (tick.major ? TICK_LENGTH : TICK_LENGTH * 0.5), cx, cy)}
			<line
				x1={outer.x}
				y1={outer.y}
				x2={inner.x}
				y2={inner.y}
				stroke={tick.major ? 'var(--hatch-tick-major, #6a7a8a)' : 'var(--hatch-tick-minor, #4a5868)'}
				stroke-width={tick.major ? 1.5 : 0.75}
			/>
			{#if tick.major && tick.label}
				{@const labelR = radius - TICK_LENGTH - 4}
				{@const labelPt = angleToXY(angle, labelR, cx, cy)}
				{@const rotRad = (rotation * Math.PI) / 180}
				{@const inBottomHalf = Math.sin(angle + rotRad) > 0}
				{@const tangentDeg = angle * RAD_TO_DEG + 90 + (inBottomHalf ? 180 : 0)}
				<!-- Rotate label to follow circle path, flip in bottom half to stay readable -->
				<g transform="rotate({tangentDeg}, {labelPt.x}, {labelPt.y})">
					<text
						x={labelPt.x}
						y={labelPt.y}
						text-anchor="middle"
						dominant-baseline="central"
						class="tick-label"
					>
						{tick.label}
					</text>
				</g>
			{/if}
		{/each}
	{/if}
</g>

<style>
	.tick-label {
		font-size: 6px;
		fill: var(--hatch-axis-text, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
		user-select: none;
	}
</style>
