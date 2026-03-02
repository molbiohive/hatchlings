<script lang="ts">
	import { generateTicks, bpToXY } from '../../util/coordinates.js';

	interface Props {
		size: number;
		radius: number;
		cx: number;
		cy: number;
		showTicks?: boolean;
	}

	let { size, radius, cx, cy, showTicks = true }: Props = $props();

	let ticks = $derived(generateTicks(size));
</script>

<g class="plasmid-ring">
	<!-- Backbone circle -->
	<circle
		{cx}
		{cy}
		r={radius}
		fill="none"
		stroke="var(--hatch-ring-color, #555)"
		stroke-width="2"
	/>

	<!-- Tick marks -->
	{#if showTicks}
		{#each ticks as tick}
			{@const inner = bpToXY(tick.position, size, radius - (tick.major ? 8 : 4), cx, cy)}
			{@const outer = bpToXY(tick.position, size, radius + (tick.major ? 8 : 4), cx, cy)}
			<line
				x1={inner.x}
				y1={inner.y}
				x2={outer.x}
				y2={outer.y}
				stroke={tick.major ? 'var(--hatch-tick-major, #777)' : 'var(--hatch-tick-minor, #444)'}
				stroke-width={tick.major ? 1.5 : 0.75}
			/>
			{#if tick.major && tick.label}
				{@const labelPt = bpToXY(tick.position, size, radius + 20, cx, cy)}
				<text
					x={labelPt.x}
					y={labelPt.y}
					text-anchor="middle"
					dominant-baseline="central"
					class="tick-label"
				>
					{tick.label}
				</text>
			{/if}
		{/each}
	{/if}
</g>

<style>
	.tick-label {
		font-size: 9px;
		fill: var(--hatch-axis-text, #888);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
	}
</style>
