<script lang="ts">
	import type { Primer } from '../../types/index.js';

	interface Props {
		/** Array of primers to render */
		primers: Primer[];
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

	let { primers, start, end, y = 0, charsPerRow = 60, charWidth = 10 }: Props = $props();

	const TRACK_HEIGHT = 14;
	const LINE_Y_OFFSET = 7;
	const ARROW_SIZE = 5;

	/** Primers visible within this row's range */
	const visiblePrimers = $derived.by(() => {
		return primers.filter((p) => {
			return p.start < end && p.end > start;
		});
	});

	function primerX(bp: number): number {
		return Math.max(0, (bp - start)) * charWidth;
	}

	function arrowPath(primer: Primer): string {
		const px = primerX(Math.max(primer.start, start));
		const pEnd = primerX(Math.min(primer.end, end));
		const lineY = y + LINE_Y_OFFSET;

		if (primer.strand === 1) {
			// Forward: line with arrowhead pointing right
			const tipX = pEnd;
			return `M ${px} ${lineY} L ${tipX - ARROW_SIZE} ${lineY} L ${tipX} ${lineY} M ${tipX - ARROW_SIZE} ${lineY - ARROW_SIZE / 2} L ${tipX} ${lineY} L ${tipX - ARROW_SIZE} ${lineY + ARROW_SIZE / 2}`;
		} else {
			// Reverse: line with arrowhead pointing left
			const tipX = px;
			return `M ${pEnd} ${lineY} L ${tipX + ARROW_SIZE} ${lineY} L ${tipX} ${lineY} M ${tipX + ARROW_SIZE} ${lineY - ARROW_SIZE / 2} L ${tipX} ${lineY} L ${tipX + ARROW_SIZE} ${lineY + ARROW_SIZE / 2}`;
		}
	}
</script>

<g class="hatch-primer-track">
	{#each visiblePrimers as primer}
		{@const px = primerX(Math.max(primer.start, start))}
		{@const pEnd = primerX(Math.min(primer.end, end))}
		{@const color = primer.color ?? 'var(--hatch-primer-color, #22d3ee)'}
		{@const lineY = y + LINE_Y_OFFSET}

		<!-- Primer line with arrow -->
		<line
			x1={px}
			y1={lineY}
			x2={pEnd}
			y2={lineY}
			stroke={color}
			stroke-width="2"
		/>

		<!-- Arrowhead -->
		{#if primer.strand === 1}
			<polyline
				points="{pEnd - ARROW_SIZE},{lineY - ARROW_SIZE} {pEnd},{lineY} {pEnd - ARROW_SIZE},{lineY + ARROW_SIZE}"
				fill="none"
				stroke={color}
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{:else}
			<polyline
				points="{px + ARROW_SIZE},{lineY - ARROW_SIZE} {px},{lineY} {px + ARROW_SIZE},{lineY + ARROW_SIZE}"
				fill="none"
				stroke={color}
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{/if}

		<!-- Primer name -->
		<text
			x={(px + pEnd) / 2}
			y={y + TRACK_HEIGHT + 2}
			text-anchor="middle"
			dominant-baseline="hanging"
			fill="var(--hatch-primer-text, #22d3ee)"
			font-size="9"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>
			{primer.name}{#if primer.tm} (Tm: {primer.tm.toFixed(1)}&deg;C){/if}
		</text>
	{/each}
</g>
