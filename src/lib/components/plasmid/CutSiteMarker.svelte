<script lang="ts">
	import type { CutSite } from '../../types/index.js';
	import { bpToXY } from '../../util/coordinates.js';

	interface Props {
		cutSite: CutSite;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
	}

	let { cutSite, totalSize, radius, cx, cy }: Props = $props();

	let innerPt = $derived(bpToXY(cutSite.position, totalSize, radius - 10, cx, cy));
	let outerPt = $derived(bpToXY(cutSite.position, totalSize, radius + 10, cx, cy));
	let labelPt = $derived(bpToXY(cutSite.position, totalSize, radius + 18, cx, cy));
</script>

<g class="cut-site-marker">
	<line
		x1={innerPt.x}
		y1={innerPt.y}
		x2={outerPt.x}
		y2={outerPt.y}
		stroke="var(--hatch-cut-site, #e74c3c)"
		stroke-width="1.5"
		stroke-linecap="round"
	/>
	<text
		x={labelPt.x}
		y={labelPt.y}
		text-anchor="middle"
		dominant-baseline="central"
		class="cut-site-label"
	>
		{cutSite.enzyme}
	</text>
</g>

<style>
	.cut-site-label {
		font-size: 9px;
		fill: var(--hatch-cut-site, #e74c3c);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
	}
</style>
