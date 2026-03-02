<script lang="ts">
	import type { Feature, Primer, CutSite, Translation } from '../../types/index.js';
	import SequenceRow from './SequenceRow.svelte';
	import Ruler from './Ruler.svelte';

	interface Props {
		/** Full DNA sequence string */
		seq: string;
		/** Feature annotations */
		features?: Feature[];
		/** Primer annotations */
		primers?: Primer[];
		/** Restriction enzyme cut sites */
		cutSites?: CutSite[];
		/** Translation tracks */
		translations?: Translation[];
		/** Number of characters (bases) per row */
		charsPerRow?: number;
		/** Width of each character in pixels */
		charWidth?: number;
		/** Container width in pixels */
		width?: number;
		/** Container height in pixels */
		height?: number;
		/** Show feature annotation tracks */
		showAnnotations?: boolean;
		/** Show primer tracks */
		showPrimers?: boolean;
		/** Show translation tracks */
		showTranslations?: boolean;
		/** Show position numbers */
		showNumbers?: boolean;
		/** Selection callback: fires with {start, end, sequence} */
		onselect?: (selection: { start: number; end: number; sequence: string }) => void;
	}

	let {
		seq,
		features = [],
		primers = [],
		cutSites = [],
		translations = [],
		charsPerRow = 60,
		charWidth = 10,
		width = 700,
		height = 500,
		showAnnotations = true,
		showPrimers = true,
		showTranslations = true,
		showNumbers = true,
		onselect,
	}: Props = $props();

	const NUMBER_WIDTH = 50;
	const SEQ_X = $derived(showNumbers ? NUMBER_WIDTH : 0);
	const ROW_PADDING = 12;

	/** Split the sequence into rows */
	const rows = $derived.by(() => {
		const result: { seq: string; start: number }[] = [];
		for (let i = 0; i < seq.length; i += charsPerRow) {
			result.push({
				seq: seq.slice(i, i + charsPerRow),
				start: i,
			});
		}
		return result;
	});

	/** Compute estimated height per row based on visible tracks */
	function estimateRowHeight(rowStart: number, rowEnd: number): number {
		let h = 14; // base sequence height

		if (showAnnotations) {
			const visFeatures = features.filter((f) => f.start < rowEnd && f.end > rowStart);
			if (visFeatures.length > 0) {
				// Estimate lane count
				const sorted = [...visFeatures].sort((a, b) => a.start - b.start);
				const lanes: { end: number }[] = [];
				for (const feat of sorted) {
					let assigned = false;
					for (const lane of lanes) {
						if (feat.start >= lane.end) {
							lane.end = feat.end;
							assigned = true;
							break;
						}
					}
					if (!assigned) {
						lanes.push({ end: feat.end });
					}
				}
				h += lanes.length * 18 + 4;
			}
		}

		if (showTranslations) {
			const visTrans = translations.filter((t) => t.start < rowEnd && t.end > rowStart);
			if (visTrans.length > 0) {
				h += 24;
			}
		}

		if (showPrimers) {
			const visPrimers = primers.filter((p) => p.start < rowEnd && p.end > rowStart);
			if (visPrimers.length > 0) {
				h += 30;
			}
		}

		return h;
	}

	/** Calculate cumulative Y positions for each row */
	const rowPositions = $derived.by(() => {
		const positions: { y: number; height: number }[] = [];
		let currentY = 8;
		for (const row of rows) {
			const rowEnd = row.start + row.seq.length;
			const rowH = estimateRowHeight(row.start, rowEnd);
			positions.push({ y: currentY, height: rowH });
			currentY += rowH + ROW_PADDING;
		}
		return positions;
	});

	const totalSvgHeight = $derived.by(() => {
		if (rowPositions.length === 0) return height;
		const last = rowPositions[rowPositions.length - 1];
		return last.y + last.height + ROW_PADDING;
	});

	const svgWidth = $derived(SEQ_X + charsPerRow * charWidth + 20);

	/* Selection state */
	let selectionStart = $state(-1);
	let selectionEnd = $state(-1);
	let isSelecting = $state(false);

	function bpFromMouseEvent(e: MouseEvent): number {
		const svgEl = (e.currentTarget as Element).closest('svg');
		if (!svgEl) return -1;
		const rect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top + (svgEl.parentElement?.scrollTop ?? 0);

		// Find which row we're in
		for (let i = 0; i < rows.length; i++) {
			const rp = rowPositions[i];
			if (mouseY >= rp.y && mouseY <= rp.y + rp.height) {
				const charIndex = Math.floor((mouseX - SEQ_X) / charWidth);
				if (charIndex >= 0 && charIndex < rows[i].seq.length) {
					return rows[i].start + charIndex;
				}
			}
		}
		return -1;
	}

	function handleMouseDown(e: MouseEvent) {
		const bp = bpFromMouseEvent(e);
		if (bp >= 0) {
			selectionStart = bp;
			selectionEnd = bp;
			isSelecting = true;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isSelecting) return;
		const bp = bpFromMouseEvent(e);
		if (bp >= 0) {
			selectionEnd = bp;
		}
	}

	function handleMouseUp() {
		if (isSelecting) {
			isSelecting = false;
			if (selectionStart >= 0 && selectionEnd >= 0 && selectionStart !== selectionEnd) {
				const sStart = Math.min(selectionStart, selectionEnd);
				const sEnd = Math.max(selectionStart, selectionEnd) + 1;
				onselect?.({
					start: sStart,
					end: sEnd,
					sequence: seq.slice(sStart, sEnd),
				});
			}
		}
	}

	/** Compute selection highlight range */
	const selRange = $derived.by(() => {
		if (selectionStart < 0 || selectionEnd < 0) return null;
		return {
			start: Math.min(selectionStart, selectionEnd),
			end: Math.max(selectionStart, selectionEnd) + 1,
		};
	});

	/** Filter features relevant to a given row */
	function rowFeatures(rowStart: number, rowEnd: number): Feature[] {
		return features.filter((f) => f.start < rowEnd && f.end > rowStart);
	}

	/** Filter primers relevant to a given row */
	function rowPrimers(rowStart: number, rowEnd: number): Primer[] {
		return primers.filter((p) => p.start < rowEnd && p.end > rowStart);
	}

	/** Filter translations relevant to a given row */
	function rowTranslations(rowStart: number, rowEnd: number): Translation[] {
		return translations.filter((t) => {
			const tEnd = t.start + t.aminoAcids.length * 3;
			return tEnd > rowStart && t.start < rowEnd;
		});
	}
