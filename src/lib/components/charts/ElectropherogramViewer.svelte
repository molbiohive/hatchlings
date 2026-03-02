<script lang="ts">
	import type { ElectropherogramData, ElectropherogramPeak } from '../../types/index.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		x: number[];
		y: number[];
		peaks: ElectropherogramPeak[];
		ladder?: { x: number; size: number }[];
		xLabel?: string;
		yLabel?: string;
		width?: number;
		height?: number;
		showPeaks?: boolean;
		color?: string;
	}

	let {
		x,
		y,
		peaks,
		ladder = [],
		xLabel = 'Migration Time (s)',
		yLabel = 'Fluorescence (RFU)',
		width = 600,
		height = 300,
		showPeaks = true,
		color = '#4dc3ff',
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const xRange = $derived({ min: Math.min(...x), max: Math.max(...x) });
	const yRange = $derived.by(() => {
		return { min: 0, max: Math.max(...y) * 1.1 };
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

	const areaPath = $derived.by(() => {
		return `${linePath} L ${scaleX(x[x.length - 1])} ${scaleY(0)} L ${scaleX(x[0])} ${scaleY(0)} Z`;
	});
</script>

<div class="hatch-electropherogram" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		<!-- Area fill -->
		<path d={areaPath} fill={color} opacity="0.1" />

		<!-- Line -->
		<path d={linePath} fill="none" stroke={color} stroke-width="1.5" />

		<!-- Peak annotations -->
		{#if showPeaks}
			{#each peaks as peak}
				{@const px = scaleX(peak.x)}
				{@const py = scaleY(peak.height)}
				<line x1={px} y1={py} x2={px} y2={py - 14} stroke={color} stroke-width="0.7" opacity="0.6" />
				<text x={px} y={py - 17} text-anchor="middle" fill="var(--hatch-axis-text, #aaa)" font-size="8">
					{peak.size ? `${peak.size} bp` : peak.label ?? ''}
				</text>
				<circle cx={px} cy={py} r="2.5" fill={color}
					onmouseenter={(e) => {
						tooltip = {
							visible: true, x: e.clientX, y: e.clientY,
							text: `${peak.label ?? ''} ${peak.size ? peak.size + ' bp' : ''} h=${peak.height.toFixed(0)}${peak.area ? ' area=' + peak.area.toFixed(0) : ''}`,
						};
					}}
					onmouseleave={() => tooltip.visible = false}
				/>
			{/each}
		{/if}

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label={xLabel} />
		<AxisY min={yRange.min} max={yRange.max} height={plotH} x={margin.left} y={margin.top} label={yLabel} />
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-electropherogram {
		display: inline-block;
	}
</style>
