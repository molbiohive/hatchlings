<script lang="ts">
	import type { CutSite, Part } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { getFeatureColor } from '../../util/colors.js';
	import { formatBp } from '../../util/coordinates.js';

	interface Props {
		/** Total sequence length in bp */
		length: number;
		/** Restriction enzyme cut sites */
		cutSites: CutSite[];
		/** Optional feature annotations to display as colored blocks */
		features?: Part[];
		/** Width of the container */
		width?: number;
		/** Height of the SVG */
		height?: number;
		/** Zoom level (bindable) */
		zoom?: number;
		/** Hover info callback (tooltip) */
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		length,
		cutSites,
		features = [],
		width = 700,
		height = 200,
		zoom = $bindable(1),
		onhoverinfo,
	}: Props = $props();

	const MARGIN_LEFT = 40;
	const MARGIN_RIGHT = 20;
	const BACKBONE_Y = 100;
	const BACKBONE_WIDTH = $derived(width - MARGIN_LEFT - MARGIN_RIGHT);

	/** Scaled content width */
	let scaledWidth = $derived(BACKBONE_WIDTH * zoom + MARGIN_LEFT + MARGIN_RIGHT);

	function bpToX(bp: number): number {
		return MARGIN_LEFT + (bp / length) * BACKBONE_WIDTH * zoom;
	}

	/** All labels above backbone, skip overlapping ones */
	let cutSitePositions = $derived.by(() => {
		const sorted = [...cutSites].sort((a, b) => a.position - b.position);
		const positions: { site: CutSite; x: number; labelY: number; visible: boolean }[] = [];

		let lastLabelEnd = -Infinity;

		for (let i = 0; i < sorted.length; i++) {
			const x = bpToX(sorted[i].position);
			const labelWidth = sorted[i].enzyme.length * 7 + 10;
			const visible = x - labelWidth / 2 > lastLabelEnd;

			if (visible) {
				lastLabelEnd = x + labelWidth / 2;
			}

			positions.push({
				site: sorted[i],
				x,
				labelY: BACKBONE_Y - 30,
				visible,
			});
		}
		return positions;
	});

	/** Feature blocks on the backbone */
	let featureBlocks = $derived.by(() => {
		return features.map(f => ({
			feature: f,
			x: bpToX(f.start),
			w: bpToX(f.end) - bpToX(f.start),
			color: getFeatureColor(f.type, f.color),
		}));
	});

	/** Tick marks */
	let ticks = $derived.by(() => {
		let interval: number;
		if (length <= 1000) interval = 100;
		else if (length <= 5000) interval = 500;
		else if (length <= 20000) interval = 2000;
		else interval = 5000;

		const result: { x: number; label: string }[] = [];
		for (let bp = 0; bp <= length; bp += interval) {
			result.push({ x: bpToX(bp), label: formatBp(bp) });
		}
		return result;
	});

	/** Drag-to-pan state */
	let scrollWrapper: HTMLDivElement | undefined = $state(undefined);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartScrollX = $state(0);

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0 || !scrollWrapper) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartScrollX = scrollWrapper.scrollLeft;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !scrollWrapper) return;
		scrollWrapper.scrollLeft = dragStartScrollX - (e.clientX - dragStartX);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleCutSiteEnter(site: CutSite, e: MouseEvent) {
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

	function handleCutSiteLeave() {
		onhoverinfo?.(null);
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="restriction-map-container" style:width="{width}px">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="scroll-wrapper"
		class:dragging={isDragging}
		style:width="{width}px"
		role="application"
		aria-label="Restriction enzyme map"
		bind:this={scrollWrapper}
		onmousedown={handleMouseDown}
	>
		<svg
			width={scaledWidth}
			{height}
			class="hatch-restriction-map"
			role="img"
			aria-label="Restriction map"
		>
			<!-- Backbone line -->
			<line
				x1={bpToX(0)}
				y1={BACKBONE_Y}
				x2={bpToX(length)}
				y2={BACKBONE_Y}
				stroke="var(--hatch-ring-color, #4a5a6a)"
				stroke-width="3"
				stroke-linecap="round"
			/>

			<!-- Tick marks -->
			{#each ticks as tick}
				<line
					x1={tick.x}
					y1={BACKBONE_Y + 6}
					x2={tick.x}
					y2={BACKBONE_Y + 12}
					stroke="var(--hatch-tick-major, #5a6a7a)"
					stroke-width="1"
				/>
				<text
					x={tick.x}
					y={BACKBONE_Y + 24}
					text-anchor="middle"
					class="tick-label"
				>{tick.label}</text>
			{/each}

			<!-- Feature blocks -->
			{#each featureBlocks as fb}
				<rect
					x={fb.x}
					y={BACKBONE_Y - 8}
					width={Math.max(fb.w, 2)}
					height={16}
					fill={fb.color}
					fill-opacity="0.6"
					rx="2"
				/>
				{#if fb.w > 30}
					<text
						x={fb.x + fb.w / 2}
						y={BACKBONE_Y - 14}
						text-anchor="middle"
						class="feature-label"
					>{fb.feature.label ?? fb.feature.name}</text>
				{/if}
			{/each}

			<!-- Cut site markers -->
			{#each cutSitePositions as cs}
				<g
					class="cutsite-group"
					role="button"
					tabindex="-1"
					onmouseover={(e) => handleCutSiteEnter(cs.site, e)}
					onmouseout={handleCutSiteLeave}
					onfocus={(e) => handleCutSiteEnter(cs.site, e as unknown as MouseEvent)}
					onblur={handleCutSiteLeave}
				>
					<!-- Top snip triangle (pointing down) -->
					<path
						d="M {cs.x} {BACKBONE_Y - 2} L {cs.x - 3.5} {BACKBONE_Y - 8} L {cs.x + 3.5} {BACKBONE_Y - 8} Z"
						fill="var(--hatch-cutsite-color, #d45858)"
						fill-opacity="0.85"
					/>
					<!-- Bottom snip triangle (pointing up) -->
					<path
						d="M {cs.x} {BACKBONE_Y + 2} L {cs.x - 3.5} {BACKBONE_Y + 8} L {cs.x + 3.5} {BACKBONE_Y + 8} Z"
						fill="var(--hatch-cutsite-color, #d45858)"
						fill-opacity="0.85"
					/>
					<!-- Invisible wider hit area -->
					<rect
						x={cs.x - 6}
						y={BACKBONE_Y - 10}
						width={12}
						height={20}
						fill="transparent"
					/>

					{#if cs.visible}
						<!-- Connector line to label -->
						<line
							x1={cs.x}
							y1={BACKBONE_Y - 8}
							x2={cs.x}
							y2={cs.labelY + 8}
							stroke="var(--hatch-cutsite-color, #d45858)"
							stroke-width="0.8"
							stroke-opacity="0.4"
						/>

						<!-- Enzyme name -->
						<text
							x={cs.x}
							y={cs.labelY}
							text-anchor="middle"
							class="enzyme-label"
						>{cs.site.enzyme}</text>

						<!-- Position -->
						<text
							x={cs.x}
							y={cs.labelY - 11}
							text-anchor="middle"
							class="position-label"
						>{cs.site.position}</text>
					{/if}
				</g>
			{/each}
		</svg>
	</div>
</div>

<style>
	.restriction-map-container {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.scroll-wrapper {
		overflow-x: auto;
		overflow-y: hidden;
		border-radius: 6px;
		background: var(--hatch-bg, #0c1018);
		cursor: grab;
	}

	.scroll-wrapper.dragging {
		cursor: grabbing;
	}

	.hatch-restriction-map {
		display: block;
	}

	.tick-label {
		font-size: 9px;
		fill: var(--hatch-axis-text, #7a8898);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.enzyme-label {
		font-size: 10px;
		font-weight: 600;
		fill: var(--hatch-cutsite-text, #d45858);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.position-label {
		font-size: 8px;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.feature-label {
		font-size: 9px;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font, -apple-system, sans-serif);
	}

	.cutsite-group {
		cursor: pointer;
		outline: none;
	}

	.cutsite-group:hover .enzyme-label {
		font-weight: 800;
	}
</style>
