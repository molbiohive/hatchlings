<script lang="ts">
	import type { Well, PlateFormat, PlateData } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { interpolateColor } from '../../util/colors.js';
	import { hover } from '../../util/hover.js';

	interface Props {
		data?: PlateData;
		format?: PlateFormat;
		wells?: Well[];
		zFactor?: number;
		title?: string;
		width?: number;
		height?: number;
		colorScale?: 'viridis' | 'plasma' | 'blues' | 'reds' | 'diverging';
		showLabels?: boolean;
		onwellclick?: (well: Well) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		data,
		format: formatProp,
		wells: wellsProp,
		zFactor: zFactorProp,
		title: titleProp,
		width = 500,
		height = 350,
		colorScale = 'viridis',
		showLabels = true,
		onwellclick,
		onhoverinfo,
	}: Props = $props();

	const format = $derived(formatProp ?? data?.format ?? 96);
	const wells = $derived(wellsProp ?? data?.wells ?? []);
	const zFactor = $derived(zFactorProp ?? data?.zFactor);
	const title = $derived(titleProp ?? data?.title ?? '');

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
		if (!well) return 'var(--hatch-empty-well, #1e2a38)';
		const { min, max } = valueRange;
		return interpolateColor(well.value, min, max, colorScale);
	}
</script>

<div class="hatch-plate-heatmap" style:position="relative">
	<svg {width} {height}>
		<!-- Title -->
		{#if title}
			<text x={width / 2} y="18" text-anchor="middle" fill="var(--hatch-title-color, #d4dce6)" font-size="14" font-weight="600">{title}</text>
		{/if}

		<!-- Z-factor badge -->
		{#if zFactor != null}
			<text x={width - margin.right} y="18" text-anchor="end" fill={zFactor >= 0.5 ? 'var(--hatch-positive, #58b56a)' : zFactor >= 0 ? 'var(--hatch-warning, #d9953a)' : 'var(--hatch-negative, #d45858)'} font-size="11">
				Z' = {zFactor.toFixed(3)}
			</text>
		{/if}

		<!-- Plate border -->
		<rect x={margin.left} y={margin.top} width={plotW} height={plotH}
			fill="var(--hatch-plate-bg, #0c1018)" stroke="var(--hatch-plate-border, #2a3848)" stroke-width="1" rx="4" />

		<!-- Column headers -->
		{#each Array.from({length: layout.cols}, (_, i) => i) as col}
			<text
				x={margin.left + col * cellW + cellW / 2}
				y={margin.top - 6}
				text-anchor="middle"
				fill="var(--hatch-axis-text, #7a8898)"
				font-size={format >= 384 ? 7 : 10}
			>{col + 1}</text>
		{/each}

		<!-- Row headers -->
		{#each Array.from({length: layout.rows}, (_, i) => i) as row}
			<text
				x={margin.left - 8}
				y={margin.top + row * cellH + cellH / 2 + 3}
				text-anchor="end"
				fill="var(--hatch-axis-text, #7a8898)"
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
					stroke="var(--hatch-well-border, #2a3848)"
					stroke-width="0.5"
					style="cursor: pointer"
					role="button"
					tabindex="-1"
					use:hover={{
						over: (e) => onhoverinfo?.({ title: id, items: [...(well ? [{label: 'Value', value: well.value.toFixed(2)}, ...(well.group ? [{label: 'Group', value: well.group}] : [])] : [])], position: { x: e.clientX, y: e.clientY } }),
						out: () => onhoverinfo?.(null)
					}}
					onclick={() => well && onwellclick?.(well)}
					onkeydown={(e) => { if (e.key === 'Enter' && well) onwellclick?.(well); }}
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

</div>

<style>
	.hatch-plate-heatmap {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}
</style>
