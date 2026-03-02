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
	showSizeLabels={true}
	{showLaneLabel}
	{onbandmouseenter}
	{onbandmouseleave}
	{onbandclick}
/>
