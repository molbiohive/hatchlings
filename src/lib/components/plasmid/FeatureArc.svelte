<script lang="ts">
	import type { Feature } from '../../types/index.js';
	import { arrowArcPath } from '../../util/coordinates.js';
	import { getFeatureColor } from '../../util/colors.js';

	interface Props {
		feature: Feature;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
		width?: number;
		selected?: boolean;
		onmouseenter?: (e: MouseEvent) => void;
		onmouseleave?: (e: MouseEvent) => void;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		feature,
		totalSize,
		radius,
		cx,
		cy,
		width = 14,
		selected = false,
		onmouseenter,
		onmouseleave,
		onclick,
	}: Props = $props();

	let color = $derived(getFeatureColor(feature.type, feature.color));

	let pathD = $derived(
		arrowArcPath(feature.start, feature.end, totalSize, radius, cx, cy, feature.strand, width)
	);
</script>

<g
	class="feature-arc"
	class:selected
	role="button"
	tabindex="0"
	onmouseenter={onmouseenter}
	onmouseleave={onmouseleave}
	onclick={onclick}
	onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
>
	<path
		d={pathD}
		fill={color}
		fill-opacity={selected ? 1.0 : 0.85}
		stroke={selected ? '#ffffff' : color}
		stroke-width={selected ? 2 : 0.5}
		stroke-opacity={selected ? 1 : 0.6}
	/>
</g>

<style>
	.feature-arc {
		cursor: pointer;
		transition: filter 0.15s;
	}

	.feature-arc:hover {
		filter: brightness(1.2);
	}

	.feature-arc.selected {
		filter: brightness(1.3) drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
	}
</style>
