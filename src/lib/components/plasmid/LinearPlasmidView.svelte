<script lang="ts">
	import type { Part, CutSite } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import { getFeatureColor } from '../../util/colors.js';
	import { bpToLinearX, linearArrowPath, formatBp, generateTicks, computeAnnotationLayers } from '../../util/coordinates.js';
	import type { HoverInfo } from '../../types/utility.js';

	interface Props {
		name: string;
		size: number;
		parts?: Part[];
		cutSites?: CutSite[];
		selectionState?: SelectionState;
		width?: number;
		height?: number;
		showLabels?: boolean;
		showTicks?: boolean;
		onpartclick?: (part: Part) => void;
		onselect?: (selection: { start: number; end: number }) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		name,
		size,
		parts = [],
		cutSites = [],
		selectionState,
		width = 500,
		height = 300,
		showLabels = true,
		showTicks = true,
		onpartclick,
		onselect,
		onhoverinfo,
	}: Props = $props();

	let svgElement: SVGSVGElement | undefined = $state(undefined);

	const MARGIN_LEFT = 30;
	const MARGIN_RIGHT = 30;
	const BACKBONE_Y_RATIO = 0.5;
	const PART_HEIGHT = 14;
	const PART_GAP = 3;

	let mapWidth = $derived(width - MARGIN_LEFT - MARGIN_RIGHT);
	let backboneY = $derived(height * BACKBONE_Y_RATIO);

	function toX(bp: number): number {
		return bpToLinearX(bp, size, mapWidth, MARGIN_LEFT);
	}

	/** Separate parts by strand for stacking above/below backbone */
	let posParts = $derived(parts.filter(p => p.strand === 1));
	let negParts = $derived(parts.filter(p => p.strand === -1));

	/** Part stacking for + strand (above backbone) */
	let posOffsets = $derived.by(() => {
		const intervals = posParts.map(p => ({ start: p.start, end: p.end }));
		return computeAnnotationLayers(intervals);
	});

	/** Part stacking for - strand (below backbone) */
	let negOffsets = $derived.by(() => {
		const intervals = negParts.map(p => ({ start: p.start, end: p.end }));
		return computeAnnotationLayers(intervals);
	});

	/** Tick marks */
	let ticks = $derived(generateTicks(size));

	let sizeLabel = $derived(formatBp(size));

	/** Max stack depth for cut site label placement */
	let maxPosLayer = $derived.by(() => {
		let max = 0;
		for (const v of posOffsets.values()) {
			if (v > max) max = v;
		}
		return max;
	});

	/** Y position above the part stack where cut site labels go */
	let cutSiteLabelY = $derived(
		backboneY - 8 - (maxPosLayer + 1) * (PART_HEIGHT + PART_GAP) - 8
	);

	/** Relaxed cut site label positions */
	let relaxedCutSiteLabels = $derived.by(() => {
		const labels = cutSites.map(site => ({
			x: toX(site.position),
			enzyme: site.enzyme,
		}));
		labels.sort((a, b) => a.x - b.x);
		const MIN_GAP = 40;
		for (let i = 1; i < labels.length; i++) {
			const gap = labels[i].x - labels[i - 1].x;
			if (gap < MIN_GAP) {
				const shift = (MIN_GAP - gap) / 2;
				labels[i - 1].x -= shift;
				labels[i].x += shift;
			}
		}
		return labels;
	});

	function handlePartMouseEnter(e: MouseEvent, part: Part) {
		const bpLen = ((part.end - part.start + size) % size) || size;
		onhoverinfo?.({
			title: part.name,
			items: [
				{ label: 'Type', value: part.type },
				{ label: 'Location', value: `${part.start}..${part.end}` },
				{ label: 'Strand', value: part.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				{ label: 'Length', value: bpLen, unit: 'bp' },
				...(part.tm !== undefined ? [{ label: 'Tm', value: part.tm.toFixed(1), unit: '°C' }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleCutSiteMouseEnter(e: MouseEvent, site: CutSite) {
		onhoverinfo?.({
			title: site.enzyme,
			items: [
				{ label: 'Position', value: site.position, unit: 'bp' },
				{ label: 'Strand', value: site.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				...(site.overhang ? [{ label: 'Overhang', value: site.overhang }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleMouseLeave() {
		onhoverinfo?.(null);
	}

	function handlePartClick(part: Part) {
		onpartclick?.(part);
		if (selectionState) {
			selectionState.setSelection(part.start, part.end);
			onselect?.({ start: part.start, end: part.end });
		}
	}

	/** Minimum SVG width to enable scrolling for large sequences */
	let svgWidth = $derived(Math.max(width, mapWidth + MARGIN_LEFT + MARGIN_RIGHT));

	// Selection overlay
	let selectionRange = $derived(selectionState?.range ?? null);
</script>

<div class="linear-plasmid-scroll" style:width="{width}px" style:height="{height}px" style:position="relative">
<svg bind:this={svgElement} width={svgWidth} {height} viewBox="0 0 {svgWidth} {height}" xmlns="http://www.w3.org/2000/svg" class="linear-plasmid">
	<!-- Selection overlay bar -->
	{#if selectionRange}
		{@const selX1 = toX(selectionRange.start)}
		{@const selX2 = toX(selectionRange.end)}
		<rect
			x={selX1}
			y={backboneY - 30}
			width={selX2 - selX1}
			height={60}
			fill="var(--hatch-selection-fill, rgba(0, 130, 250, 0.3))"
			rx="2"
		/>
	{/if}

	<!-- Backbone bar -->
	<line
		x1={MARGIN_LEFT}
		y1={backboneY}
		x2={MARGIN_LEFT + mapWidth}
		y2={backboneY}
		stroke="var(--hatch-ring-color, #4a5a6a)"
		stroke-width="3"
		stroke-linecap="round"
	/>

	<!-- Tick marks + scale below backbone -->
	{#if showTicks}
		{#each ticks as tick}
			{@const x = toX(tick.position)}
			<line
				x1={x}
				y1={backboneY + 4}
				x2={x}
				y2={backboneY + (tick.major ? 12 : 7)}
				stroke={tick.major ? 'var(--hatch-tick-major, #5a6a7a)' : 'var(--hatch-tick-minor, #3a4858)'}
				stroke-width={tick.major ? 1 : 0.5}
			/>
			{#if tick.major && tick.label}
				<text
					x={x}
					y={backboneY + 22}
					text-anchor="middle"
					class="tick-label"
				>{tick.label}</text>
			{/if}
		{/each}
	{/if}

	<!-- Parts above backbone (+ strand) as directed arrows -->
	{#each posParts as part, i}
		{@const layer = posOffsets.get(i) ?? 0}
		{@const yBase = backboneY - 8 - layer * (PART_HEIGHT + PART_GAP)}
		{@const color = getFeatureColor(part.type, part.color)}
		<g
			class="linear-part"
			onmouseenter={(e) => handlePartMouseEnter(e, part)}
			onmouseleave={handleMouseLeave}
			onclick={() => handlePartClick(part)}
		>
			<path
				d={linearArrowPath(part.start, part.end, size, mapWidth, MARGIN_LEFT, yBase, PART_HEIGHT, 1)}
				fill={color}
				stroke="#000"
				stroke-width="0.5"
			/>
			{#if showLabels}
				{@const fx1 = toX(part.start)}
				{@const fx2 = toX(part.end)}
				{#if fx2 - fx1 > 40}
					<text
						x={(fx1 + fx2) / 2}
						y={yBase + 1}
						text-anchor="middle"
						dominant-baseline="central"
						class="part-label"
					>{part.label ?? part.name}</text>
				{/if}
			{/if}
		</g>
	{/each}

	<!-- Parts below backbone (- strand) as directed arrows -->
	{#each negParts as part, i}
		{@const layer = negOffsets.get(i) ?? 0}
		{@const yBase = backboneY + 8 + layer * (PART_HEIGHT + PART_GAP)}
		{@const color = getFeatureColor(part.type, part.color)}
		<g
			class="linear-part"
			onmouseenter={(e) => handlePartMouseEnter(e, part)}
			onmouseleave={handleMouseLeave}
			onclick={() => handlePartClick(part)}
		>
			<path
				d={linearArrowPath(part.start, part.end, size, mapWidth, MARGIN_LEFT, yBase, PART_HEIGHT, -1)}
				fill={color}
				stroke="#000"
				stroke-width="0.5"
			/>
			{#if showLabels}
				{@const fx1 = toX(part.start)}
				{@const fx2 = toX(part.end)}
				{#if fx2 - fx1 > 40}
					<text
						x={(fx1 + fx2) / 2}
						y={yBase + 1}
						text-anchor="middle"
						dominant-baseline="central"
						class="part-label"
					>{part.label ?? part.name}</text>
				{/if}
			{/if}
		</g>
	{/each}

	<!-- Cut site marks — small filled triangles pointing down at backbone -->
	{#each cutSites as site, i}
		{@const markX = toX(site.position)}
		<g
			class="cut-site-marker"
			onmouseenter={(e) => handleCutSiteMouseEnter(e, site)}
			onmouseleave={handleMouseLeave}
		>
			<polygon
				points="{markX - 3},{backboneY - 8} {markX + 3},{backboneY - 8} {markX},{backboneY - 1}"
				fill="var(--hatch-cut-site-marker, #1a1a2e)"
				stroke="none"
			/>
		</g>
	{/each}

	<!-- Cut site labels (relaxed, above part stack) -->
	{#each relaxedCutSiteLabels as lbl, i}
		{@const markX = toX(cutSites[i].position)}
		<!-- Thin connector from label to mark -->
		<line
			x1={lbl.x}
			y1={cutSiteLabelY + 8}
			x2={markX}
			y2={backboneY - 8}
			stroke="var(--hatch-label-connector, #4a5568)"
			stroke-width="0.5"
			stroke-opacity="0.35"
		/>
		<!-- Enzyme label -->
		<text
			x={lbl.x}
			y={cutSiteLabelY}
			text-anchor="middle"
			class="cut-site-label"
		>{lbl.enzyme}</text>
	{/each}

	<!-- Title -->
	<text
		x={MARGIN_LEFT}
		y={16}
		class="title"
	>{name}</text>
	<text
		x={MARGIN_LEFT + mapWidth}
		y={16}
		text-anchor="end"
		class="size-label"
	>{sizeLabel} bp  linear</text>
</svg>
</div>

<style>
	.linear-plasmid-scroll {
		overflow-x: auto;
		overflow-y: hidden;
	}

	.linear-plasmid {
		background: var(--hatch-bg, #0c1018);
		border-radius: 8px;
	}

	.tick-label {
		font-size: 8px;
		fill: var(--hatch-axis-text, #7a8898);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
	}

	.part-label {
		font-size: 9px;
		fill: var(--hatch-annotation-text, #fff);
		font-family: var(--hatch-font, -apple-system, sans-serif);
		font-weight: 600;
		pointer-events: none;
	}

	.cut-site-label {
		font-size: 8px;
		fill: var(--hatch-cut-site, #d45858);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
	}

	.cut-site-marker {
		cursor: pointer;
	}

	.linear-part {
		cursor: pointer;
	}

	.linear-part:hover path {
		stroke: #fff;
		stroke-width: 1.5;
	}

	.title {
		font-size: 14px;
		font-weight: 700;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.size-label {
		font-size: 11px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
</style>
