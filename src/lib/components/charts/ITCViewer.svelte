<script lang="ts">
	import type { ITCParams, ITCData } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { hover } from '../../util/hover.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		data?: ITCData;
		rawThermogram?: { time: number[]; power: number[] };
		isotherm?: { ratio: number[]; heat: number[]; fit?: { x: number[]; y: number[] } };
		params?: ITCParams;
		width?: number;
		height?: number;
		showFit?: boolean;
		showParams?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		data,
		rawThermogram: rawThermogramProp,
		isotherm: isothermProp,
		params: paramsProp,
		width = 450,
		height = 600,
		showFit = true,
		showParams = true,
		onhoverinfo,
	}: Props = $props();

	const rawThermogram = $derived(rawThermogramProp ?? data?.rawThermogram ?? { time: [], power: [] });
	const isotherm = $derived(isothermProp ?? data?.isotherm ?? { ratio: [], heat: [] });
	const params = $derived(paramsProp ?? data?.params);

	const margin = { top: 20, right: 20, bottom: 10, left: 60 };
	const gap = 30;
	const topH = $derived((height - margin.top - margin.bottom - gap) * 0.5);
	const botH = $derived((height - margin.top - margin.bottom - gap) * 0.5);
	const plotW = $derived(width - margin.left - margin.right);

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
	<svg {width} {height}>
		<!-- Top panel: Raw thermogram -->
		<rect x={margin.left} y={margin.top} width={plotW} height={topH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />
		<path d={thermogramPath} fill="none" stroke="#1f77b4" stroke-width="1" />

		<AxisX min={txRange.min} max={txRange.max} width={plotW} y={margin.top + topH} x={margin.left} label="Time (min)" />
		<AxisY min={tyRange.min} max={tyRange.max} height={topH} x={margin.left} y={margin.top} label="Power (\u00B5cal/s)" />

		<!-- Bottom panel: Isotherm -->
		<rect x={margin.left} y={botTop} width={plotW} height={botH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		<!-- Data points -->
		{#each isotherm.ratio as r, i}
			<circle
				cx={scaleBotX(r)}
				cy={scaleBotY(isotherm.heat[i])}
				r="4"
				fill="#e41a1c"
				use:hover={{
					over: (e) => onhoverinfo?.({title: 'Injection', items: [{label: 'Molar Ratio', value: r.toFixed(2)}, {label: '\u0394H', value: isotherm.heat[i].toFixed(1), unit: 'kcal/mol'}], position: {x: e.clientX, y: e.clientY}}),
					out: () => onhoverinfo?.(null)
				}}
				style="cursor: pointer"
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
				<rect x="-4" y="-4" width="128" height="52" fill="var(--hatch-plot-bg, #141c26)" opacity="0.9" rx="3"
					stroke="var(--hatch-grid-color, #1e2a38)" />
				<text y="8" fill="var(--hatch-axis-text, #95a3b3)" font-size="10">N = {params.N.toFixed(2)}</text>
				<text y="22" fill="var(--hatch-axis-text, #95a3b3)" font-size="10">Ka = {params.Ka.toExponential(2)} M\u207B\u00B9</text>
				<text y="36" fill="var(--hatch-axis-text, #95a3b3)" font-size="10">\u0394H = {params.deltaH.toFixed(1)} kcal/mol</text>
			</g>
		{/if}

		<AxisX min={bxRange.min} max={bxRange.max} width={plotW} y={botTop + botH} x={margin.left} label="Molar Ratio" />
		<AxisY min={byRange.min} max={byRange.max} height={botH} x={margin.left} y={botTop} label="kcal/mol" />
	</svg>

</div>

<style>
	.hatch-itc {
		display: inline-block;
	}
</style>
