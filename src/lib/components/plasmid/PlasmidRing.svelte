<script lang="ts">
	import { generateTicks, bpToAngle, angleToXY } from '../../util/coordinates.js';

	interface Props {
		size: number;
		radius: number;
		cx: number;
		cy: number;
		showTicks?: boolean;
		axisWidth?: number;
		/** Current rotation of the map in degrees — used to counter-rotate tick labels */
		rotation?: number;
	}

	let { size, radius, cx, cy, showTicks = true, axisWidth = 12, rotation = 0 }: Props = $props();

	let ticks = $derived(generateTicks(size));

	let innerR = $derived(radius - axisWidth / 2);
	let outerR = $derived(radius + axisWidth / 2);

	const RAD_TO_DEG = 180 / Math.PI;
</script>

<g class="plasmid-ring">
	<!-- Inner backbone circle -->
	<circle
		{cx}
		{cy}
		r={innerR}
		fill="none"
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="1.5"
	/>
	<!-- Outer axis ring circle -->
	<circle
		{cx}
		{cy}
		r={outerR}
		fill="none"
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="1.5"
	/>

	<!-- Tick marks between inner and outer circles -->
	{#if showTicks}
		{#each ticks as tick}
			{@const angle = bpToAngle(tick.position, size)}
			{@const inner = angleToXY(angle, innerR, cx, cy)}
			{@const outer = angleToXY(angle, outerR, cx, cy)}
			<line
				x1={inner.x}
				y1={inner.y}
				x2={outer.x}
				y2={outer.y}
				stroke={tick.major ? 'var(--hatch-tick-major, #5a6a7a)' : 'var(--hatch-tick-minor, #3a4858)'}
				stroke-width={tick.major ? 1.5 : 0.75}
			/>
			{#if tick.major && tick.label}
				{@const labelR = outerR + 14}
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
	}
</style>
