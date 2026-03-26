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
		onclick?: (e: MouseEvent) => void;
	}

	let { cutSite, totalSize, radius, cx, cy, onmouseenter, onmouseleave, onclick }: Props = $props();

	const LINE_EXTEND = 8;

	/** Radial line crossing the backbone */
	let lineCoords = $derived.by(() => {
		const angle = bpToAngle(cutSite.position, totalSize);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return {
			x1: cx + (radius - LINE_EXTEND) * cos,
			y1: cy + (radius - LINE_EXTEND) * sin,
			x2: cx + (radius + LINE_EXTEND) * cos,
			y2: cy + (radius + LINE_EXTEND) * sin,
			// Exact cut position on backbone
			dotX: cx + radius * cos,
			dotY: cy + radius * sin,
		};
	});
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<g
	class="cut-site-marker"
	role="button"
	tabindex="-1"
	aria-label="{cutSite.enzyme} cut site at position {cutSite.position}"
	onmouseover={onmouseenter}
	onmouseout={(e) => { if (e.currentTarget?.contains(e.relatedTarget as Node)) return; onmouseleave?.(e); }}
	{onclick}
	onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
>
	<!-- Radial line crossing backbone -->
	<line
		x1={lineCoords.x1}
		y1={lineCoords.y1}
		x2={lineCoords.x2}
		y2={lineCoords.y2}
		stroke="var(--hatch-cutsite-color, #d45858)"
		stroke-width="1"
	/>
	<!-- Small dot at exact cut position -->
	<circle
		cx={lineCoords.dotX}
		cy={lineCoords.dotY}
		r="1.5"
		fill="var(--hatch-cutsite-color, #d45858)"
	/>
	<!-- Wider invisible hit area for hover/click -->
	<line
		x1={lineCoords.x1}
		y1={lineCoords.y1}
		x2={lineCoords.x2}
		y2={lineCoords.y2}
		stroke="transparent"
		stroke-width="8"
	/>
</g>

<style>
	.cut-site-marker {
		cursor: pointer;
		outline: none;
	}
</style>
