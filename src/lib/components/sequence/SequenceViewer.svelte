<script lang="ts">
	import type { Part, CutSite, Translation } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import SequenceRow from './SequenceRow.svelte';
	import Ruler from './Ruler.svelte';

	interface Props {
		/** Full sequence string */
		seq: string;
		/** Sequence alphabet */
		alphabet?: 'dna' | 'rna' | 'protein';
		/** Part annotations (unified features + primers) */
		parts?: Part[];
		/** Restriction enzyme cut sites */
		cutSites?: CutSite[];
		/** Translation tracks */
		translations?: Translation[];
		/** Shared selection state (for cross-view sync) */
		selectionState?: SelectionState;
		/** Number of characters per row */
		charsPerRow?: number;
		/** Width of each character in pixels */
		charWidth?: number;
		/** Container width in pixels */
		width?: number;
		/** Container height in pixels */
		height?: number;
		/** Show annotation tracks */
		showAnnotations?: boolean;
		/** Show translation tracks */
		showTranslations?: boolean;
		/** Show position numbers */
		showNumbers?: boolean;
		/** Show complement strand (default: auto for DNA) */
		showComplement?: boolean;
		/** Color bases (default: false for DNA, true for RNA/protein) */
		colorBases?: boolean;
		/** Selection callback */
		onselect?: (selection: { start: number; end: number; sequence: string }) => void;
		/** Part click callback */
		onpartclick?: (part: Part) => void;
		/** Copy sequence callback */
		oncopysequence?: (sequence: string) => void;
		/** Hover info callback */
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		seq,
		alphabet = 'dna',
		parts = [],
		cutSites = [],
		translations = [],
		selectionState,
		charsPerRow = 60,
		charWidth = 10,
		width = 700,
		height = 500,
		showAnnotations = true,
		showTranslations = true,
		showNumbers = true,
		showComplement,
		colorBases,
		onselect,
		onpartclick,
		oncopysequence,
		onhoverinfo,
	}: Props = $props();

	/** For protein, suppress DNA-specific tracks */
	let effectiveShowTranslations = $derived(alphabet === 'protein' ? false : showTranslations);
	let effectiveCutSites = $derived(alphabet === 'protein' ? [] : cutSites);
	let effectiveShowComplement = $derived(showComplement ?? (alphabet === 'dna'));
	let effectiveColorBases = $derived(colorBases ?? (alphabet !== 'dna'));

	const NUMBER_WIDTH = 50;
	const SEQ_X = $derived(showNumbers ? NUMBER_WIDTH : 0);
	const ROW_PADDING = 12;
	const BUFFER_ROWS = 2;

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

		if (effectiveShowComplement) {
			h += 14 + 2;
		}

		if (showAnnotations) {
			const visParts = parts.filter((p) => p.start < rowEnd && p.end > rowStart);
			if (visParts.length > 0) {
				const sorted = [...visParts].sort((a, b) => a.start - b.start);
				const lanes: { end: number }[] = [];
				for (const part of sorted) {
					let assigned = false;
					for (const lane of lanes) {
						if (part.start >= lane.end) {
							lane.end = part.end;
							assigned = true;
							break;
						}
					}
					if (!assigned) {
						lanes.push({ end: part.end });
					}
				}
				h += lanes.length * 18 + 4;
			}
		}

		if (effectiveShowTranslations) {
			const visTrans = translations.filter((t) => t.start < rowEnd && t.end > rowStart);
			if (visTrans.length > 0) {
				h += 24;
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

	/** Virtual scrolling state */
	let scrollTop = $state(0);
	let containerEl: HTMLDivElement | undefined = $state(undefined);

	function handleScroll() {
		if (containerEl) {
			scrollTop = containerEl.scrollTop;
		}
	}

	/** Compute visible row indices based on scroll position */
	const visibleRange = $derived.by(() => {
		if (rows.length === 0) return { start: 0, end: 0 };

		const viewTop = scrollTop;
		const viewBottom = scrollTop + height;

		let startIdx = 0;
		let endIdx = rows.length;

		for (let i = 0; i < rowPositions.length; i++) {
			const rp = rowPositions[i];
			if (rp.y + rp.height >= viewTop) {
				startIdx = Math.max(0, i - BUFFER_ROWS);
				break;
			}
		}

		for (let i = startIdx; i < rowPositions.length; i++) {
			if (rowPositions[i].y > viewBottom) {
				endIdx = Math.min(rows.length, i + BUFFER_ROWS);
				break;
			}
		}

		return { start: startIdx, end: endIdx };
	});

	/* Selection state — use SelectionState if provided, otherwise internal */
	let internalSelStart = $state(-1);
	let internalSelEnd = $state(-1);
	let isSelecting = $state(false);

	// Derived: effective selection range (from SelectionState or internal)
	const selRange = $derived.by(() => {
		if (selectionState) {
			return selectionState.range;
		}
		if (internalSelStart < 0 || internalSelEnd < 0) return null;
		return {
			start: Math.min(internalSelStart, internalSelEnd),
			end: Math.max(internalSelStart, internalSelEnd) + 1,
		};
	});

	// Derived: caret position
	const caretPos = $derived.by(() => {
		if (selectionState) return selectionState.caretPosition;
		if (internalSelStart >= 0 && internalSelStart === internalSelEnd) return internalSelStart;
		return -1;
	});

	function bpFromMouseEvent(e: MouseEvent): number {
		const svgEl = (e.currentTarget as Element).closest('svg');
		if (!svgEl) return -1;
		const rect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		// getBoundingClientRect already accounts for parent scroll —
		// do NOT add scrollTop (that double-counts the offset)
		const mouseY = e.clientY - rect.top;

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
			if (selectionState) {
				selectionState.startDrag(bp);
			} else {
				internalSelStart = bp;
				internalSelEnd = bp;
			}
			isSelecting = true;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isSelecting) return;
		const bp = bpFromMouseEvent(e);
		if (bp >= 0) {
			if (selectionState) {
				selectionState.updateDrag(bp);
			} else {
				internalSelEnd = bp;
			}
		}
	}

	function handleMouseUp() {
		if (isSelecting) {
			isSelecting = false;
			if (selectionState) {
				selectionState.endDrag();
				const range = selectionState.range;
				if (range) {
					onselect?.({
						start: range.start,
						end: range.end,
						sequence: seq.slice(range.start, range.end),
					});
				}
			} else {
				if (internalSelStart >= 0 && internalSelEnd >= 0 && internalSelStart !== internalSelEnd) {
					const sStart = Math.min(internalSelStart, internalSelEnd);
					const sEnd = Math.max(internalSelStart, internalSelEnd) + 1;
					onselect?.({
						start: sStart,
						end: sEnd,
						sequence: seq.slice(sStart, sEnd),
					});
				}
			}
		}
	}

	/** Selection info for display */
	let selectionInfo = $derived.by(() => {
		if (!selRange) return '';
		const len = selRange.end - selRange.start;
		if (len <= 0) return '';
		const unit = alphabet === 'protein' ? 'aa' : 'bp';
		return `${selRange.start + 1}..${selRange.end} (${len} ${unit})`;
	});

	/** Wrapped part click: select sequence + fire callbacks */
	function handlePartClick(part: Part) {
		onpartclick?.(part);
		if (selectionState) {
			selectionState.setSelection(part.start, part.end);
			const range = { start: part.start, end: part.end };
			onselect?.({ ...range, sequence: seq.slice(range.start, range.end) });
		}
	}

	/** Fire InfoBox on part hover */
	function handlePartHover(part: Part | null, e?: MouseEvent) {
		if (!part || !e) {
			onhoverinfo?.(null);
			return;
		}
		const bpLen = part.end - part.start;
		onhoverinfo?.({
			title: part.name,
			items: [
				{ label: 'Type', value: part.type },
				{ label: 'Location', value: `${part.start}..${part.end}` },
				{ label: 'Strand', value: part.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				{ label: 'Length', value: bpLen, unit: 'bp' },
				...(part.tm !== undefined ? [{ label: 'Tm', value: part.tm.toFixed(1), unit: '°C' }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	/** Compute the Y bounds of the forward+complement strands within a row.
	 *  Matches SequenceRow's internal layout: annotations above, then seq, then complement. */
	function strandBounds(rowStart: number, rowEnd: number): { seqY: number; endY: number } {
		const LINE_HEIGHT = 14;
		let annotLanes = 0;
		if (showAnnotations) {
			const visParts = parts.filter((p) => p.start < rowEnd && p.end > rowStart);
			if (visParts.length > 0) {
				const sorted = [...visParts].sort((a, b) => a.start - b.start);
				const lanes: { end: number }[] = [];
				for (const part of sorted) {
					let assigned = false;
					for (const lane of lanes) {
						if (part.start >= lane.end) {
							lane.end = part.end;
							assigned = true;
							break;
						}
					}
					if (!assigned) lanes.push({ end: part.end });
				}
				annotLanes = lanes.length;
			}
		}
		const annotH = annotLanes * 18;
		const seqY = annotH + (annotLanes > 0 ? 4 : 0);
		const compY = seqY + LINE_HEIGHT + 2;
		const endY = effectiveShowComplement ? compY + LINE_HEIGHT : seqY + LINE_HEIGHT;
		return { seqY, endY };
	}

	function rowParts(rowStart: number, rowEnd: number): Part[] {
		return parts.filter((p) => p.start < rowEnd && p.end > rowStart);
	}

	function rowTranslations(rowStart: number, rowEnd: number): Translation[] {
		return translations.filter((t) => {
			const tEnd = t.start + t.aminoAcids.length * 3;
			return tEnd > rowStart && t.start < rowEnd;
		});
	}

	let ariaLabel = $derived.by(() => {
		switch (alphabet) {
			case 'protein': return 'Protein sequence viewer';
			case 'rna': return 'RNA sequence viewer';
			default: return 'DNA sequence viewer';
		}
	});

	/** Auto-scroll to selection when it changes externally */
	$effect(() => {
		if (!selectionState || !containerEl) return;
		const range = selectionState.range;
		if (!range) return;

		const targetRow = Math.floor(range.start / charsPerRow);
		if (targetRow >= 0 && targetRow < rowPositions.length) {
			const rp = rowPositions[targetRow];
			const viewTop = containerEl.scrollTop;
			const viewBottom = viewTop + height;
			if (rp.y < viewTop || rp.y + rp.height > viewBottom) {
				containerEl.scrollTop = Math.max(0, rp.y - height / 3);
			}
		}
	});
</script>

<div
	class="hatch-sequence-viewer"
	style:width="{width}px"
	style:height="{height}px"
	bind:this={containerEl}
	onscroll={handleScroll}
>
	<!-- Selection info bar -->
	{#if selectionInfo}
		<div class="selection-bar">
			Selection: {selectionInfo}
		</div>
	{/if}

	<svg
		width={svgWidth}
		height={totalSvgHeight}
		class="hatch-sequence-svg"
		role="img"
		aria-label={ariaLabel}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		{#each rows as row, i}
			{#if i >= visibleRange.start && i < visibleRange.end}
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
							fill="var(--hatch-selection-fill, rgba(0, 130, 250, 0.3))"
							rx="2"
						/>
						<!-- Grab handles at selection boundaries -->
						{#if hlStart === (selRange?.start ?? -1)}
							<rect
								x={SEQ_X + (hlStart - row.start) * charWidth - 2}
								y={0}
								width="4"
								height={rp.height}
								fill="var(--hatch-selection-handle, rgba(0, 130, 250, 0.8))"
								rx="1"
								class="grab-handle"
							/>
						{/if}
						{#if hlEnd === (selRange?.end ?? -1)}
							<rect
								x={SEQ_X + (hlEnd - row.start) * charWidth - 2}
								y={0}
								width="4"
								height={rp.height}
								fill="var(--hatch-selection-handle, rgba(0, 130, 250, 0.8))"
								rx="1"
								class="grab-handle"
							/>
						{/if}
					{/if}

					<!-- Blinking caret -->
					{#if caretPos >= row.start && caretPos < rowEnd}
						<line
							x1={SEQ_X + (caretPos - row.start) * charWidth}
							y1={0}
							x2={SEQ_X + (caretPos - row.start) * charWidth}
							y2={rp.height}
							stroke="var(--hatch-caret-color, #333)"
							stroke-width="1.5"
							class="caret-line"
						/>
					{/if}

					<!-- Cut site markers — whiskers span only forward+complement strands, non-interactive -->
					{#if effectiveShowComplement}
					{@const sb = strandBounds(row.start, rowEnd)}
					{#each effectiveCutSites as site}
						{#if site.position >= row.start && site.position < rowEnd}
							{@const topCut = site.cutPosition ?? 0}
							{@const botCut = site.complementCutPosition ?? 0}
							{@const isSticky = topCut !== botCut}
							{@const topX = SEQ_X + (site.position - row.start + topCut) * charWidth}
							{@const botX = SEQ_X + (site.position - row.start + botCut) * charWidth}
							{@const midY = (sb.seqY + sb.endY) / 2}
							{#if isSticky}
								<!-- Top snip line (forward strand) -->
								<line x1={topX} y1={sb.seqY} x2={topX} y2={midY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" pointer-events="none" />
								<!-- Horizontal connector showing overhang offset -->
								<line x1={topX} y1={midY} x2={botX} y2={midY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" pointer-events="none" />
								<!-- Bottom snip line (complement strand) -->
								<line x1={botX} y1={midY} x2={botX} y2={sb.endY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" pointer-events="none" />
							{:else}
								<line x1={topX} y1={sb.seqY} x2={topX} y2={sb.endY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.5" pointer-events="none" />
							{/if}
							<text
								x={topX}
								y={sb.seqY - 3}
								text-anchor="middle"
								fill="var(--hatch-cutsite-text, #d45858)"
								font-size="8"
								font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
								pointer-events="none"
							>{site.enzyme}</text>
						{/if}
					{/each}
					{/if}

					<SequenceRow
						seq={row.seq}
						start={row.start}
						{alphabet}
						parts={rowParts(row.start, rowEnd)}
						translations={rowTranslations(row.start, rowEnd)}
						{charWidth}
						{showNumbers}
						showAnnotations={showAnnotations}
						showTranslations={effectiveShowTranslations}
						showComplement={effectiveShowComplement}
						colorBases={effectiveColorBases}
						onpartclick={handlePartClick}
						onparthover={handlePartHover}
					/>
				</g>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.hatch-sequence-viewer {
		overflow-y: auto;
		overflow-x: auto;
		background: var(--hatch-seq-bg, #0c1018);
		border: 1px solid var(--hatch-seq-border, #2a3848);
		border-radius: 6px;
		position: relative;
		cursor: text;
		user-select: none;
	}

	.hatch-sequence-svg {
		display: block;
	}

	.selection-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		padding: 3px 10px;
		background: var(--hatch-selection-bar-bg, rgba(59, 130, 246, 0.2));
		border-bottom: 1px solid var(--hatch-selection-bar-border, rgba(59, 130, 246, 0.3));
		color: var(--hatch-highlight, #6ab8e0);
		font-size: 11px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.caret-line {
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		50% { opacity: 0; }
	}

	.grab-handle {
		cursor: ew-resize;
		opacity: 0.8;
	}
</style>
