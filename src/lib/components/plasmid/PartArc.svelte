<script lang="ts">
	import type { Part } from '../../types/index.js';
	import { drawDirectedArc, bpToAngle, angleToXY } from '../../util/coordinates.js';
	import { getFeatureColor } from '../../util/colors.js';

	const TWO_PI = 2 * Math.PI;

	interface Props {
		part: Part;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
		width?: number;
		yOffset?: number;
		showInternalLabel?: boolean;
		selected?: boolean;
		onmouseenter?: (e: MouseEvent) => void;
		onmouseleave?: (e: MouseEvent) => void;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		part,
		totalSize,
		radius,
		cx,
		cy,
		width = 14,
		yOffset = 0,
		showInternalLabel = true,
		selected = false,
		onmouseenter,
		onmouseleave,
		onclick,
	}: Props = $props();

	let color = $derived(getFeatureColor(part.type, part.color));

	/** Effective radius with stacking offset */
	let effectiveRadius = $derived(radius + yOffset * (width + 4));
	let innerR = $derived(effectiveRadius - width / 2);
	let outerR = $derived(effectiveRadius + width / 2);

	/** Dynamic arrow angle — scales inversely with radius, matching OVE behavior */
	let arrowAngle = $derived(80 / effectiveRadius / TWO_PI);

	let pathD = $derived(
		drawDirectedArc(part.start, part.end, totalSize, innerR, outerR, cx, cy, part.strand, arrowAngle)
	);

	/** Arc length in pixels (approximate) for deciding whether to show internal label */
	let arcLengthPx = $derived.by(() => {
		let bpLen = part.end - part.start;
		if (bpLen < 0) bpLen += totalSize;
		return (bpLen / totalSize) * TWO_PI * effectiveRadius;
	});

	/** Text path for internal label */
	let textArcId = $derived(`part-arc-${part.name}-${part.start}`);
	let textPathD = $derived.by(() => {
		const r = effectiveRadius;
		const startAngle = bpToAngle(part.start, totalSize);
		const endAngle = bpToAngle(part.end, totalSize);
		let arcLen = part.end - part.start;
		if (arcLen < 0) arcLen += totalSize;
		const largeArc = arcLen / totalSize > 0.5 ? 1 : 0;

		const s = angleToXY(startAngle, r, cx, cy);
		const e = angleToXY(endAngle, r, cx, cy);

		if (part.strand === -1) {
			return `M ${e.x} ${e.y} A ${r} ${r} 0 ${largeArc} 0 ${s.x} ${s.y}`;
		}
		return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
	});

	let showInternal = $derived(showInternalLabel && arcLengthPx > 40);
</script>

<g
	class="part-arc"
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
		fill-opacity="1.0"
		stroke="#000"
		stroke-width="0.5"
	/>

	{#if showInternal}
		<defs>
			<path id={textArcId} d={textPathD} fill="none" />
		</defs>
		<text class="part-internal-label">
			<textPath
				href="#{textArcId}"
				startOffset="50%"
				text-anchor="middle"
				dominant-baseline="central"
			>
				{part.label ?? part.name}
			</textPath>
		</text>
	{/if}
</g>

<style>
	.part-arc {
		cursor: pointer;
		outline: none;
	}

	.part-arc:hover path {
		stroke: #fff;
		stroke-width: 1.5;
	}

	.part-arc.selected path {
		stroke: #fff;
		stroke-width: 2;
	}

	.part-internal-label {
		font-size: 9px;
		fill: var(--hatch-annotation-text, #fff);
		font-family: var(--hatch-font, -apple-system, sans-serif);
		font-weight: 600;
		pointer-events: none;
	}
</style>
