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

	/** Band width (horizontal): identical for ALL bands in a lane */
	let bandWidth = $derived(
		Math.min(isLadder ? laneWidth * 0.5 : laneWidth * 0.65, 60)
	);

	/** Band thickness (vertical): varies by intensity — more material = thicker */
	let bandThickness = $derived.by(() => {
		const minT = isLadder ? 1.5 : 2;
		const maxT = isLadder ? 4 : 7;
		return minT + band.intensity * (maxT - minT);
	});

	let bandY = $derived(band.position * gelHeight);
	let bandX = $derived(x + (laneWidth - bandWidth) / 2);

	/** Opacity from intensity */
	let bandOpacity = $derived(0.4 + band.intensity * 0.6);
</script>

{#if bandStyle === 'realistic'}
	<!-- Glow layer (blurred, lower opacity) — no events, visual only -->
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
		pointer-events="none"
	/>
	<!-- Sharp band on top — receives all events -->
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
		onmouseover={onmouseenter}
		onmouseout={onmouseleave}
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
		onmouseover={onmouseenter}
		onmouseout={onmouseleave}
		{onclick}
		onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
	/>
{/if}

<style>
	.gel-band {
		cursor: pointer;
		transition: filter 0.15s;
		outline: none;
	}

	.gel-band:hover {
		filter: brightness(1.2);
	}
</style>
