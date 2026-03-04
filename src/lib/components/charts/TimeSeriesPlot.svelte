<script lang="ts">
	import type { TimeSeriesLine, TimeSeriesEvent } from '../../types/index.js';
	import type { HoverInfo, InfoItem } from '../../types/utility.js';
	import { categoricalColors } from '../../util/colors.js';
	import { hover } from '../../util/hover.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		series: TimeSeriesLine[];
		events?: TimeSeriesEvent[];
		xLabel?: string;
		width?: number;
		height?: number;
		showPoints?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		series,
		events = [],
		xLabel = 'Time',
		width = 600,
		height = 350,
		showPoints = false,
		onhoverinfo,
	}: Props = $props();

	const margin = { top: 20, right: 60, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	const xRange = $derived.by(() => {
		const allX = series.flatMap(s => s.x);
		return { min: Math.min(...allX), max: Math.max(...allX) };
	});

	function yRangeFor(side: 'left' | 'right') {
		const relevant = series.filter(s => (s.yAxis ?? 'left') === side);
		if (relevant.length === 0) return { min: 0, max: 1 };
		const allY = relevant.flatMap(s => s.y);
		return { min: Math.min(0, Math.min(...allY)), max: Math.max(...allY) * 1.1 };
	}

	const yRangeLeft = $derived(yRangeFor('left'));
	const yRangeRight = $derived(yRangeFor('right'));

	function scaleX(val: number): number {
		const { min, max } = xRange;
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleY(val: number, side: 'left' | 'right' = 'left'): number {
		const range = side === 'left' ? yRangeLeft : yRangeRight;
		return margin.top + plotH - ((val - range.min) / (range.max - range.min)) * plotH;
	}

	function linePath(s: TimeSeriesLine): string {
		const side = s.yAxis ?? 'left';
		return s.x.map((xv, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(xv)} ${scaleY(s.y[i], side)}`
		).join(' ');
	}

	function lineColor(s: TimeSeriesLine, idx: number): string {
		return s.color ?? categoricalColors[idx % categoricalColors.length];
	}

	function handleMouseMove(e: MouseEvent) {
		if (!onhoverinfo) return;
		const svg = (e.currentTarget as SVGElement).closest('svg');
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		if (mx < margin.left || mx > margin.left + plotW) { onhoverinfo(null); return; }
		const xVal = xRange.min + ((mx - margin.left) / plotW) * (xRange.max - xRange.min);
		const items: InfoItem[] = [];
		for (let si = 0; si < series.length; si++) {
			const s = series[si];
			let closest = 0;
			let minDist = Infinity;
			for (let i = 0; i < s.x.length; i++) {
				const d = Math.abs(s.x[i] - xVal);
				if (d < minDist) { minDist = d; closest = i; }
			}
			items.push({ label: s.name, value: s.y[closest].toFixed(2), unit: s.unit, color: lineColor(s, si) });
		}
		onhoverinfo({ title: `${xLabel}: ${xVal.toFixed(1)}`, items, position: { x: e.clientX, y: e.clientY } });
	}
</script>

<div class="hatch-time-series" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Grid lines -->
		{#each Array.from({length: 5}, (_, i) => i) as i}
			{@const yVal = yRangeLeft.min + (i / 4) * (yRangeLeft.max - yRangeLeft.min)}
			<line x1={margin.left} y1={scaleY(yVal)} x2={margin.left + plotW} y2={scaleY(yVal)}
				stroke="var(--hatch-grid-color, #1e2a38)" stroke-width="0.5" />
		{/each}

		<!-- Event markers -->
		{#each events as event}
			{@const ex = scaleX(event.time)}
			<line x1={ex} y1={margin.top} x2={ex} y2={margin.top + plotH}
				stroke={event.color ?? '#ff7f00'} stroke-width="1" stroke-dasharray="4 2" opacity="0.7" />
			<text x={ex + 3} y={margin.top + 12} fill={event.color ?? '#ff7f00'} font-size="9" transform="rotate(-45, {ex + 3}, {margin.top + 12})">{event.label}</text>
		{/each}

		<!-- Series -->
		{#each series as s, idx}
			{@const color = lineColor(s, idx)}
			<path d={linePath(s)} fill="none" stroke={color} stroke-width="1.5" />

			{#if showPoints}
				{#each s.x as xv, i}
					<circle cx={scaleX(xv)} cy={scaleY(s.y[i], s.yAxis ?? 'left')} r="2.5" fill={color} />
				{/each}
			{/if}
		{/each}

		<!-- Hover overlay -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="transparent" style="cursor: crosshair"
			use:hover={{ move: handleMouseMove, out: () => onhoverinfo?.(null) }} />

		<!-- Axes -->
		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRangeLeft.min} max={yRangeLeft.max} height={plotH} x={margin.left} y={margin.top}
			label={series.find(s => (s.yAxis ?? 'left') === 'left')?.unit ?? ''} />

		{#if series.some(s => s.yAxis === 'right')}
			<AxisY min={yRangeRight.min} max={yRangeRight.max} height={plotH}
				x={margin.left + plotW} y={margin.top} side="right"
				label={series.find(s => s.yAxis === 'right')?.unit ?? ''} />
		{/if}

		<!-- Legend -->
		{#each series as s, idx}
			<g transform="translate({margin.left + 10}, {margin.top + 10 + idx * 16})">
				<line x1="0" y1="0" x2="16" y2="0" stroke={lineColor(s, idx)} stroke-width="2" />
				<text x="22" y="4" fill="var(--hatch-legend-color, #95a3b3)" font-size="10">{s.name}</text>
			</g>
		{/each}
	</svg>

</div>

<style>
	.hatch-time-series {
		display: inline-block;
	}
</style>
