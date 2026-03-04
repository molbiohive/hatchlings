<script lang="ts">
	import type { CutSite } from '../../types/index.js';
	import { bpToAngle } from '../../util/coordinates.js';

	interface Props {
		cutSite: CutSite;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
		onmouseenter?: (e: MouseEvent) => void;
		onmouseleave?: (e: MouseEvent) => void;
	}

	let { cutSite, totalSize, radius, cx, cy, onmouseenter, onmouseleave }: Props = $props();

	const TRI_HEIGHT = 7;
	const TRI_HALF_BASE = 3;

	/** Small filled triangle pointing inward (toward center) — OVE style */
	let trianglePoints = $derived.by(() => {
		const angle = bpToAngle(cutSite.position, totalSize);
		// Tip is toward center, base is on outer edge
		const tipR = radius - TRI_HEIGHT;
		const baseR = radius;
		const tipPt = { x: cx + tipR * Math.cos(angle), y: cy + tipR * Math.sin(angle) };
		// Base corners perpendicular to radial direction
		const perpAngle = angle + Math.PI / 2;
		const baseCx = cx + baseR * Math.cos(angle);
		const baseCy = cy + baseR * Math.sin(angle);
		const left = {
			x: baseCx + TRI_HALF_BASE * Math.cos(perpAngle),
			y: baseCy + TRI_HALF_BASE * Math.sin(perpAngle),
		};
		const right = {
			x: baseCx - TRI_HALF_BASE * Math.cos(perpAngle),
			y: baseCy - TRI_HALF_BASE * Math.sin(perpAngle),
		};
		return `${left.x},${left.y} ${tipPt.x},${tipPt.y} ${right.x},${right.y}`;
	});
</script>

<g
	class="cut-site-marker"
	role="img"
	aria-label="{cutSite.enzyme} cut site at position {cutSite.position}"
	onmouseenter={onmouseenter}
	onmouseleave={onmouseleave}
>
	<!-- Small filled triangle pointing inward toward center -->
	<polygon
		points={trianglePoints}
		fill="var(--hatch-cut-site-marker, #1a1a2e)"
		stroke="none"
	/>
</g>

<style>
	.cut-site-marker {
		cursor: pointer;
	}
</style>