</script>

<div
	class="hatch-sequence-viewer"
	style:width="{width}px"
	style:height="{height}px"
>
	<svg
		width={svgWidth}
		height={totalSvgHeight}
		class="hatch-sequence-svg"
		role="img"
		aria-label="DNA sequence viewer"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		{#each rows as row, i}
			{@const rowEnd = row.start + row.seq.length}
			{@const rp = rowPositions[i]}

			<g transform="translate(0, {rp.y})">
				<!-- Selection highlight -->
				{#if selRange && selRange.start < rowEnd && selRange.end > row.start}
					{@const hlStart = Math.max(selRange.start, row.start)}
					{@const hlEnd = Math.min(selRange.end, rowEnd)}
					<rect
						x={SEQ_X + (hlStart - row.start) * charWidth}
						y={0}
						width={(hlEnd - hlStart) * charWidth}
						height={rp.height}
						fill="var(--hatch-selection-fill, rgba(59, 130, 246, 0.15))"
						rx="2"
					/>
				{/if}

				<!-- Cut site markers -->
				{#each cutSites as site}
					{#if site.position >= row.start && site.position < rowEnd}
						{@const cx = SEQ_X + (site.position - row.start) * charWidth}
						<line
							x1={cx}
							y1={0}
							x2={cx}
							y2={rp.height}
							stroke="var(--hatch-cutsite-color, #ef4444)"
							stroke-width="1.5"
							stroke-dasharray="3 2"
						/>
						<text
							x={cx}
							y={-3}
							text-anchor="middle"
							fill="var(--hatch-cutsite-text, #ef4444)"
							font-size="8"
							font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
						>{site.enzyme}</text>
					{/if}
				{/each}

				<SequenceRow
					seq={row.seq}
					start={row.start}
					features={rowFeatures(row.start, rowEnd)}
					primers={rowPrimers(row.start, rowEnd)}
					translations={rowTranslations(row.start, rowEnd)}
					{charWidth}
					{showNumbers}
					showAnnotations={showAnnotations}
					showPrimers={showPrimers}
					showTranslations={showTranslations}
				/>
			</g>
		{/each}
	</svg>
</div>

<style>
	.hatch-sequence-viewer {
		overflow-y: auto;
		overflow-x: auto;
		background: var(--hatch-seq-bg, #0d0d1a);
		border: 1px solid var(--hatch-seq-border, #2a2a4a);
		border-radius: 6px;
		position: relative;
		cursor: text;
		user-select: none;
	}

	.hatch-sequence-svg {
		display: block;
	}
</style>
