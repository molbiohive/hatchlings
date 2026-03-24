<script lang="ts">
	import type { DataPoint, Gate } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { categoricalColors } from '../../util/colors.js';
	import { hover } from '../../util/hover.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import { CHART_MARGIN } from '../../util/layout.js';
	import { dataRange } from '../../util/chart.js';

	interface Props {
		points: DataPoint[];
		axes?: { x: string; y: string };
		gates?: Gate[];
		width?: number;
		height?: number;
		xLabel?: string;
		yLabel?: string;
		logX?: boolean;
		logY?: boolean;
		pointSize?: number;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		points,
		axes,
		gates = [],
		width = 450,
		height = 400,
		xLabel = axes?.x ?? 'X',
		yLabel = axes?.y ?? 'Y',
		logX = false,
		logY = false,
		pointSize = 2.5,
		onhoverinfo,
	}: Props = $props();

	const margin = CHART_MARGIN;
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	const xRange = $derived(dataRange(points.map(p => p.x), logX));
	const yRange = $derived(dataRange(points.map(p => p.y), logY));

	function scaleX(val: number): number {
		if (logX) {
			const logMin = Math.log10(Math.max(xRange.min, 1e-10));
			const logMax = Math.log10(Math.max(xRange.max, 1e-10));
			return margin.left + ((Math.log10(Math.max(val, 1e-10)) - logMin) / (logMax - logMin)) * plotW;
		}
		return margin.left + ((val - xRange.min) / (xRange.max - xRange.min)) * plotW;
	}

	function scaleY(val: number): number {
		if (logY) {
			const logMin = Math.log10(Math.max(yRange.min, 1e-10));
			const logMax = Math.log10(Math.max(yRange.max, 1e-10));
			return margin.top + plotH - ((Math.log10(Math.max(val, 1e-10)) - logMin) / (logMax - logMin)) * plotH;
		}
		return margin.top + plotH - ((val - yRange.min) / (yRange.max - yRange.min)) * plotH;
	}

	function pointColor(p: DataPoint, idx: number): string {
		if (p.color) return p.color;
		if (p.group) {
			const groups = [...new Set(points.map(pt => pt.group))];
			return categoricalColors[groups.indexOf(p.group) % categoricalColors.length];
		}
		return '#1f77b4';
	}

	function handleMouseMove(e: MouseEvent) {
		if (!onhoverinfo) return;
		const svg = (e.currentTarget as SVGElement).closest('svg');
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		let closest: DataPoint | null = null;
		let minDist = 400;
		for (const point of points) {
			const px = scaleX(point.x);
			const py = scaleY(point.y);
			const dist = (mx - px) ** 2 + (my - py) ** 2;
			if (dist < minDist) { minDist = dist; closest = point; }
		}

		if (closest) {
			onhoverinfo({ title: closest.label ?? 'Point', items: [{ label: xLabel, value: closest.x.toFixed(2) }, { label: yLabel, value: closest.y.toFixed(2) }], position: { x: e.clientX, y: e.clientY } });
		} else {
			onhoverinfo(null);
		}
	}
</script>

<div class="hatch-scatter" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Gates -->
		{#each gates as gate}
			{#if gate.type === 'rectangle' && gate.coordinates.length >= 4}
				{@const [x1, y1, x2, y2] = gate.coordinates}
				<rect
					x={scaleX(Math.min(x1, x2))}
					y={scaleY(Math.max(y1, y2))}
					width={Math.abs(scaleX(x2) - scaleX(x1))}
					height={Math.abs(scaleY(y2) - scaleY(y1))}
					fill="none"
					stroke={gate.color ?? '#ff7f00'}
					stroke-width="1.5"
					stroke-dasharray="4 2"
				/>
				<text x={scaleX(Math.min(x1, x2)) + 4} y={scaleY(Math.max(y1, y2)) + 14}
					fill={gate.color ?? '#ff7f00'} font-size="10" font-weight="600">{gate.name}</text>
			{/if}
			{#if gate.type === 'polygon' && gate.coordinates.length >= 6}
				{@const polyPath = Array.from({length: gate.coordinates.length / 2}, (_, i) => {
					const px = scaleX(gate.coordinates[i * 2]);
					const py = scaleY(gate.coordinates[i * 2 + 1]);
					return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
				}).join(' ') + ' Z'}
				<path d={polyPath} fill="none" stroke={gate.color ?? '#ff7f00'} stroke-width="1.5" stroke-dasharray="4 2" />
			{/if}
		{/each}

		<!-- Points -->
		{#each points as point, idx}
			<circle
				cx={scaleX(point.x)}
				cy={scaleY(point.y)}
				r={pointSize}
				fill={pointColor(point, idx)}
				opacity="0.6"
				pointer-events="none"
			/>
		{/each}

		<!-- Hover overlay — nearest-point detection -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="transparent" style="cursor: crosshair"
			use:hover={{ move: handleMouseMove, out: () => onhoverinfo?.(null) }} />

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} log={logX} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />
	</svg>

</div>

<style>
	.hatch-scatter {
		display: inline-block;
	}
</style>
