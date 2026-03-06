<script lang="ts">
	import { generateTicks, bpToAngle, angleToXY } from '../../util/coordinates.js';

	interface Props {
		size: number;
		radius: number;
		cx: number;
		cy: number;
		showTicks?: boolean;
		/** Current rotation of the map in degrees — used to counter-rotate tick labels */
		rotation?: number;
	}

	let { size, radius, cx, cy, showTicks = true, rotation = 0 }: Props = $props();

	let ticks = $derived(generateTicks(size));

	const TICK_LENGTH = 6;
	const RAD_TO_DEG = 180 / Math.PI;
</script>

<g class="plasmid-ring">
	<!-- Single backbone circle -->
	<circle
		{cx}
		{cy}
		r={radius}
		fill="none"
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="1.5"
	/>

	<!-- Tick marks extending inward from ring -->
	{#if showTicks}
		{#each ticks as tick}
			{@const angle = bpToAngle(tick.position, size)}
			{@const outer = angleToXY(angle, radius, cx, cy)}
			{@const inner = angleToXY(angle, radius - TICK_LENGTH, cx, cy)}
			<line
				x1={outer.x}
				y1={outer.y}
				x2={inner.x}
				y2={inner.y}
				stroke={tick.major ? 'var(--hatch-tick-major, #5a6a7a)' : 'var(--hatch-tick-minor, #3a4858)'}
				stroke-width={tick.major ? 1.5 : 0.75}
			/>
			{#if tick.major && tick.label}
				{@const labelR = radius - 14}
				{@const labelPt = angleToXY(angle, labelR, cx, cy)}
				<!-- Counter-rotate to keep label upright regardless of map rotation -->
				<g transform="rotate({-rotation}, {labelPt.x}, {labelPt.y})">
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
		font-size: 8px;
		fill: var(--hatch-axis-text, #7a8898);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
		user-select: none;
	}
</style>
