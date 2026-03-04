<script lang="ts">
	import type { CutSite, Part } from '../../types/index.js';
	import { getFeatureColor } from '../../util/colors.js';
	import { formatBp } from '../../util/coordinates.js';

	interface Props {
		/** Total sequence length in bp */
		length: number;
		/** Restriction enzyme cut sites */
		cutSites: CutSite[];
		/** Optional feature annotations to display as colored blocks */
		features?: Part[];
		/** Width of the SVG */
		width?: number;
		/** Height of the SVG */
		height?: number;
	}

	let {
		length,
		cutSites,
		features = [],
		width = 700,
		height = 200,
	}: Props = $props();

	const MARGIN_LEFT = 40;
	const MARGIN_RIGHT = 20;
	const BACKBONE_Y = 100;
	const BACKBONE_WIDTH = $derived(width - MARGIN_LEFT - MARGIN_RIGHT);

	/** Zoom and pan state */
	let currentZoom = $state(1);
	let currentPanX = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let panStartX = $state(0);

	function bpToX(bp: number): number {
		return MARGIN_LEFT + (bp / length) * BACKBONE_WIDTH;
	}

	/** Stagger overlapping cut site labels above/below */
	let cutSitePositions = $derived.by(() => {
		const sorted = [...cutSites].sort((a, b) => a.position - b.position);
		const positions: { site: CutSite; x: number; above: boolean; labelY: number }[] = [];

		for (let i = 0; i < sorted.length; i++) {
			const x = bpToX(sorted[i].position);
			// Alternate above/below, but also check proximity
			let above = i % 2 === 0;
			if (i > 0) {
				const prevX = bpToX(sorted[i - 1].position);
				if (Math.abs(x - prevX) < 40) {
					above = !positions[i - 1].above;
				}
			}

			positions.push({
				site: sorted[i],
				x,
				above,
				labelY: above ? BACKBONE_Y - 30 : BACKBONE_Y + 35,
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

	/** Pan / zoom handlers */
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		panStartX = currentPanX;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		currentPanX = panStartX + (e.clientX - dragStartX);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	/** Tooltip state for cut site hover */
	let hoveredSite: CutSite | null = $state(null);
	let hoverX = $state(0);
	let hoverY = $state(0);
</script>

<div class="restriction-map-container" style:width="{width}px">
	<svg
		{width}
		{height}
		class="hatch-restriction-map"
		role="img"
		aria-label="Restriction map"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		<g transform="translate({currentPanX}, 0) scale({currentZoom}, 1)">
			<!-- Backbone line -->
			<line
				x1={MARGIN_LEFT}
				y1={BACKBONE_Y}
				x2={MARGIN_LEFT + BACKBONE_WIDTH}
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

			<!-- Cut site markers (OVE-style snip triangles) -->
			{#each cutSitePositions as cs}
				<!-- Top snip triangle (pointing down) -->
				<path
					d="M {cs.x} {BACKBONE_Y - 2} L {cs.x - 3.5} {BACKBONE_Y - 8} L {cs.x + 3.5} {BACKBONE_Y - 8} Z"
					fill="var(--hatch-cutsite-color, #d45858)"
					fill-opacity="0.85"
					onmouseenter={(e) => { hoveredSite = cs.site; hoverX = cs.x; hoverY = cs.above ? BACKBONE_Y - 45 : BACKBONE_Y + 50; }}
					onmouseleave={() => { hoveredSite = null; }}
				/>
				<!-- Bottom snip triangle (pointing up) -->
				<path
					d="M {cs.x} {BACKBONE_Y + 2} L {cs.x - 3.5} {BACKBONE_Y + 8} L {cs.x + 3.5} {BACKBONE_Y + 8} Z"
					fill="var(--hatch-cutsite-color, #d45858)"
					fill-opacity="0.85"
				/>

				<!-- Connector line to label -->
				<line
					x1={cs.x}
					y1={cs.above ? BACKBONE_Y - 8 : BACKBONE_Y + 8}
					x2={cs.x}
					y2={cs.labelY + (cs.above ? 8 : -8)}
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
					y={cs.labelY + (cs.above ? -11 : 12)}
					text-anchor="middle"
					class="position-label"
				>{cs.site.position}</text>
			{/each}
		</g>

		<!-- Hover tooltip for recognition sequence -->
		{#if hoveredSite}
			<g transform="translate({hoverX + currentPanX}, {hoverY})">
				<rect
					x={-40}
					y={-10}
					width={80}
					height={20}
					fill="var(--hatch-bg, #0c1018)"
					stroke="var(--hatch-border, #2a3848)"
					rx="3"
				/>
				<text
					x={0}
					y={4}
					text-anchor="middle"
					class="hover-label"
				>{hoveredSite.enzyme} @ {hoveredSite.position}</text>
			</g>
		{/if}
	</svg>

	<!-- Zoom slider -->
	<div class="zoom-controls">
		<label class="zoom-label">
			Zoom
			<input
				type="range"
				min="0.5"
				max="5"
				step="0.1"
				bind:value={currentZoom}
			/>
			<span class="zoom-value">{currentZoom.toFixed(1)}x</span>
		</label>
	</div>
</div>

<style>
	.restriction-map-container {
		display: flex;
		flex-direction: column;
	}

	.hatch-restriction-map {
		background: var(--hatch-bg, #0c1018);
		border-radius: 6px;
		cursor: grab;
		overflow: hidden;
	}

	.hatch-restriction-map:active {
		cursor: grabbing;
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

	.hover-label {
		font-size: 9px;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.zoom-controls {
		padding: 6px 8px;
		display: flex;
		align-items: center;
	}

	.zoom-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.zoom-label input[type='range'] {
		width: 80px;
		accent-color: var(--hatch-highlight, #6ab8e0);
	}

	.zoom-value {
		font-size: 10px;
		color: var(--hatch-highlight, #6ab8e0);
		min-width: 30px;
	}
</style>
