<script lang="ts">
	import type { TraceAlignment } from '../../types/index.js';
	import { nucleotideColors } from '../../util/colors.js';

	interface Props {
		/** Alignment between trace sequence and reference */
		alignment: TraceAlignment | undefined;
		/** Base call string */
		baseCalls: string;
		/** Peak position for each base call (data point index) */
		peakPositions: number[];
		/** SVG width in pixels */
		width: number;
		/** Horizontal zoom factor */
		zoom?: number;
		/** Horizontal scroll offset in pixels */
		scrollX?: number;
	}

	let {
		alignment,
		baseCalls,
		peakPositions,
		width,
		zoom = 1,
		scrollX = 0,
	}: Props = $props();

	const TRACK_HEIGHT = 50;
	const FONT_SIZE = 11;
	const LINE_HEIGHT = 18;
	const TOP_PADDING = 6;

	/** Build a set of mismatch positions for quick lookup */
	let mismatchMap = $derived.by(() => {
		if (!alignment) return new Map<number, { type: string; color: string }>();
		const map = new Map<number, { type: string; color: string }>();
		for (const m of alignment.mismatches) {
			let color: string;
			switch (m.type) {
				case 'substitution':
					color = '#e41a1c'; // red
					break;
				case 'insertion':
					color = '#377eb8'; // blue
					break;
				case 'deletion':
					color = '#999999'; // grey
					break;
				default:
					color = '#999999';
			}
			map.set(m.pos, { type: m.type, color });
		}
		return map;
	});

	/** Build visible aligned positions */
	let visiblePositions = $derived.by(() => {
		if (!alignment) return [];

		const refSeq = alignment.refSeq;
		const querySeq = alignment.querySeq;
		const items: Array<{
			index: number;
			x: number;
			refBase: string;
			queryBase: string;
			bgColor: string | null;
			refColor: string;
			queryColor: string;
		}> = [];

		const len = Math.min(refSeq.length, querySeq.length);

		for (let i = 0; i < len; i++) {
			// Map alignment position to peak position (approximate: use index as base index)
			const peakIdx = i < peakPositions.length ? peakPositions[i] : i * 10;
			const x = peakIdx * zoom - scrollX;

			if (x < -20 || x > width + 20) continue;

			const refBase = refSeq[i];
			const queryBase = querySeq[i];
			const mismatch = mismatchMap.get(i);

			const refColor = nucleotideColors[refBase] ?? '#888';
			const queryColor = nucleotideColors[queryBase] ?? '#888';
			const bgColor = mismatch ? mismatch.color : null;

			items.push({ index: i, x, refBase, queryBase, bgColor, refColor, queryColor });
		}

		return items;
	});
</script>

{#if alignment}
	<svg
		{width}
		height={TRACK_HEIGHT}
		viewBox="0 0 {width} {TRACK_HEIGHT}"
		style="display: block; background: var(--hatch-bg, #0c1018);"
	>
		<!-- Label -->
		<text
			x={4}
			y={TOP_PADDING + FONT_SIZE - 1}
			fill="var(--hatch-text-dim, #566070)"
			font-size="9"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>
			ref
		</text>
		<text
			x={4}
			y={TOP_PADDING + LINE_HEIGHT + FONT_SIZE - 1}
			fill="var(--hatch-text-dim, #566070)"
			font-size="9"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>
			qry
		</text>

		{#each visiblePositions as pos}
			<!-- Mismatch highlight background -->
			{#if pos.bgColor}
				<rect
					x={pos.x - 6}
					y={TOP_PADDING - 2}
					width={12}
					height={LINE_HEIGHT * 2 + 4}
					fill={pos.bgColor}
					fill-opacity="0.15"
					rx="2"
				/>
			{/if}

			<!-- Reference base -->
			<text
				x={pos.x}
				y={TOP_PADDING + FONT_SIZE}
				text-anchor="middle"
				fill={pos.bgColor ? pos.bgColor : pos.refColor}
				fill-opacity={pos.refBase === '-' ? 0.4 : 0.85}
				font-size={FONT_SIZE}
				font-weight="500"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
			>
				{pos.refBase}
			</text>

			<!-- Match indicator or mismatch -->
			{#if !pos.bgColor && pos.refBase === pos.queryBase}
				<text
					x={pos.x}
					y={TOP_PADDING + LINE_HEIGHT - 1}
					text-anchor="middle"
					fill="var(--hatch-tick-minor, #3a4858)"
					font-size="8"
					font-family="var(--hatch-font-mono, 'SF Mono', monospace)"
				>
					|
				</text>
			{/if}

			<!-- Query base -->
			<text
				x={pos.x}
				y={TOP_PADDING + LINE_HEIGHT + FONT_SIZE}
				text-anchor="middle"
				fill={pos.bgColor ? pos.bgColor : pos.queryColor}
				fill-opacity={pos.queryBase === '-' ? 0.4 : 0.85}
				font-size={FONT_SIZE}
				font-weight="500"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
			>
				{pos.queryBase}
			</text>
		{/each}

		<!-- Identity percentage -->
		{#if alignment.identity !== undefined}
			<text
				x={width - 6}
				y={TRACK_HEIGHT - 4}
				text-anchor="end"
				fill="var(--hatch-text-dim, #566070)"
				font-size="9"
				font-family="var(--hatch-font-mono, 'SF Mono', monospace)"
			>
				{(alignment.identity * 100).toFixed(1)}% identity
			</text>
		{/if}
	</svg>
{/if}
