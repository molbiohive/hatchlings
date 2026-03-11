<script lang="ts">
	import type { Part } from '../../types/index.js';
	import { drawDirectedArc, drawHalfArrowArc, arcPath, bpToAngle, angleToXY } from '../../util/coordinates.js';
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
		/** Use half-arrow rendering (for primers) */
		halfArrow?: boolean;
		/** Force color (overrides feature type color) */
		overrideColor?: string;
		/** Fill opacity for the main arc (default 1.0) */
		fillOpacity?: number;
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
		halfArrow = false,
		overrideColor,
		fillOpacity = 1.0,
		onmouseenter,
		onmouseleave,
		onclick,
	}: Props = $props();

	let color = $derived(overrideColor ?? getFeatureColor(part.type, part.color));

	/** Effective radius with stacking offset */
	let effectiveRadius = $derived(radius + yOffset * (width + 4));
	let innerR = $derived(effectiveRadius - width / 2);
	let outerR = $derived(effectiveRadius + width / 2);

	/** Dynamic arrow angle — scales inversely with radius, matching OVE behavior */
	let arrowAngle = $derived(80 / effectiveRadius / TWO_PI);

	/** Whether this part has overhang regions */
	let hasOverhang = $derived(
		part.bindingStart !== undefined && part.bindingEnd !== undefined &&
		(part.bindingStart !== part.start || part.bindingEnd !== part.end)
	);

	/** Main arc path — either full part or just the binding region */
	let pathD = $derived.by(() => {
		const drawFn = halfArrow ? drawHalfArrowArc : drawDirectedArc;
		if (hasOverhang) {
			// Draw only the binding region with the arrow
			return drawFn(part.bindingStart!, part.bindingEnd!, totalSize, innerR, outerR, cx, cy, part.strand, arrowAngle);
		}
		return drawFn(part.start, part.end, totalSize, innerR, outerR, cx, cy, part.strand, arrowAngle);
	});

	/** Overhang arc paths — same radius as binding (aligned), just styled differently */
	let overhangPaths = $derived.by(() => {
		if (!hasOverhang) return [];
		const paths: string[] = [];
		const midR = (innerR + outerR) / 2;
		const w = outerR - innerR;
		// 5' overhang (before binding)
		if (part.bindingStart! !== part.start) {
			paths.push(arcPath(part.start, part.bindingStart!, totalSize, midR, cx, cy, w));
		}
		// 3' overhang (after binding)
		if (part.bindingEnd! !== part.end) {
			paths.push(arcPath(part.bindingEnd!, part.end, totalSize, midR, cx, cy, w));
		}
		return paths;
	});

	/** Use binding region for label placement when overhang is present */
	let labelStart = $derived(hasOverhang ? part.bindingStart! : part.start);
	let labelEnd = $derived(hasOverhang ? part.bindingEnd! : part.end);

	/** Arc length in pixels (approximate) for deciding whether to show internal label */
	let arcLengthPx = $derived.by(() => {
		let bpLen = labelEnd - labelStart;
		if (bpLen < 0) bpLen += totalSize;
		return (bpLen / totalSize) * TWO_PI * effectiveRadius;
	});

	/** Is the arc midpoint in the bottom half of the circle (after rotation)? */
	let isBottomHalf = $derived.by(() => {
		let arcSpan = labelEnd - labelStart;
		if (arcSpan < 0) arcSpan += totalSize;
		const midBp = (labelStart + arcSpan / 2) % totalSize;
		const midAngle = bpToAngle(midBp, totalSize);
		const rotRad = (rotation * Math.PI) / 180;
		return Math.sin(midAngle + rotRad) > 0;
	});

	/** Text path for internal label — uses binding region, flips when upside down */
	let textArcId = $derived(`part-arc-${part.name}-${part.start}`);
	let textPathD = $derived.by(() => {
		const r = effectiveRadius;
		const startAngle = bpToAngle(labelStart, totalSize);
		const endAngle = bpToAngle(labelEnd, totalSize);
		let arcLen = labelEnd - labelStart;
		if (arcLen < 0) arcLen += totalSize;
		const largeArc = arcLen / totalSize > 0.5 ? 1 : 0;

		const s = angleToXY(startAngle, r, cx, cy);
		const e = angleToXY(endAngle, r, cx, cy);

		const clockwise = !isBottomHalf;

		if (clockwise) {
			return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
		}
		return `M ${e.x} ${e.y} A ${r} ${r} 0 ${largeArc} 0 ${s.x} ${s.y}`;
	});

	/** Only show internal label if the text actually fits in the binding arc */
	let showInternal = $derived.by(() => {
		if (!showInternalLabel) return false;
		const text = part.label ?? part.name;
		const textWidthPx = text.length * 5.5 + 8;
		// Subtract arrow tip space — the arrowhead eats ~20px of usable text area
		const usableArcPx = arcLengthPx - 20;
		return usableArcPx >= textWidthPx;
	});

	/** Mismatch arc segments — same raised style as overhangs */
	let mismatchArcs = $derived.by(() => {
		if (!part.mismatches || part.mismatches.length === 0) return [];
		const midR = (innerR + outerR) / 2;
		const w = outerR - innerR;
		// Each mismatch spans ~4px worth of angle for visibility
		const bpPerPx = totalSize / (TWO_PI * effectiveRadius);
		const halfSpan = Math.max(0.5, bpPerPx * 2);
		return part.mismatches.map(bp => {
			const s = (bp - halfSpan + totalSize) % totalSize;
			const e = (bp + halfSpan) % totalSize;
			return arcPath(s, e, totalSize, midR, cx, cy, w);
		});
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
	<!-- Overhang regions (dim, dashed, offset) -->
	{#each overhangPaths as ohPath}
		<path
			d={ohPath}
			fill={color}
			fill-opacity="0.35"
			stroke={color}
			stroke-width="1"
			stroke-dasharray="3,2"
			stroke-opacity="0.6"
		/>
	{/each}

	<!-- Main binding / full arc -->
	<path
		d={pathD}
		fill={color}
		fill-opacity={fillOpacity}
		stroke="var(--hatch-annotation-stroke, #fff)"
		stroke-width="0.5"
	/>

	<!-- Mismatch markers — same style as overhangs -->
	{#each mismatchArcs as mmPath}
		<path
			d={mmPath}
			fill={color}
			fill-opacity="0.35"
			stroke={color}
			stroke-width="1"
			stroke-dasharray="3,2"
			stroke-opacity="0.6"
		/>
	{/each}

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
