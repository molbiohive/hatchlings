<script lang="ts">
	import type { SpectrumPeak } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { hover } from '../../util/hover.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		x: number[];
		y: number[];
		peaks?: SpectrumPeak[];
		xLabel?: string;
		yLabel?: string;
		title?: string;
		width?: number;
		height?: number;
		color?: string;
		showPeaks?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		x,
		y,
		peaks = [],
		xLabel = 'Wavelength (nm)',
		yLabel = 'Absorbance',
		title = '',
		width = 550,
		height = 320,
		color = '#1f77b4',
		showPeaks = true,
		onhoverinfo,
	}: Props = $props();

	const margin = { top: 30, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	const xRange = $derived({ min: Math.min(...x), max: Math.max(...x) });
	const yRange = $derived.by(() => {
		const ymin = Math.min(0, Math.min(...y));
		return { min: ymin, max: Math.max(...y) * 1.1 };
	});

	function scaleX(val: number): number {
		return margin.left + ((val - xRange.min) / (xRange.max - xRange.min)) * plotW;
	}

	function scaleY(val: number): number {
		const { min, max } = yRange;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	const linePath = $derived.by(() => {
		return x.map((xv, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(xv)} ${scaleY(y[i])}`
		).join(' ');
	});


</script>

<div class="hatch-spectrum" style:position="relative">
	<svg {width} {height}>
		{#if title}
			<text x={width / 2} y="18" text-anchor="middle" fill="var(--hatch-title-color, #d4dce6)" font-size="13" font-weight="600">{title}</text>
		{/if}

		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Grid -->
		{#each Array.from({length: 5}, (_, i) => i) as i}
			{@const yVal = yRange.min + (i / 4) * (yRange.max - yRange.min)}
			<line x1={margin.left} y1={scaleY(yVal)} x2={margin.left + plotW} y2={scaleY(yVal)}
				stroke="var(--hatch-grid-color, #1e2a38)" stroke-width="0.5" />
		{/each}

		<!-- Spectrum line -->
		<path d={linePath} fill="none" stroke={color} stroke-width="1.5" />

		<!-- Area fill -->
		<path
			d={`${linePath} L ${scaleX(x[x.length - 1])} ${scaleY(0)} L ${scaleX(x[0])} ${scaleY(0)} Z`}
			fill={color}
			opacity="0.1"
		/>

		<!-- Peak annotations -->
		{#if showPeaks}
			{#each peaks as peak}
				<line x1={scaleX(peak.x)} y1={scaleY(peak.y)} x2={scaleX(peak.x)} y2={scaleY(peak.y) - 16}
					stroke={color} stroke-width="0.8" />
				<text x={scaleX(peak.x)} y={scaleY(peak.y) - 20} text-anchor="middle"
					fill="var(--hatch-axis-text, #95a3b3)" font-size="9">
					{peak.label ?? peak.x.toFixed(1)}
				</text>
				<circle cx={scaleX(peak.x)} cy={scaleY(peak.y)} r="3" fill={color}
					use:hover={{
						over: (e) => onhoverinfo?.({ title: peak.label ?? 'Peak', items: [{label: xLabel, value: peak.x.toFixed(1)}, {label: yLabel, value: peak.y.toFixed(3)}], position: { x: e.clientX, y: e.clientY } }),
						out: () => onhoverinfo?.(null)
					}}
					style="cursor: pointer"
				/>
			{/each}
		{/if}

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />
	</svg>

</div>

<style>
	.hatch-spectrum {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}
</style>
