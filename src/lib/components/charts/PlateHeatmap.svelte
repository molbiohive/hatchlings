<script lang="ts">
	import type { PlateData, Well, PlateFormat } from '../../types/index.js';
	import { interpolateColor } from '../../util/colors.js';
	import Tooltip from '../shared/Tooltip.svelte';

	interface Props {
		format: PlateFormat;
		wells: Well[];
		zFactor?: number;
		title?: string;
		width?: number;
		height?: number;
		colorScale?: 'viridis' | 'plasma' | 'blues' | 'reds' | 'diverging';
		showLabels?: boolean;
		onwellclick?: (well: Well) => void;
	}

	let {
		format = 96,
		wells,
		zFactor,
		title = '',
		width = 500,
		height = 350,
		colorScale = 'viridis',
		showLabels = true,
		onwellclick,
	}: Props = $props();

	const plateLayouts: Record<PlateFormat, { rows: number; cols: number }> = {
		6: { rows: 2, cols: 3 },
		12: { rows: 3, cols: 4 },
		24: { rows: 4, cols: 6 },
		48: { rows: 6, cols: 8 },
		96: { rows: 8, cols: 12 },
		384: { rows: 16, cols: 24 },
		1536: { rows: 32, cols: 48 },
	};

	const layout = $derived(plateLayouts[format]);
	const margin = { top: 50, right: 20, bottom: 20, left: 40 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);
	const cellW = $derived(plotW / layout.cols);
	const cellH = $derived(plotH / layout.rows);
	const wellR = $derived(Math.min(cellW, cellH) * 0.4);

	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });
	let svgEl: SVGSVGElement | undefined = $state();

	const wellMap = $derived.by(() => {
		const map = new Map<string, Well>();
		wells.forEach(w => map.set(w.id, w));
		return map;
	});

	const valueRange = $derived.by(() => {
		const vals = wells.map(w => w.value).filter(v => v != null);
		return { min: Math.min(...vals), max: Math.max(...vals) };
	});

	function wellId(row: number, col: number): string {
		return String.fromCharCode(65 + row) + (col + 1);
	}

	function wellColor(well: Well | undefined): string {
		if (!well) return 'var(--hatch-empty-well, #2a2a3e)';
		const { min, max } = valueRange;
		return interpolateColor(well.value, min, max, colorScale);
	}
</script>

<div class="hatch-plate-heatmap" style:position="relative">
	<svg bind:this={svgEl} {width} {height}>
		<!-- Title -->
		{#if title}
			<text x={width / 2} y="18" text-anchor="middle" fill="var(--hatch-title-color, #ddd)" font-size="14" font-weight="600">{title}</text>
		{/if}

		<!-- Z-factor badge -->
		{#if zFactor != null}
			<text x={width - margin.right} y="18" text-anchor="end" fill={zFactor >= 0.5 ? 'var(--hatch-positive, #4daf4a)' : zFactor >= 0 ? 'var(--hatch-warning, #ff7f00)' : 'var(--hatch-negative, #e41a1c)'} font-size="11">
				Z' = {zFactor.toFixed(3)}
			</text>
		{/if}

		<!-- Plate border -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plate-bg, #111122)" stroke="var(--hatch-plate-border, #333)" stroke-width="1" rx="4" />

		<!-- Column headers -->
		{#each Array.from({length: layout.cols}, (_, i) => i) as col}
			<text
				x={margin.left + col * cellW + cellW / 2}
				y={margin.top - 6}
				text-anchor="middle"
				fill="var(--hatch-axis-text, #888)"
				font-size={format >= 384 ? 7 : 10}
			>{col + 1}</text>
		{/each}

		<!-- Row headers -->
		{#each Array.from({length: layout.rows}, (_, i) => i) as row}
			<text
				x={margin.left - 8}
				y={margin.top + row * cellH + cellH / 2 + 3}
				text-anchor="end"
				fill="var(--hatch-axis-text, #888)"
				font-size={format >= 384 ? 7 : 10}
			>{String.fromCharCode(65 + row)}</text>
		{/each}

		<!-- Wells -->
		{#each Array.from({length: layout.rows}, (_, i) => i) as row}
			{#each Array.from({length: layout.cols}, (_, i) => i) as col}
				{@const id = wellId(row, col)}
				{@const well = wellMap.get(id)}
				<circle
					cx={margin.left + col * cellW + cellW / 2}
					cy={margin.top + row * cellH + cellH / 2}
					r={wellR}
					fill={wellColor(well)}
					stroke="var(--hatch-well-border, #333)"
					stroke-width="0.5"
					style="cursor: pointer"
					onmouseenter={(e) => {
						tooltip = {
							visible: true,
							x: e.clientX,
							y: e.clientY,
							text: well ? `${id}: ${well.value.toFixed(2)}${well.label ? ` (${well.label})` : ''}` : id,
						};
					}}
					onmouseleave={() => tooltip.visible = false}
					onclick={() => well && onwellclick?.(well)}
				/>
				{#if showLabels && format <= 48 && well?.label}
					<text
						x={margin.left + col * cellW + cellW / 2}
						y={margin.top + row * cellH + cellH / 2 + 3}
						text-anchor="middle"
						fill="var(--hatch-well-text, #fff)"
						font-size="8"
						pointer-events="none"
					>{well.label}</text>
				{/if}
			{/each}
		{/each}
	</svg>

	<Tooltip x={tooltip.x} y={tooltip.y} visible={tooltip.visible}>
		{tooltip.text}
	</Tooltip>
</div>

<style>
	.hatch-plate-heatmap {
		display: inline-block;
	}
</style>
