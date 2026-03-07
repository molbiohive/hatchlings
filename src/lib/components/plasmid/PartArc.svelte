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
		/** Current map rotation in degrees — used to flip text when upside down */
		rotation?: number;
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
		rotation = 0,
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

	/** Is the arc midpoint in the bottom half of the circle (after rotation)? */
	let isBottomHalf = $derived.by(() => {
		let arcSpan = part.end - part.start;
		if (arcSpan < 0) arcSpan += totalSize;
		const midBp = (part.start + arcSpan / 2) % totalSize;
		const midAngle = bpToAngle(midBp, totalSize);
		const rotRad = (rotation * Math.PI) / 180;
		return Math.sin(midAngle + rotRad) > 0;
	});

	/** Text path for internal label — flips direction when text would be upside down */
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

		// Text readability depends only on position, not strand:
		// top half → clockwise, bottom half → counter-clockwise
		const clockwise = !isBottomHalf;

		if (clockwise) {
			return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
		}
		return `M ${e.x} ${e.y} A ${r} ${r} 0 ${largeArc} 0 ${s.x} ${s.y}`;
	});

	/** Only show internal label if the text actually fits in the arc */
	let showInternal = $derived.by(() => {
		if (!showInternalLabel) return false;
		const text = part.label ?? part.name;
		const textWidthPx = text.length * 5.5 + 8;
		return arcLengthPx >= textWidthPx;
	});
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<g
	class="part-arc"
	class:selected
	role="button"
	tabindex="0"
	onmouseover={onmouseenter}
	onmouseout={(e) => { if (e.currentTarget?.contains(e.relatedTarget as Node)) return; onmouseleave?.(e); }}
	onclick={onclick}
	onkeydown={(e) => { if (e.key === 'Enter' && onclick) onclick(e as unknown as MouseEvent); }}
>
	<path
		d={pathD}
		fill={color}
		fill-opacity="1.0"
		stroke="var(--hatch-annotation-stroke, #fff)"
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
		user-select: none;
	}

	.part-arc:hover path {
		stroke: var(--hatch-annotation-stroke-hover, #fff);
		stroke-width: 1.5;
	}

	.part-arc.selected path {
		stroke: var(--hatch-annotation-stroke-hover, #fff);
		stroke-width: 2;
	}

	.part-internal-label {
		font-size: 9px;
		fill: var(--hatch-annotation-text, #fff);
		font-family: var(--hatch-font, -apple-system, sans-serif);
		font-weight: 600;
		pointer-events: none;
		user-select: none;
	}
</style>
