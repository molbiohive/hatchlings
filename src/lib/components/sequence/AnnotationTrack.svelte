<script lang="ts">
	import type { Feature } from '../../types/index.js';
	import { getFeatureColor } from '../../util/colors.js';

	interface Props {
		/** Array of features to render */
		features: Feature[];
		/** Start bp of this row */
		start: number;
		/** End bp of this row */
		end: number;
		/** Y position */
		y?: number;
		/** Characters per row */
		charsPerRow?: number;
		/** Width of each character in pixels */
		charWidth?: number;
	}

	let { features, start, end, y = 0, charsPerRow = 60, charWidth = 10 }: Props = $props();

	const TRACK_HEIGHT = 16;
	const TRACK_GAP = 2;
	const ARROW_WIDTH = 6;

	/** Features visible within this row's range */
	const visibleFeatures = $derived.by(() => {
		return features.filter((f) => {
			return f.start < end && f.end > start;
		});
	});

	/** Assign lanes to overlapping features to avoid collisions */
	const laneAssignments = $derived.by(() => {
		const sorted = [...visibleFeatures].sort((a, b) => a.start - b.start);
		const lanes: { end: number }[] = [];
		const assignments = new Map<Feature, number>();

		for (const feat of sorted) {
			let assignedLane = -1;
			for (let i = 0; i < lanes.length; i++) {
				if (feat.start >= lanes[i].end) {
					assignedLane = i;
					lanes[i].end = feat.end;
					break;
				}
			}
			if (assignedLane === -1) {
				assignedLane = lanes.length;
				lanes.push({ end: feat.end });
			}
			assignments.set(feat, assignedLane);
		}
		return assignments;
	});

	function featureX(bp: number): number {
		return Math.max(0, (bp - start)) * charWidth;
	}

	function featureWidth(feat: Feature): number {
		const visStart = Math.max(feat.start, start);
		const visEnd = Math.min(feat.end, end);
		return (visEnd - visStart) * charWidth;
	}

	function arrowPath(feat: Feature, lane: number): string {
		const fx = featureX(Math.max(feat.start, start));
		const fw = featureWidth(feat);
		const fy = y + lane * (TRACK_HEIGHT + TRACK_GAP);
		const h = TRACK_HEIGHT;

		if (fw <= ARROW_WIDTH * 2) {
			// Too small for arrow, draw simple rect
			return `M ${fx} ${fy} L ${fx + fw} ${fy} L ${fx + fw} ${fy + h} L ${fx} ${fy + h} Z`;
		}

		if (feat.strand === 1) {
			// Forward arrow: body + arrowhead on right
			const bodyEnd = fx + fw - ARROW_WIDTH;
			return `M ${fx} ${fy} L ${bodyEnd} ${fy} L ${fx + fw} ${fy + h / 2} L ${bodyEnd} ${fy + h} L ${fx} ${fy + h} Z`;
		} else {
			// Reverse arrow: arrowhead on left + body
			const bodyStart = fx + ARROW_WIDTH;
			return `M ${fx} ${fy + h / 2} L ${bodyStart} ${fy} L ${fx + fw} ${fy} L ${fx + fw} ${fy + h} L ${bodyStart} ${fy + h} Z`;
		}
	}
</script>

<g class="hatch-annotation-track">
	{#each visibleFeatures as feat}
		{@const lane = laneAssignments.get(feat) ?? 0}
		{@const color = getFeatureColor(feat.type, feat.color)}
		{@const fx = featureX(Math.max(feat.start, start))}
		{@const fw = featureWidth(feat)}
		{@const fy = y + lane * (TRACK_HEIGHT + TRACK_GAP)}

		<!-- Feature arrow/rect -->
		<path
			d={arrowPath(feat, lane)}
			fill={color}
			fill-opacity="0.7"
			stroke={color}
			stroke-width="1"
		/>

		<!-- Feature label -->
		{#if fw > 20}
			<text
				x={fx + fw / 2}
				y={fy + TRACK_HEIGHT / 2 + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--hatch-annotation-text, #fff)"
				font-size="10"
				font-weight="600"
				font-family="var(--hatch-font, -apple-system, sans-serif)"
			>
				{feat.label ?? feat.name}
			</text>
		{/if}
	{/each}
</g>
