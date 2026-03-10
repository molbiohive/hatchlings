<script lang="ts">
	import type { GelLane, GelBand, StainType } from '../../types/index.js';
	import GelLaneComponent from './GelLane.svelte';

	interface Props {
		lane: GelLane;
		x: number;
		width: number;
		gelHeight: number;
		stain: StainType;
		bandStyle?: 'realistic' | 'simple';
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
		showSizeLabels = true,
		showLaneLabel = true,
		onbandmouseenter,
		onbandmouseleave,
		onbandclick,
	}: Props = $props();
</script>

<GelLaneComponent
	{lane}
	{x}
	{width}
	{gelHeight}
	{stain}
	{bandStyle}
	{showSizeLabels}
	{showLaneLabel}
	{onbandmouseenter}
	{onbandmouseleave}
	{onbandclick}
/>
