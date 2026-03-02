<script lang="ts">
	import { arcMidpoint } from '../../util/coordinates.js';

	interface Props {
		name: string;
		startBp: number;
		endBp: number;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
	}

	let { name, startBp, endBp, totalSize, radius, cx, cy }: Props = $props();

	let mid = $derived(arcMidpoint(startBp, endBp, totalSize, radius, cx, cy));

	/** Compute rotation angle in degrees so text follows the arc */
	let rotationDeg = $derived.by(() => {
		let deg = (mid.angle * 180) / Math.PI;
		// Flip text if on the bottom half so it reads left-to-right
		if (deg > 90 && deg < 270) {
			deg += 180;
		}
		// Same for negative range
		if (deg > -270 && deg < -90) {
			deg += 180;
		}
		return deg;
	});
</script>

<text
	x={mid.x}
	y={mid.y}
	text-anchor="middle"
	dominant-baseline="central"
	transform="rotate({rotationDeg}, {mid.x}, {mid.y})"
	class="plasmid-label"
>
	{name}
</text>

<style>
	.plasmid-label {
		font-size: 11px;
		fill: var(--hatch-text, #e0e0e0);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
		text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
	}
</style>
