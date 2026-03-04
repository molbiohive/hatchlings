<script lang="ts">
	import type { MeltingCurveData } from '../../types/index.js';
	import type { HoverInfo, InfoItem } from '../../types/utility.js';
	import { categoricalColors } from '../../util/colors.js';
	import { hover } from '../../util/hover.js';
	import AxisX from '../shared/AxisX.svelte';
	import AxisY from '../shared/AxisY.svelte';

	interface Props {
		curves: MeltingCurveData['curves'];
		width?: number;
		height?: number;
		showDerivative?: boolean;
		showTm?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		curves,
		width = 550,
		height = 350,
		showDerivative = true,
		showTm = true,
		onhoverinfo,
	}: Props = $props();

	const margin = { top: 20, right: 60, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	const xRange = $derived.by(() => {
		const allT = curves.flatMap(c => c.temp);
		return { min: Math.min(...allT), max: Math.max(...allT) };
	});

	const yRangeRatio = $derived.by(() => {
		const allR = curves.flatMap(c => c.ratio);
		return { min: Math.min(...allR) * 0.95, max: Math.max(...allR) * 1.05 };
	});

	const yRangeDeriv = $derived.by(() => {
		if (!showDerivative) return { min: 0, max: 1 };
		const allD = curves.flatMap(c => c.derivative);
		return { min: Math.min(...allD), max: Math.max(...allD) * 1.1 };
	});

	function scaleX(val: number): number {
		const { min, max } = xRange;
		return margin.left + ((val - min) / (max - min)) * plotW;
	}

	function scaleYRatio(val: number): number {
		const { min, max } = yRangeRatio;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	function scaleYDeriv(val: number): number {
		const { min, max } = yRangeDeriv;
		return margin.top + plotH - ((val - min) / (max - min)) * plotH;
	}

	function ratioPath(c: MeltingCurveData['curves'][0]): string {
		return c.temp.map((t, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleYRatio(c.ratio[i])}`
		).join(' ');
	}

	function derivPath(c: MeltingCurveData['curves'][0]): string {
		return c.temp.map((t, i) =>
			`${i === 0 ? 'M' : 'L'} ${scaleX(t)} ${scaleYDeriv(c.derivative[i])}`
		).join(' ');
	}

	function handleMouseMove(e: MouseEvent) {
		if (!onhoverinfo) return;
		const svg = (e.currentTarget as SVGElement).closest('svg');
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		if (mx < margin.left || mx > margin.left + plotW) { onhoverinfo(null); return; }
		const temp = xRange.min + ((mx - margin.left) / plotW) * (xRange.max - xRange.min);
		const items: InfoItem[] = [
			{ label: 'Temperature', value: `${temp.toFixed(1)}\u00B0C` },
		];
		for (let ci = 0; ci < curves.length; ci++) {
			const c = curves[ci];
			let closest = 0;
			let minDist = Infinity;
			for (let i = 0; i < c.temp.length; i++) {
				const d = Math.abs(c.temp[i] - temp);
				if (d < minDist) { minDist = d; closest = i; }
			}
			const color = categoricalColors[ci % categoricalColors.length];
			items.push({ label: c.name, value: c.ratio[closest].toFixed(3), color });
		}
		onhoverinfo({ title: 'Melting Curve', items, position: { x: e.clientX, y: e.clientY } });
	}
</script>

<div class="hatch-melting-curve" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #141c26)" rx="2" />

		{#each curves as curve, idx}
			{@const color = categoricalColors[idx % categoricalColors.length]}

			<!-- Ratio curve (solid) -->
			<path d={ratioPath(curve)} fill="none" stroke={color} stroke-width="2" />

			<!-- Derivative curve (dashed) -->
			{#if showDerivative}
				<path d={derivPath(curve)} fill="none" stroke={color} stroke-width="1.5" stroke-dasharray="5 3" opacity="0.7" />
			{/if}

			<!-- Tm annotation -->
			{#if showTm && curve.tm != null}
				{@const tmx = scaleX(curve.tm)}
				<line x1={tmx} y1={margin.top} x2={tmx} y2={margin.top + plotH}
					stroke={color} stroke-width="1" stroke-dasharray="3 2" opacity="0.5" />
				<text x={tmx + 4} y={margin.top + 14} fill={color} font-size="10" font-weight="600">
					Tm={curve.tm.toFixed(1)}&deg;C
				</text>
			{/if}
		{/each}

		<!-- Hover overlay -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="transparent" style="cursor: crosshair"
			use:hover={{ move: handleMouseMove, out: () => onhoverinfo?.(null) }} />

		<AxisX min={xRange.min} max={xRange.max} width={plotW} y={margin.top + plotH} x={margin.left} label="Temperature (&deg;C)" />
		<AxisY min={yRangeRatio.min} max={yRangeRatio.max} height={plotH} x={margin.left} y={margin.top} label="Ratio (350/330)" />

		{#if showDerivative}
			<AxisY min={yRangeDeriv.min} max={yRangeDeriv.max} height={plotH}
				x={margin.left + plotW} y={margin.top} side="right" label="d(Ratio)/dT" />
		{/if}

		<!-- Legend -->
		{#each curves as curve, idx}
			{@const color = categoricalColors[idx % categoricalColors.length]}
			<g transform="translate({margin.left + 10}, {margin.top + 10 + idx * 18})">
				<line x1="0" y1="0" x2="16" y2="0" stroke={color} stroke-width="2" />
				<text x="22" y="4" fill="var(--hatch-legend-color, #95a3b3)" font-size="10">{curve.name}</text>
			</g>
		{/each}
	</svg>

</div>

<style>
	.hatch-melting-curve {
		display: inline-block;
	}
</style>
