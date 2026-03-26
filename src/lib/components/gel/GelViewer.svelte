<script lang="ts">
	import type { GelLane, GelBand, GelType, StainType, GelData } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { stainColors } from '../../util/colors.js';
	import GelLaneComponent from './GelLane.svelte';
	import GelLadder from './GelLadder.svelte';

	interface Props {
		data?: GelData;
		lanes?: GelLane[];
		gelType?: GelType;
		stain?: StainType;
		width?: number;
		height?: number;
		showSizeLabels?: boolean;
		showLaneLabels?: boolean;
		bandStyle?: 'realistic' | 'simple';
		voltage?: string;
		runTime?: string;
		onbandclick?: (lane: GelLane, band: GelBand) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		data,
		lanes: lanesProp,
		gelType: gelTypeProp,
		stain: stainProp,
		width = 400,
		height = 500,
		showSizeLabels = true,
		showLaneLabels = true,
		bandStyle = 'realistic',
		voltage,
		runTime,
		onbandclick,
		onhoverinfo,
	}: Props = $props();

	const lanes = $derived(lanesProp ?? data?.lanes ?? []);
	const gelType = $derived(gelTypeProp ?? data?.gelType ?? 'agarose');
	const stain = $derived(stainProp ?? data?.stain ?? 'ethidium');


	let colors = $derived(stainColors[stain]);

	/** Whether background is dark (affects label/well rendering) */
	let isDarkBg = $derived(
		stain === 'ethidium' || stain === 'sybr-safe' || stain === 'sybr-gold'
	);

	/** Layout constants */
	const PADDING_X = 20;
	const WELL_TOP = 36;
	const WELL_HEIGHT = 6;
	const GEL_TOP = WELL_TOP + WELL_HEIGHT + 4;

	let gelHeight = $derived(height - GEL_TOP);
	let usableWidth = $derived(width - PADDING_X * 2);
	let laneWidth = $derived(usableWidth / Math.max(lanes.length, 1));

	function handleBandEnter(lane: GelLane, band: GelBand, e: MouseEvent) {
		onhoverinfo?.({
			title: lane.label ?? 'Band',
			items: [
				...(band.name ? [{ label: 'Name', value: band.name }] : []),
				{ label: 'Size', value: formatSize(band.size) },
				{ label: 'Intensity', value: `${(band.intensity * 100).toFixed(0)}%` },
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleBandLeave() {
		onhoverinfo?.(null);
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
					gelTop={GEL_TOP}
					gelHeight={gelHeight}
					{stain}
					{bandStyle}
					{showSizeLabels}
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
					gelTop={GEL_TOP}
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

	{#if gelType || voltage || runTime}
		<div class="gel-conditions">
			{#if gelType}<span>{gelType === 'agarose' ? 'Agarose' : gelType === 'sds-page' ? 'SDS-PAGE' : 'Native PAGE'}</span>{/if}
			{#if voltage}<span>{voltage}</span>{/if}
			{#if runTime}<span>{runTime}</span>{/if}
		</div>
	{/if}
</div>

<style>
	.gel-viewer {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.gel-conditions {
		display: flex;
		gap: 4px;
		justify-content: center;
		padding: 4px 0;
		font-size: 10px;
		color: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.gel-conditions span + span::before {
		content: '\00b7';
		margin-right: 4px;
	}
</style>
