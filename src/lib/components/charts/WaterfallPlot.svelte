<script lang="ts">
	import type { WaterfallBar } from '../../types/index.js';
	import { categoricalColors } from '../../util/colors.js';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		bars: WaterfallBar[];
		width?: number;
		height?: number;
		xLabel?: string;
		yLabel?: string;
		sortDescending?: boolean;
	}

	let {
		bars,
		width = 500,
		height = 350,
		xLabel = '',
		yLabel = 'Value',
		sortDescending = true,
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 60, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const sortedBars = $derived.by(() => {
		if (!sortDescending) return bars;
		return [...bars].sort((a, b) => b.value - a.value);
	});

	const yRange = $derived.by(() => {
		const vals = bars.map(b => b.value);
		const min = Math.min(0, Math.min(...vals));
		const max = Math.max(0, Math.max(...vals));
		return { min: min * 1.1, max: max * 1.1 };
	});

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	const barWidth = $derived(Math.max(2, plotW / Math.max(sortedBars.length, 1) - 2));

	function barColor(bar: WaterfallBar, idx: number): string {
		if (bar.color) return bar.color;
		if (bar.value > 0) return 'var(--hatch-positive, #4daf4a)';
		return 'var(--hatch-negative, #e41a1c)';
	}
</script>

<div class="hatch-waterfall" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		<!-- Zero line -->
		<line x1={margin.left} y1={scaleY(0)} x2={margin.left + plotW} y2={scaleY(0)}
			stroke="var(--hatch-axis-color, #666)" stroke-width="1" />

		<!-- Bars -->
		{#each sortedBars as bar, idx}
			{@const bx = margin.left + idx * (plotW / sortedBars.length) + 1}
			{@const by = bar.value >= 0 ? scaleY(bar.value) : scaleY(0)}
			{@const bh = Math.abs(scaleY(bar.value) - scaleY(0))}
			<rect
				x={bx}
				y={by}
				width={barWidth}
				height={Math.max(1, bh)}
				fill={barColor(bar, idx)}
				opacity="0.85"
				rx="1"
				onmouseenter={(e) => {
					tooltip = { visible: true, x: e.clientX, y: e.clientY, text: `${bar.label}: ${bar.value.toFixed(2)}` };
				}}
				onmouseleave={() => tooltip.visible = false}
				style="cursor: pointer"
			/>
		{/each}

		<!-- X labels (rotated) -->
		{#each sortedBars as bar, idx}
			{@const bx = margin.left + idx * (plotW / sortedBars.length) + barWidth / 2 + 1}
			{#if sortedBars.length <= 50}
				<text
					x={bx} y={margin.top + plotH + 8}
					text-anchor="end"
					fill="var(--hatch-axis-text, #888)" font-size="8"
					transform="rotate(-45, {bx}, {margin.top + plotH + 8})"
				>{bar.label}</text>
			{/if}
		{/each}

		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-waterfall {
		display: inline-block;
	}
</style>
