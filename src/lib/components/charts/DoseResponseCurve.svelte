<script lang="ts">
	import type { DoseResponseData, DoseResponseCurveData } from '../../types/index.js';
	import { categoricalColors } from '../../util/colors.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		curves: DoseResponseCurveData[];
		logX?: boolean;
		showFit?: boolean;
		xLabel?: string;
		yLabel?: string;
		width?: number;
		height?: number;
		showCI?: boolean;
	}

	let {
		curves,
		logX = true,
		showFit = true,
		xLabel = 'Concentration',
		yLabel = 'Response',
		width = 500,
		height = 350,
		showCI = false,
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	// Compute data ranges
	const xRange = $derived.by(() => {
		const allX = curves.flatMap(c => c.points.map(p => p.x));
		const fitX = showFit ? curves.flatMap(c => c.fit?.line.map(p => p.x) ?? []) : [];
		const all = [...allX, ...fitX].filter(v => v > 0);
		return { min: Math.min(...all), max: Math.max(...all) };
	});

	const yRange = $derived.by(() => {
		const allY = curves.flatMap(c => c.points.map(p => p.y));
		const fitY = showFit ? curves.flatMap(c => c.fit?.line.map(p => p.y) ?? []) : [];
		const all = [...allY, ...fitY];
		return { min: Math.min(...all) * 0.95, max: Math.max(...all) * 1.05 };
	});

	function scaleX(val: number): number {
		const { min, max } = xRange;
		if (logX) {
			const logMin = Math.log10(Math.max(min, 1e-10));
			const logMax = Math.log10(Math.max(max, 1e-10));
			return margin.left + ((Math.log10(Math.max(val, 1e-10)) - logMin) / (logMax - logMin)) * plotW;
		}
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	function fitPath(line: { x: number; y: number }[]): string {
		if (line.length === 0) return '';
		return line.map((p, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`
		).join(' ');
	}

	function curveColor(idx: number, curve: DoseResponseCurveData): string {
		return curve.color ?? categoricalColors[idx % categoricalColors.length];
	}
</script>

<div class="hatch-dose-response" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<!-- Plot area background -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		<!-- Grid lines -->
		{#each Array.from({length: 5}, (_, i) => i) as i}
			{@const yVal = yRange.min + (i / 4) * (yRange.max - yRange.min)}
			<line
				x1={margin.left} y1={scaleY(yVal)}
				x2={margin.left + plotW} y2={scaleY(yVal)}
				stroke="var(--hatch-grid-color, #2a2a4a)" stroke-width="0.5"
			/>
		{/each}

		<!-- Curves -->
		{#each curves as curve, idx}
			{@const color = curveColor(idx, curve)}

			<!-- Fit line -->
			{#if showFit && curve.fit}
				<path
					d={fitPath(curve.fit.line)}
					fill="none"
					stroke={color}
					stroke-width="2"
				/>

				<!-- IC50 annotation -->
				{#if curve.fit.params.ic50}
					{@const ic50x = scaleX(curve.fit.params.ic50)}
					{@const ic50y = scaleY((curve.fit.params.top + curve.fit.params.bottom) / 2)}
					<line x1={ic50x} y1={margin.top} x2={ic50x} y2={margin.top + plotH}
						stroke={color} stroke-width="1" stroke-dasharray="4 3" opacity="0.5" />
					<circle cx={ic50x} cy={ic50y} r="4" fill={color} opacity="0.8" />
				{/if}
			{/if}

			<!-- Data points -->
			{#each curve.points as point}
				<circle
					cx={scaleX(point.x)}
					cy={scaleY(point.y)}
					r="4"
					fill={color}
					stroke="var(--hatch-plot-bg, #1a1a2e)"
					stroke-width="1.5"
					onmouseenter={(e) => {
						tooltip = {
							visible: true,
							x: e.clientX,
							y: e.clientY,
							text: `${curve.label}: (${point.x.toExponential(2)}, ${point.y.toFixed(1)})`
						};
					}}
					onmouseleave={() => tooltip.visible = false}
					style="cursor: pointer"
				/>
			{/each}
		{/each}

		<!-- Axes -->
		<AxisX
			min={xRange.min} max={xRange.max}
			width={plotW} y={margin.top + plotH} x={margin.left}
			label={xLabel} log={logX}
		/>
		<AxisY
			min={yRange.min} max={yRange.max}
			height={plotH} x={margin.left} y={margin.top}
			label={yLabel}
		/>

		<!-- Legend -->
		{#each curves as curve, idx}
			{@const color = curveColor(idx, curve)}
			<g transform="translate({margin.left + plotW - 120}, {margin.top + 10 + idx * 20})">
				<line x1="0" y1="0" x2="20" y2="0" stroke={color} stroke-width="2" />
				<circle cx="10" cy="0" r="3" fill={color} />
				<text x="26" y="4" fill="var(--hatch-legend-color, #aaa)" font-size="11">{curve.label}</text>
			</g>
		{/each}
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-dose-response {
		display: inline-block;
	}
</style>
