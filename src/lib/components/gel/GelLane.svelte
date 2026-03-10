<script lang="ts">
	import type { GelLane, GelBand, StainType } from '../../types/index.js';
	import { stainColors } from '../../util/colors.js';
	import GelBandComponent from './GelBand.svelte';

	interface Props {
		lane: GelLane;
		x: number;
		width: number;
		gelHeight: number;
		stain: StainType;
		bandStyle: 'realistic' | 'simple';
		showSizeLabels?: boolean;
		showLaneLabel?: boolean;
		onbandmouseenter?: (band: GelBand, e: MouseEvent) => void;
		onbandmouseleave?: (band: GelBand, e: MouseEvent) => void;
		onbandclick?: (band: GelBand, e: MouseEvent) => void;
	}

	let {
		lane,
		x,
		width,
		gelHeight,
		stain,
		bandStyle = 'realistic',
		showSizeLabels = false,
		showLaneLabel = true,
		onbandmouseenter,
		onbandmouseleave,
		onbandclick,
	}: Props = $props();

	let colors = $derived(stainColors[stain]);
	let isLadder = $derived(lane.isLadder ?? false);
	let shouldShowLabels = $derived(showSizeLabels);

	/** Determine whether background is light or dark for label contrast */
	let isDarkBg = $derived(
		stain === 'ethidium' || stain === 'sybr-safe' || stain === 'sybr-gold'
	);
	let labelColor = $derived(isDarkBg ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)');
	let laneLabelColor = $derived(isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)');

	/** Truncate lane name to fit within lane width */
	let maxChars = $derived(Math.max(3, Math.floor(width / 6)));
	let displayLabel = $derived.by(() => {
		const label = lane.label;
		if (label.length <= maxChars) return label;
		return label.slice(0, maxChars - 1) + '\u2026';
	});
	let labelFontSize = $derived(width < 50 ? '8' : '10');

	function formatSize(size: number): string {
		if (size >= 1000) {
			const kb = size / 1000;
			return kb === Math.floor(kb) ? `${kb}kb` : `${kb.toFixed(1)}kb`;
		}
		return `${size}bp`;
	}
</script>

<g class="gel-lane">
	<!-- Faint lane guide line -->
	<line
		x1={x + width / 2}
		y1={30}
		x2={x + width / 2}
		y2={gelHeight}
		stroke={isDarkBg ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
		stroke-width="1"
	/>

	<!-- Lane label at top (truncated with tooltip) -->
	{#if showLaneLabel}
		<text
			x={x + width / 2}
			y={16}
			text-anchor="middle"
			fill={laneLabelColor}
			font-size={labelFontSize}
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>
			{displayLabel}
			<title>{lane.label}</title>
		</text>
	{/if}

	<!-- Bands -->
	{#each lane.bands as band (band.size + '-' + band.position)}
		<GelBandComponent
			{band}
			{x}
			laneWidth={width}
			{stain}
			{bandStyle}
			{gelHeight}
			isLadder={isLadder}
			onmouseenter={(e) => onbandmouseenter?.(band, e)}
			onmouseleave={(e) => onbandmouseleave?.(band, e)}
			onclick={(e) => onbandclick?.(band, e)}
		/>

		<!-- Size labels (centered above band) -->
		{#if shouldShowLabels}
			<text
				x={x + width / 2}
				y={band.position * gelHeight - 4}
				text-anchor="middle"
				fill={labelColor}
				font-size="8"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
			>
				{formatSize(band.size)}
			</text>
		{/if}
	{/each}
</g>
