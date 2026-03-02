<script lang="ts">
	import type { GelBand, StainType } from '../../types/index.js';
	import { stainColors } from '../../util/colors.js';

	interface Props {
		band: GelBand;
		x: number;
		laneWidth: number;
		stain: StainType;
		bandStyle: 'realistic' | 'simple';
		gelHeight?: number;
		isLadder?: boolean;
		onmouseenter?: (e: MouseEvent) => void;
		onmouseleave?: (e: MouseEvent) => void;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		band,
		x,
		laneWidth,
		stain,
		bandStyle = 'realistic',
		gelHeight = 500,
		isLadder = false,
		onmouseenter,
		onmouseleave,
		onclick,
	}: Props = $props();

	let colors = $derived(stainColors[stain]);

	/** Band width proportional to intensity; ladder bands are thinner.
	 *  Clamped to max 60px and min 4px for consistent readability. */
	let bandWidth = $derived.by(() => {
		const maxWidth = Math.min(isLadder ? laneWidth * 0.5 : laneWidth * 0.7, 60);
		return Math.max(maxWidth * band.intensity, 4);
	});

	/** Band thickness: inversely proportional to fragment size (smaller = thinner).
	 *  Clamp between 1.5 and 6 pixels. */
	let bandThickness = $derived.by(() => {
		const maxSize = 10000;
		const normalized = Math.min(band.size / maxSize, 1);
		const thickness = 2 + normalized * 4;
		return isLadder ? Math.max(thickness * 0.6, 1.5) : thickness;
	});

	let bandY = $derived(band.position * gelHeight);
	let bandX = $derived(x + (laneWidth - bandWidth) / 2);

	/** Opacity from intensity */
	let bandOpacity = $derived(0.4 + band.intensity * 0.6);
</script>

{#if bandStyle === 'realistic'}
	<!-- Glow layer (blurred, lower opacity) -->
	<rect
		x={bandX}
		y={bandY - bandThickness / 2}
		width={bandWidth}
		height={bandThickness}
		rx="1"
		ry="1"
		fill={colors.glow}
		fill-opacity={bandOpacity * 0.6}
		filter="url(#gel-band-glow)"
		class="gel-band"
		role="button"
		tabindex="0"
		{onmouseenter}
		{onmouseleave}
		{onclick}
		onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
	/>
	<!-- Sharp band on top -->
	<rect
		x={bandX}
		y={bandY - bandThickness / 2}
		width={bandWidth}
		height={bandThickness}
		rx="0.5"
		ry="0.5"
		fill={colors.band}
		fill-opacity={bandOpacity}
		class="gel-band"
		role="button"
		tabindex="0"
		{onmouseenter}
		{onmouseleave}
		{onclick}
		onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
	/>
{:else}
	<!-- Simple mode: single solid rectangle -->
	<rect
		x={bandX}
		y={bandY - bandThickness / 2}
		width={bandWidth}
		height={bandThickness}
		rx="0.5"
		ry="0.5"
		fill={colors.band}
		fill-opacity={bandOpacity}
		class="gel-band"
		role="button"
		tabindex="0"
		{onmouseenter}
		{onmouseleave}
		{onclick}
		onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
	/>
{/if}

<style>
	.gel-band {
		cursor: pointer;
		transition: filter 0.15s;
	}

	.gel-band:hover {
		filter: brightness(1.2);
	}
</style>
