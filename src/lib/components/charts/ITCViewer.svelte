<script lang="ts">
	import type { ITCData, ITCParams } from '../../types/index.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		rawThermogram: { time: number[]; power: number[] };
		isotherm: { ratio: number[]; heat: number[]; fit?: { x: number[]; y: number[] } };
		params?: ITCParams;
		width?: number;
		height?: number;
		showFit?: boolean;
		showParams?: boolean;
	}

	let {
		rawThermogram,
		isotherm,
		params,
		width = 450,
		height = 600,
		showFit = true,
		showParams = true,
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 10, left: 60 };
	const gap = 30;
	const topH = $derived((height - margin.top - margin.bottom - gap) * 0.5);
	const botH = $derived((height - margin.top - margin.bottom - gap) * 0.5);
	const plotW = $derived(width - margin.left - margin.right);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const botTop = $derived(margin.top + topH + gap);

	// Top panel ranges (thermogram)
	const txRange = $derived({
		min: Math.min(...rawThermogram.time),
		max: Math.max(...rawThermogram.time),
	});
	const tyRange = $derived.by(() => {
		const vals = rawThermogram.power;
		return { min: Math.min(...vals) * 1.1, max: Math.max(...vals) * 1.1 };
	});

	// Bottom panel ranges (isotherm)
	const bxRange = $derived({
		min: Math.min(...isotherm.ratio),
		max: Math.max(...isotherm.ratio),
	});
	const byRange = $derived.by(() => {
		const vals = isotherm.heat;
		const fitVals = isotherm.fit ? isotherm.fit.y : [];
		const all = [...vals, ...fitVals];
		return { min: Math.min(...all) * 1.1, max: Math.max(...all) * 1.1 };
	});

	function scaleTopX(val: number): number {
		return margin.left + ((val - txRange.min) / (txRange.max - txRange.min)) * plotW;
	}
	function scaleTopY(val: number): number {
		const { min, max } = tyRange;
		return margin.top + topH - ((val - min) / (max - min)) * topH;
	}
	function scaleBotX(val: number): number {
		return margin.left + ((val - bxRange.min) / (bxRange.max - bxRange.min)) * plotW;
	}
	function scaleBotY(val: number): number {
		const { min, max } = byRange;
		const yOffset = margin.top + topH + gap;
		return yOffset + botH - ((val - min) / (max - min)) * botH;
	}

	const thermogramPath = $derived.by(() => {
		return rawThermogram.time.map((t, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleTopX(t)} ${scaleTopY(rawThermogram.power[i])}`
		).join(' ');
	});
</script>

<div class="hatch-itc" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<!-- Top panel: Raw thermogram -->
		<rect x={margin.left} y={margin.top} width={plotW} height={topH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />
		<path d={thermogramPath} fill="none" stroke="#1f77b4" stroke-width="1" />

		<AxisX min={txRange.min} max={txRange.max} width={plotW} y={margin.top + topH} x={margin.left} label="Time (min)" />
		<AxisY min={tyRange.min} max={tyRange.max} height={topH} x={margin.left} y={margin.top} label="Power (\u00B5cal/s)" />

		<!-- Bottom panel: Isotherm -->
		<rect x={margin.left} y={botTop} width={plotW} height={botH}
			fill="var(--hatch-plot-bg, #1a1a2e)" rx="2" />

		<!-- Data points -->
		{#each isotherm.ratio as r, i}
			<circle
				cx={scaleBotX(r)}
				cy={scaleBotY(isotherm.heat[i])}
				r="4"
				fill="#e41a1c"
				stroke="var(--hatch-plot-bg, #1a1a2e)"
				stroke-width="1.5"
				onmouseenter={(e) => {
					tooltip = { visible: true, x: e.clientX, y: e.clientY, text: `Ratio=${r.toFixed(2)}, \u0394H=${isotherm.heat[i].toFixed(1)} kcal/mol` };
				}}
				onmouseleave={() => tooltip.visible = false}
			/>
		{/each}

		<!-- Fit line -->
		{#if showFit && isotherm.fit}
			{@const fitPath = isotherm.fit.x.map((xv, i) =>
				`${i === 0 ? 'M' : 'L'} ${scaleBotX(xv)} ${scaleBotY(isotherm.fit!.y[i])}`
			).join(' ')}
			<path d={fitPath} fill="none" stroke="#e41a1c" stroke-width="1.5" />
		{/if}

		<!-- Params -->
		{#if showParams && params}
			<g transform="translate({margin.left + plotW - 130}, {botTop + 12})">
				<rect x="-4" y="-4" width="128" height="52" fill="var(--hatch-plot-bg, #1a1a2e)" opacity="0.9" rx="3"
					stroke="var(--hatch-grid-color, #2a2a4a)" />
				<text y="8" fill="var(--hatch-axis-text, #aaa)" font-size="10">N = {params.N.toFixed(2)}</text>
				<text y="22" fill="var(--hatch-axis-text, #aaa)" font-size="10">Ka = {params.Ka.toExponential(2)} M\u207B\u00B9</text>
				<text y="36" fill="var(--hatch-axis-text, #aaa)" font-size="10">\u0394H = {params.deltaH.toFixed(1)} kcal/mol</text>
			</g>
		{/if}

		<AxisX min={bxRange.min} max={bxRange.max} width={plotW} y={botTop + botH} x={margin.left} label="Molar Ratio" />
		<AxisY min={byRange.min} max={byRange.max} height={botH} x={margin.left} y={botTop} label="kcal/mol" />
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-itc {
		display: inline-block;
	}
</style>
