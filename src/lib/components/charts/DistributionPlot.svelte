<script lang="ts">
	import type { DistributionData } from '../../types/index.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		bins: { start: number; end: number; count: number }[];
		overlay?: { x: number[]; y: number[] };
		mode?: 'histogram' | 'density' | 'cumulative';
		width?: number;
		height?: number;
		xLabel?: string;
		yLabel?: string;
		color?: string;
	}

	let {
		bins,
		overlay,
		mode = 'histogram',
		width = 500,
		height = 300,
		xLabel = 'Value',
		yLabel = 'Count',
		color = '#1f77b4',
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const xRange = $derived.by(() => {
		return { min: Math.min(...bins.map(b => b.start)), max: Math.max(...bins.map(b => b.end)) };
	});

	const yRange = $derived.by(() => {
		if (mode === 'cumulative') {
			const total = bins.reduce((s, b) => s + b.count, 0);
			return { min: 0, max: total * 1.05 };
		}
		return { min: 0, max: Math.max(...bins.map(b => b.count)) * 1.1 };
	});

	function scaleX(val: number): number {
		const { min, max } = xRange;
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	const cumulativeBins = $derived.by(() => {
		let running = 0;
		return bins.map(b => {
			running += b.count;
			return { ...b, cumCount: running };
		});
	});
</script>

<div class="hatch-distribution" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		{#if mode === 'histogram' || mode === 'density'}
			{#each bins as bin}
				{@const bx = scaleX(bin.start)}
				{@const bw = scaleX(bin.end) - scaleX(bin.start)}
				{@const bh = scaleY(0) - scaleY(bin.count)}
				<rect
					x={bx}
					y={scaleY(bin.count)}
					width={Math.max(1, bw - 1)}
					height={Math.max(0, bh)}
					fill={color}
					opacity="0.7"
					onmouseenter={(e) => {
						tooltip = { visible: true, x: e.clientX, y: e.clientY, text: `[${bin.start.toFixed(1)}, ${bin.end.toFixed(1)}): ${bin.count}` };
					}}
					onmouseleave={() => tooltip.visible = false}
				/>
			{/each}
		{/if}

		{#if mode === 'cumulative'}
			{@const path = cumulativeBins.map((b, i) =>
				`${i === 0 ? 'M' : 'L'} ${scaleX(b.end)} ${scaleY(b.cumCount)}`
			).join(' ')}
			<path d={`M ${scaleX(cumulativeBins[0]?.start ?? 0)} ${scaleY(0)} ${path}`}
				fill="none" stroke={color} stroke-width="2" />
		{/if}

		{#if overlay}
			{@const oPath = overlay.x.map((xv, i) =>
				`${i === 0 ? 'M' : 'L'} ${scaleX(xv)} ${scaleY(overlay!.y[i])}`
			).join(' ')}
			<path d={oPath} fill="none" stroke="#ff7f00" stroke-width="1.5" stroke-dasharray="4 2" />
		{/if}

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top}
			label={mode === 'cumulative' ? 'Cumulative Count' : yLabel} />
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-distribution {
		display: inline-block;
	}
</style>
