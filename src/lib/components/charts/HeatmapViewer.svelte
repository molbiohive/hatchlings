<script lang="ts">
	import type { HoverInfo } from '../../types/utility.js';
	import { interpolateColor, type colorScales } from '../../util/colors.js';
	import { hover } from '../../util/hover.js';

	interface Props {
		rows: string[];
		cols: string[];
		values: number[][];
		colorScale?: keyof typeof colorScales;
		width?: number;
		height?: number;
		showLabels?: boolean;
		cellBorder?: boolean;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		rows,
		cols,
		values,
		colorScale = 'viridis',
		width = 500,
		height = 400,
		showLabels = true,
		cellBorder = true,
		onhoverinfo,
	}: Props = $props();

	const margin = { top: 60, right: 20, bottom: 20, left: 80 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);
	const cellW = $derived(plotW / Math.max(cols.length, 1));
	const cellH = $derived(plotH / Math.max(rows.length, 1));

	const barW = 12;
	const barH = $derived(Math.min(plotH, 150));
	const barX = $derived(width - margin.right - barW - 2);
	const barY = margin.top;

	const valRange = $derived.by(() => {
		const flat = values.flat();
		return { min: Math.min(...flat), max: Math.max(...flat) };
	});

	function cellColor(val: number): string {
		const { min, max } = valRange;
		return interpolateColor(val, min, max, colorScale);
	}
</script>

<div class="hatch-heatmap" style:position="relative">
	<svg {width} {height}>
		<!-- Column headers -->
		{#if showLabels}
			{#each cols as col, ci}
				<text
					x={margin.left + ci * cellW + cellW / 2}
					y={margin.top - 8}
					text-anchor="end"
					fill="var(--hatch-axis-text, #7a8898)"
					font-size={cols.length > 30 ? 6 : 9}
					transform="rotate(-45, {margin.left + ci * cellW + cellW / 2}, {margin.top - 8})"
				>{col}</text>
			{/each}
		{/if}

		<!-- Row headers -->
		{#if showLabels}
			{#each rows as row, ri}
				<text
					x={margin.left - 6}
					y={margin.top + ri * cellH + cellH / 2 + 3}
					text-anchor="end"
					fill="var(--hatch-axis-text, #7a8898)"
					font-size={rows.length > 30 ? 6 : 9}
				>{row}</text>
			{/each}
		{/if}

		<!-- Cells -->
		{#each rows as _row, ri}
			{#each cols as _col, ci}
				{@const val = values[ri]?.[ci] ?? 0}
				<rect
					x={margin.left + ci * cellW}
					y={margin.top + ri * cellH}
					width={cellW}
					height={cellH}
					fill={cellColor(val)}
					stroke={cellBorder ? 'var(--hatch-plot-bg, #141c26)' : 'none'}
					stroke-width="0.5"
					use:hover={{
						over: (e) => onhoverinfo?.({ title: `${rows[ri]} × ${cols[ci]}`, items: [{label: 'Value', value: val.toFixed(2)}], position: { x: e.clientX, y: e.clientY } }),
						out: () => onhoverinfo?.(null)
					}}
					style="cursor: crosshair"
				/>
			{/each}
		{/each}

		<!-- Color scale bar -->
		{#each Array.from({length: 20}, (_, i) => i) as i}
			{@const frac = i / 19}
			{@const val = valRange.min + frac * (valRange.max - valRange.min)}
			<rect
				x={barX}
				y={barY + barH - (i + 1) * (barH / 20)}
				width={barW}
				height={barH / 20 + 0.5}
				fill={cellColor(val)}
			/>
		{/each}
		<text x={barX + barW + 3} y={barY + 8} fill="var(--hatch-axis-text, #7a8898)" font-size="8">{valRange.max.toFixed(1)}</text>
		<text x={barX + barW + 3} y={barY + barH} fill="var(--hatch-axis-text, #7a8898)" font-size="8">{valRange.min.toFixed(1)}</text>
	</svg>

</div>

<style>
	.hatch-heatmap {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}
</style>
