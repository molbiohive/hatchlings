<script lang="ts">
	import type { FlowData, Gate } from '../../types/index.js';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		events: number[][];
		axes: { name: string; index: number }[];
		gates?: Gate[];
		width?: number;
		height?: number;
		xAxisIdx?: number;
		yAxisIdx?: number;
		logX?: boolean;
		logY?: boolean;
		mode?: 'scatter' | 'density';
		ongatechange?: (gates: Gate[]) => void;
	}

	let {
		events,
		axes,
		gates = [],
		width = 450,
		height = 400,
		xAxisIdx = 0,
		yAxisIdx = 1,
		logX = true,
		logY = true,
		mode = 'scatter',
		ongatechange,
	}: Props = $props();

	const margin = { top: 20, right: 20, bottom: 50, left: 60 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let canvasEl: HTMLCanvasElement | undefined = $state();

	const xIdx = $derived(axes[xAxisIdx]?.index ?? 0);
	const yIdx = $derived(axes[yAxisIdx]?.index ?? 1);
	const xName = $derived(axes[xAxisIdx]?.name ?? 'X');
	const yName = $derived(axes[yAxisIdx]?.name ?? 'Y');

	function range(values: number[], log: boolean): { min: number; max: number } {
		const filtered = log ? values.filter(v => v > 0) : values;
		if (filtered.length === 0) return { min: 0, max: 1 };
		return { min: Math.min(...filtered), max: Math.max(...filtered) };
	}

	const xRange = $derived(range(events.map(e => e[xIdx]), logX));
	const yRange = $derived(range(events.map(e => e[yIdx]), logY));

	function scaleX(val: number): number {
		if (logX) {
			const logMin = Math.log10(Math.max(xRange.min, 1));
			const logMax = Math.log10(Math.max(xRange.max, 1));
			return ((Math.log10(Math.max(val, 1)) - logMin) / (logMax - logMin)) * plotW;
		}
		return ((val - xRange.min) / (xRange.max - xRange.min)) * plotW;
	}

	function scaleY(val: number): number {
		if (logY) {
			const logMin = Math.log10(Math.max(yRange.min, 1));
			const logMax = Math.log10(Math.max(yRange.max, 1));
			return plotH - ((Math.log10(Math.max(val, 1)) - logMin) / (logMax - logMin)) * plotH;
		}
		return plotH - ((val - yRange.min) / (yRange.max - yRange.min)) * plotH;
	}

	$effect(() => {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, plotW, plotH);

		if (mode === 'density') {
			// Simple density rendering with binning
			const bins = 100;
			const grid = Array.from({ length: bins }, () => new Float32Array(bins));
			let maxDensity = 0;

			for (const event of events) {
				const x = scaleX(event[xIdx]);
				const y = scaleY(event[yIdx]);
				const bx = Math.floor((x / plotW) * (bins - 1));
				const by = Math.floor((y / plotH) * (bins - 1));
				if (bx >= 0 && bx < bins && by >= 0 && by < bins) {
					grid[by][bx]++;
					if (grid[by][bx] > maxDensity) maxDensity = grid[by][bx];
				}
			}

			const cellW = plotW / bins;
			const cellH = plotH / bins;
			for (let by = 0; by < bins; by++) {
				for (let bx = 0; bx < bins; bx++) {
					if (grid[by][bx] > 0) {
						const intensity = Math.log1p(grid[by][bx]) / Math.log1p(maxDensity);
						const r = Math.round(68 + intensity * 187);
						const g = Math.round(1 + intensity * 80);
						const b = Math.round(84 + intensity * (28 - 84));
						ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + intensity * 0.7})`;
						ctx.fillRect(bx * cellW, by * cellH, cellW + 0.5, cellH + 0.5);
					}
				}
			}
		} else {
			// Scatter mode
			ctx.globalAlpha = 0.15;
			for (const event of events) {
				const x = scaleX(event[xIdx]);
				const y = scaleY(event[yIdx]);
				if (x >= 0 && x <= plotW && y >= 0 && y <= plotH) {
					ctx.fillStyle = '#4dc3ff';
					ctx.beginPath();
					ctx.arc(x, y, 1.5, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			ctx.globalAlpha = 1;
		}
	});
</script>

<div class="hatch-flow" style:position="relative">
	<svg {width} {height}>
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plot-bg, #0d0d1a)" rx="2" />

		<!-- Canvas overlay for points -->
		<foreignObject x={margin.left} y={margin.top} width={plotW} height={plotH}>
			<canvas
				bind:this={canvasEl}
				width={plotW}
				height={plotH}
				style="width:{plotW}px;height:{plotH}px"
			></canvas>
		</foreignObject>

		<!-- Gates -->
		{#each gates as gate}
			{#if gate.type === 'rectangle' && gate.coordinates.length >= 4}
				{@const [x1, y1, x2, y2] = gate.coordinates}
				<rect
					x={margin.left + scaleX(Math.min(x1, x2))}
					y={margin.top + scaleY(Math.max(y1, y2))}
					width={Math.abs(scaleX(x2) - scaleX(x1))}
					height={Math.abs(scaleY(y2) - scaleY(y1))}
					fill="none"
					stroke={gate.color ?? '#ff7f00'}
					stroke-width="1.5"
				/>
				<text x={margin.left + scaleX(Math.min(x1, x2)) + 4} y={margin.top + scaleY(Math.max(y1, y2)) + 14}
					fill={gate.color ?? '#ff7f00'} font-size="10" font-weight="600">{gate.name}</text>
			{/if}
		{/each}

		<!-- Axes labels -->
		<line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH}
			stroke="var(--hatch-axis-color, #666)" stroke-width="1" />
		<line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH}
			stroke="var(--hatch-axis-color, #666)" stroke-width="1" />
		<text x={margin.left + plotW / 2} y={margin.top + plotH + 35} text-anchor="middle"
			fill="var(--hatch-axis-label, #aaa)" font-size="12">{xName}</text>
		<text x={margin.left - 35} y={margin.top + plotH / 2} text-anchor="middle"
			fill="var(--hatch-axis-label, #aaa)" font-size="12"
			transform="rotate(-90, {margin.left - 35}, {margin.top + plotH / 2})">{yName}</text>

		<!-- Event count -->
		<text x={margin.left + plotW - 4} y={margin.top + 14} text-anchor="end"
			fill="var(--hatch-axis-text, #666)" font-size="9">n={events.length.toLocaleString()}</text>
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-flow {
		display: inline-block;
	}
</style>
