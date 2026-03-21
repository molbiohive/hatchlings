<script lang="ts">
	import type { DataPoint, Thresholds } from '../../types/index.js';
	import type { HoverInfo, InfoItem } from '../../types/utility.js';
	import { hover } from '../../util/hover.js';
	import { CHART_MARGIN } from '../../util/layout.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		points: DataPoint[];
		thresholds?: Thresholds;
		xLabel?: string;
		yLabel?: string;
		width?: number;
		height?: number;
		highlightSignificant?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		points,
		thresholds = { x: 1, xNeg: -1, y: 1.3 },
		xLabel = 'log2(Fold Change)',
		yLabel = '-log10(p-value)',
		width = 500,
		height = 400,
		highlightSignificant = true,
		onhoverinfo,
	}: Props = $props();

	const margin = CHART_MARGIN;
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	const xRange = $derived.by(() => {
		const vals = points.map(p => p.x);
		const absMax = Math.max(Math.abs(Math.min(...vals)), Math.abs(Math.max(...vals))) * 1.1;
		return { min: -absMax, max: absMax };
	});

	const yRange = $derived.by(() => {
		const vals = points.map(p => p.y);
		return { min: 0, max: Math.max(...vals) * 1.1 };
	});

	function scaleX(val: number): number {
		const { min, max } = xRange;
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	function pointColor(p: DataPoint): string {
		if (p.color) return p.color;
		if (!highlightSignificant) return 'var(--hatch-text-dim, #566070)';
		const sig = p.significant ?? (
			p.y >= (thresholds.y ?? 1.3) &&
			(p.x >= (thresholds.x ?? 1) || p.x <= (thresholds.xNeg ?? -(thresholds.x ?? 1)))
		);
		if (!sig) return 'var(--hatch-text-dim, #4a5a6a)';
		return p.x > 0 ? '#e41a1c' : '#1f77b4';
	}

	function handleMouseMove(e: MouseEvent) {
		if (!onhoverinfo) return;
		const svg = (e.currentTarget as SVGElement).closest('svg');
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		let closest: DataPoint | null = null;
		let minDist = 400; // max 20px snap distance (squared)
		for (const point of points) {
			const px = scaleX(point.x);
			const py = scaleY(point.y);
			const dist = (mx - px) ** 2 + (my - py) ** 2;
			if (dist < minDist) { minDist = dist; closest = point; }
		}

		if (closest) {
			const items: InfoItem[] = [
				{ label: 'Fold Change', value: closest.x.toFixed(2) },
				{ label: '-log10(p)', value: closest.y.toFixed(2) },
			];
			if (closest.label) items.unshift({ label: 'Gene', value: closest.label });
			onhoverinfo({ title: closest.label ?? 'Point', items, position: { x: e.clientX, y: e.clientY } });
		} else {
			onhoverinfo(null);
		}
	}
</script>

<div class="hatch-volcano" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Threshold lines -->
		{#if thresholds.y != null}
			<line x1={margin.left} y1={scaleY(thresholds.y)} x2={margin.left + plotW} y2={scaleY(thresholds.y)}
				stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" stroke-dasharray="4 3" />
		{/if}
		{#if thresholds.x != null}
			<line x1={scaleX(thresholds.x)} y1={margin.top} x2={scaleX(thresholds.x)} y2={margin.top + plotH}
				stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" stroke-dasharray="4 3" />
		{/if}
		{#if thresholds.xNeg != null}
			<line x1={scaleX(thresholds.xNeg)} y1={margin.top} x2={scaleX(thresholds.xNeg)} y2={margin.top + plotH}
				stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" stroke-dasharray="4 3" />
		{/if}

		<!-- Points -->
		{#each points as point}
			<circle
				cx={scaleX(point.x)}
				cy={scaleY(point.y)}
				r="3"
				fill={pointColor(point)}
				opacity="0.7"
				pointer-events="none"
			/>
		{/each}

		<!-- Labels for significant points -->
		{#each points.filter(p => p.significant && p.label) as point}
			<text
				x={scaleX(point.x) + 5}
				y={scaleY(point.y) - 5}
				fill="var(--hatch-axis-text, #95a3b3)"
				font-size="9"
				pointer-events="none"
			>{point.label}</text>
		{/each}

		<!-- Hover overlay — nearest-point detection -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="transparent" style="cursor: crosshair"
			use:hover={{ move: handleMouseMove, out: () => onhoverinfo?.(null) }} />

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />
	</svg>

</div>

<style>
	.hatch-volcano {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}
</style>
