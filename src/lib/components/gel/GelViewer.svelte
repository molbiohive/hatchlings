<script lang="ts">
	import type { GelLane, GelBand, GelType, StainType } from '../../types/index.js';
	import { stainColors } from '../../util/colors.js';
	import { Tooltip } from '../shared/index.js';
	import GelLaneComponent from './GelLane.svelte';
	import GelLadder from './GelLadder.svelte';

	interface Props {
		lanes: GelLane[];
		gelType?: GelType;
		stain?: StainType;
		width?: number;
		height?: number;
		showSizeLabels?: boolean;
		showLaneLabels?: boolean;
		bandStyle?: 'realistic' | 'simple';
		onbandclick?: (lane: GelLane, band: GelBand) => void;
	}

	let {
		lanes,
		gelType = 'agarose',
		stain = 'ethidium',
		width = 400,
		height = 500,
		showSizeLabels = true,
		showLaneLabels = true,
		bandStyle = 'realistic',
		onbandclick,
	}: Props = $props();

	let svgEl: SVGSVGElement | undefined = $state(undefined);

	let colors = $derived(stainColors[stain]);

	/** Whether background is dark (affects label/well rendering) */
	let isDarkBg = $derived(
		stain === 'ethidium' || stain === 'sybr-safe' || stain === 'sybr-gold'
	);

	/** Layout constants */
	const PADDING_X = 20;
	const WELL_TOP = 24;
	const WELL_HEIGHT = 6;
	const GEL_TOP = WELL_TOP + WELL_HEIGHT + 4;

	let gelHeight = $derived(height - GEL_TOP);
	let usableWidth = $derived(width - PADDING_X * 2);
	let laneWidth = $derived(usableWidth / Math.max(lanes.length, 1));

	/** Tooltip state */
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipBand: GelBand | null = $state(null);
	let tooltipLane: GelLane | null = $state(null);

	function handleBandEnter(lane: GelLane, band: GelBand, e: MouseEvent) {
		tooltipBand = band;
		tooltipLane = lane;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
		tooltipVisible = true;
	}

	function handleBandLeave() {
		tooltipVisible = false;
		tooltipBand = null;
		tooltipLane = null;
	}

	function handleBandClick(lane: GelLane, band: GelBand) {
		onbandclick?.(lane, band);
	}

	function formatSize(size: number): string {
		if (size >= 1000) {
			const kb = size / 1000;
			return kb === Math.floor(kb) ? `${kb} kb` : `${kb.toFixed(1)} kb`;
		}
		return `${size} bp`;
	}
</script>

<div class="gel-viewer" style:position="relative" style:display="inline-block">
	<svg
		bind:this={svgEl}
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Filter definitions for realistic band rendering -->
		<defs>
			<filter id="gel-band-glow" x="-50%" y="-100%" width="200%" height="300%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="3 1.5" result="blur" />
				<feComposite in="blur" in2="SourceGraphic" operator="over" />
			</filter>
		</defs>

		<!-- Gel background -->
		<rect
			x="0"
			y="0"
			{width}
			{height}
			fill={colors.background}
			rx="4"
			ry="4"
		/>

		<!-- Subtle gel texture gradient -->
		<defs>
			<linearGradient id="gel-texture" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={isDarkBg ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} />
				<stop offset="50%" stop-color="transparent" />
				<stop offset="100%" stop-color={isDarkBg ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.05)'} />
			</linearGradient>
		</defs>
		<rect x="0" y={GEL_TOP} {width} height={gelHeight} fill="url(#gel-texture)" />

		<!-- Wells at the top -->
		{#each lanes as lane, i}
			{@const laneX = PADDING_X + i * laneWidth}
			<rect
				x={laneX + laneWidth * 0.15}
				y={WELL_TOP}
				width={laneWidth * 0.7}
				height={WELL_HEIGHT}
				fill={isDarkBg ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'}
				rx="1"
				ry="1"
			/>
		{/each}

		<!-- Lanes -->
		{#each lanes as lane, i}
			{@const laneX = PADDING_X + i * laneWidth}
			{#if lane.isLadder}
				<GelLadder
					{lane}
					x={laneX}
					width={laneWidth}
					gelHeight={gelHeight}
					{stain}
					{bandStyle}
					showLaneLabel={showLaneLabels}
					onbandmouseenter={(band, e) => handleBandEnter(lane, band, e)}
					onbandmouseleave={() => handleBandLeave()}
					onbandclick={(band) => handleBandClick(lane, band)}
				/>
			{:else}
				<GelLaneComponent
					{lane}
					x={laneX}
					width={laneWidth}
					gelHeight={gelHeight}
					{stain}
					{bandStyle}
					showSizeLabels={showSizeLabels}
					showLaneLabel={showLaneLabels}
					onbandmouseenter={(band, e) => handleBandEnter(lane, band, e)}
					onbandmouseleave={() => handleBandLeave()}
					onbandclick={(band) => handleBandClick(lane, band)}
				/>
			{/if}
		{/each}
	</svg>

	<!-- Tooltip -->
	<Tooltip x={tooltipX} y={tooltipY} visible={tooltipVisible}>
		{#if tooltipBand && tooltipLane}
			<div class="band-info">
				<strong>{tooltipLane.label}</strong>
				{#if tooltipBand.name}
					<span class="band-name">{tooltipBand.name}</span>
				{/if}
				<span class="band-size">{formatSize(tooltipBand.size)}</span>
				<span class="band-intensity">Intensity: {(tooltipBand.intensity * 100).toFixed(0)}%</span>
			</div>
		{/if}
	</Tooltip>
</div>

<style>
	.gel-viewer {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.band-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.band-info strong {
		color: var(--hatch-text, #e0e0e0);
		font-size: 12px;
	}

	.band-name {
		color: var(--hatch-text-muted, #aaa);
		font-size: 11px;
	}

	.band-size {
		color: var(--hatch-highlight, #7dd3fc);
		font-size: 12px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.band-intensity {
		color: var(--hatch-axis-text, #888);
		font-size: 10px;
	}
</style>
