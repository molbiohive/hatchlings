<script lang="ts">
	import type { KineticsData, KineticsCurve, KineticsStep, BindingParams } from '../../types/index.js';
	import { categoricalColors } from '../../util/colors.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		curves: KineticsCurve[];
		fit?: { x: number[]; y: number[] }[];
		steps?: KineticsStep[];
		params?: BindingParams;
		width?: number;
		height?: number;
		xLabel?: string;
		yLabel?: string;
		showFit?: boolean;
		showParams?: boolean;
	}

	let {
		curves,
		fit,
		steps = [],
		params,
		width = 600,
		height = 350,
		xLabel = 'Time (s)',
		yLabel = 'Response (nm)',
		showFit = true,
		showParams = true,
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const xRange = $derived.by(() => {
		const allX = curves.flatMap(c => c.x);
		return { min: Math.min(...allX), max: Math.max(...allX) };
	});

	const yRange = $derived.by(() => {
		const allY = curves.flatMap(c => c.y);
		const fitY = showFit && fit ? fit.flatMap(f => f.y) : [];
		const all = [...allY, ...fitY];
		return { min: Math.min(0, Math.min(...all)), max: Math.max(...all) * 1.1 };
	});

	function scaleX(val: number): number {
		const { min, max } = xRange;
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	function linePath(xArr: number[], yArr: number[]): string {
		return xArr.map((xv, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(xv)} ${scaleY(yArr[i])}`
		).join(' ');
	}

	function formatSI(val: number): string {
		if (val === 0) return '0';
		const exp = Math.floor(Math.log10(Math.abs(val)));
		if (exp >= 6) return (val / 1e6).toFixed(1) + 'M';
		if (exp >= 3) return (val / 1e3).toFixed(1) + 'k';
		if (exp >= 0) return val.toFixed(1);
		if (exp >= -3) return (val * 1e3).toFixed(1) + 'm';
		if (exp >= -6) return (val * 1e6).toFixed(1) + '\u00B5';
		if (exp >= -9) return (val * 1e9).toFixed(1) + 'n';
		if (exp >= -12) return (val * 1e12).toFixed(1) + 'p';
		return val.toExponential(2);
	}
</script>

<div class="hatch-kinetics" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		<!-- Step markers -->
		{#each steps as step}
			<rect
				x={scaleX(step.start)}
				y={margin.top}
				width={scaleX(step.end) - scaleX(step.start)}
				height={plotH}
				fill={step.type === 'association' ? 'rgba(77,175,74,0.05)' : step.type === 'dissociation' ? 'rgba(228,26,28,0.05)' : 'transparent'}
			/>
			<text
				x={(scaleX(step.start) + scaleX(step.end)) / 2}
				y={margin.top + 12}
				text-anchor="middle"
				fill="var(--hatch-axis-text, #666)"
				font-size="9"
			>{step.name}</text>
		{/each}

		<!-- Data curves -->
		{#each curves as curve, idx}
			{@const color = categoricalColors[idx % categoricalColors.length]}
			<path d={linePath(curve.x, curve.y)} fill="none" stroke={color} stroke-width="1.5" />
		{/each}

		<!-- Fit curves -->
		{#if showFit && fit}
			{#each fit as f, idx}
				{@const color = categoricalColors[idx % categoricalColors.length]}
				<path d={linePath(f.x, f.y)} fill="none" stroke={color} stroke-width="1" stroke-dasharray="4 2" opacity="0.8" />
			{/each}
		{/if}

		<!-- Kinetics params -->
		{#if showParams && params}
			<g transform="translate({margin.left + plotW - 140}, {margin.top + 10})">
				<rect x="-4" y="-4" width="138" height="56" fill="var(--hatch-plot-bg, #1a1a2e)" opacity="0.9" rx="3"
					stroke="var(--hatch-grid-color, #2a2a4a)" />
				<text y="8" fill="var(--hatch-axis-text, #aaa)" font-size="10">ka = {params.ka.toExponential(2)} 1/Ms</text>
				<text y="24" fill="var(--hatch-axis-text, #aaa)" font-size="10">kd = {params.kd.toExponential(2)} 1/s</text>
				<text y="40" fill="var(--hatch-highlight, #7dd3fc)" font-size="11" font-weight="600">KD = {formatSI(params.KD)}M</text>
			</g>
		{/if}

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />

		<!-- Legend -->
		{#each curves as curve, idx}
			{@const color = categoricalColors[idx % categoricalColors.length]}
			<g transform="translate({margin.left + 10}, {margin.top + 10 + idx * 16})">
				<line x1="0" y1="0" x2="16" y2="0" stroke={color} stroke-width="2" />
				<text x="22" y="4" fill="var(--hatch-legend-color, #aaa)" font-size="9">
					{curve.name}{curve.concentration ? ` (${formatSI(curve.concentration)}M)` : ''}
				</text>
			</g>
		{/each}
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-kinetics {
		display: inline-block;
	}
</style>
