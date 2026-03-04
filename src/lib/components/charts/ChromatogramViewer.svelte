<script lang="ts">
	import type { ChromData, ChromTrace, ChromPeak, ChromFraction } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { categoricalColors } from '../../util/colors.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		traces: ChromTrace[];
		peaks?: ChromPeak[];
		fractions?: ChromFraction[];
		xLabel?: string;
		width?: number;
		height?: number;
		showPeaks?: boolean;
		showFractions?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		traces,
		peaks = [],
		fractions = [],
		xLabel = 'Volume (mL)',
		width = 600,
		height = 350,
		showPeaks = true,
		showFractions = true,
		onhoverinfo,
	}: Props = $props();

	const margin = { top: 20, right: 60, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);
	const fractionH = 20;

	const xRange = $derived.by(() => {
		const allX = traces.flatMap(t => t.x);
		return { min: Math.min(...allX), max: Math.max(...allX) };
	});

	function yRangeFor(side: 'left' | 'right') {
		const relevant = traces.filter(t => (t.yAxis ?? 'left') === side);
		if (relevant.length === 0) return { min: 0, max: 1 };
		const allY = relevant.flatMap(t => t.y);
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
		const effH = showFractions && fractions.length > 0 ? plotH - fractionH - 4 : plotH;
		return margin.top + effH - ((val - range.min) / (range.max - range.min)) * effH;
	}

	function tracePath(trace: ChromTrace): string {
		const side = trace.yAxis ?? 'left';
		return trace.x.map((xv, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(xv)} ${scaleY(trace.y[i], side)}`
		).join(' ');
	}

	function traceColor(trace: ChromTrace, idx: number): string {
		return trace.color ?? categoricalColors[idx % categoricalColors.length];
	}
</script>

<div class="hatch-chromatogram" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Grid lines -->
		{#each Array.from({length: 5}, (_, i) => i) as i}
			{@const yVal = yRangeLeft.min + (i / 4) * (yRangeLeft.max - yRangeLeft.min)}
			<line x1={margin.left} y1={scaleY(yVal)} x2={margin.left + plotW} y2={scaleY(yVal)}
				stroke="var(--hatch-grid-color, #1e2a38)" stroke-width="0.5" />
		{/each}

		<!-- Fraction bars -->
		{#if showFractions && fractions.length > 0}
			{@const fracY = margin.top + plotH - fractionH}
			{#each fractions as frac, i}
				<rect
					x={scaleX(frac.start)}
					y={fracY}
					width={scaleX(frac.end) - scaleX(frac.start)}
					height={fractionH}
					fill={frac.color ?? categoricalColors[i % categoricalColors.length]}
					opacity="0.3"
					stroke={frac.color ?? categoricalColors[i % categoricalColors.length]}
					stroke-width="0.5"
				/>
				<text
					x={(scaleX(frac.start) + scaleX(frac.end)) / 2}
					y={fracY + fractionH / 2 + 3}
					text-anchor="middle"
					fill="var(--hatch-axis-text, #7a8898)"
					font-size="8"
				>{frac.name}</text>
			{/each}
		{/if}

		<!-- Peak annotations -->
		{#if showPeaks && peaks.length > 0}
			{#each peaks as peak}
				<rect
					x={scaleX(peak.start)}
					y={margin.top}
					width={scaleX(peak.end) - scaleX(peak.start)}
					height={plotH - (showFractions && fractions.length > 0 ? fractionH + 4 : 0)}
					fill="rgba(255,255,255,0.04)"
				/>
				{#if peak.label}
					<text
						x={scaleX(peak.apex)}
						y={margin.top + 14}
						text-anchor="middle"
						fill="var(--hatch-axis-text, #95a3b3)"
						font-size="10"
					>{peak.label}</text>
				{/if}
			{/each}
		{/if}

		<!-- Traces -->
		{#each traces as trace, idx}
			<path
				d={tracePath(trace)}
				fill="none"
				stroke={traceColor(trace, idx)}
				stroke-width="1.5"
			/>
		{/each}

		<!-- Axes -->
		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRangeLeft.min} max={yRangeLeft.max} height={plotH} x={margin.left} y={margin.top}
			label={traces.find(t => (t.yAxis ?? 'left') === 'left')?.unit ?? 'mAU'} />

		{#if traces.some(t => t.yAxis === 'right')}
			<AxisY min={yRangeRight.min} max={yRangeRight.max} height={plotH}
				x={margin.left + plotW} y={margin.top} side="right"
				label={traces.find(t => t.yAxis === 'right')?.unit ?? '%B'} />
		{/if}

		<!-- Legend -->
		{#each traces as trace, idx}
			<g transform="translate({margin.left + 10}, {margin.top + 10 + idx * 18})">
				<line x1="0" y1="0" x2="16" y2="0" stroke={traceColor(trace, idx)} stroke-width="2" />
				<text x="22" y="4" fill="var(--hatch-legend-color, #95a3b3)" font-size="10">{trace.name}</text>
			</g>
		{/each}
	</svg>

</div>

<style>
	.hatch-chromatogram {
		display: inline-block;
	}
</style>
