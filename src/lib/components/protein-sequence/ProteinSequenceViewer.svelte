<script lang="ts">
	import type { ProteinAnnotation } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { SEQ_PAD, ROW_PADDING, BUFFER_ROWS, AA_BLOCK_H } from '../../util/layout.js';
	import ProteinRow from './ProteinRow.svelte';

	interface Props {
		seq?: string;
		dnaSource?: string;
		frame?: 0 | 1 | 2;
		annotations?: ProteinAnnotation[];
		showCodons?: boolean;
		colorResidues?: boolean;
		showNumbers?: boolean;
		selectionState?: SelectionState;
		charsPerRow?: number;
		charWidth?: number;
		width?: number;
		height?: number;
		onselect?: (sel: { start: number; end: number }) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		seq: seqProp,
		dnaSource,
		frame = 0,
		annotations = [],
		showCodons = false,
		colorResidues = true,
		showNumbers = true,
		selectionState,
		charsPerRow: charsPerRowProp,
		charWidth = 20,
		width = 700,
		height = 400,
		onselect,
		onhoverinfo,
	}: Props = $props();

	// --- Codon table ---
	const CODON_TABLE: Record<string, string> = {
		TTT:'F',TTC:'F',TTA:'L',TTG:'L',
		CTT:'L',CTC:'L',CTA:'L',CTG:'L',
		ATT:'I',ATC:'I',ATA:'I',ATG:'M',
		GTT:'V',GTC:'V',GTA:'V',GTG:'V',
		TCT:'S',TCC:'S',TCA:'S',TCG:'S',
		CCT:'P',CCC:'P',CCA:'P',CCG:'P',
		ACT:'T',ACC:'T',ACA:'T',ACG:'T',
		GCT:'A',GCC:'A',GCA:'A',GCG:'A',
		TAT:'Y',TAC:'Y',TAA:'*',TAG:'*',
		CAT:'H',CAC:'H',CAA:'Q',CAG:'Q',
		AAT:'N',AAC:'N',AAA:'K',AAG:'K',
		GAT:'D',GAC:'D',GAA:'E',GAG:'E',
		TGT:'C',TGC:'C',TGA:'*',TGG:'W',
		CGT:'R',CGC:'R',CGA:'R',CGG:'R',
		AGT:'S',AGC:'S',AGA:'R',AGG:'R',
		GGT:'G',GGC:'G',GGA:'G',GGG:'G',
	};

	function translateDNA(dna: string, f: number): { aas: string; codons: string[] } {
		let aas = '';
		const codons: string[] = [];
		for (let i = f; i + 2 < dna.length; i += 3) {
			const codon = dna.slice(i, i + 3).toUpperCase();
			aas += CODON_TABLE[codon] ?? '?';
			codons.push(codon);
		}
		return { aas, codons };
	}

	// --- Derived sequence + codons ---
	const translated = $derived.by(() => {
		if (dnaSource) return translateDNA(dnaSource, frame);
		return null;
	});

	const seq = $derived(seqProp ?? translated?.aas ?? '');
	const allCodons = $derived(translated?.codons ?? []);

	// --- Layout ---
	const availableW = $derived(width - SEQ_PAD - SEQ_PAD);
	let charsPerRow = $derived(
		charsPerRowProp ?? Math.max(10, Math.floor(availableW / charWidth))
	);
	let effectiveCharWidth = $derived(
		charsPerRowProp ? charWidth : availableW / charsPerRow
	);

	const rows = $derived.by(() => {
		const result: { seq: string; start: number; codons: string[] }[] = [];
		for (let i = 0; i < seq.length; i += charsPerRow) {
			result.push({
				seq: seq.slice(i, i + charsPerRow),
				start: i,
				codons: allCodons.slice(i, i + charsPerRow),
			});
		}
		return result;
	});

	// --- Row height estimation ---
	const RULER_H = $derived(showNumbers ? 16 : 0);
	const CODON_TRACK_H = $derived(showCodons && allCodons.length > 0 ? 16 : 0);

	function countAnnotationLanes(rowStart: number, rowEnd: number): number {
		const vis = annotations.filter((a) => a.start < rowEnd && a.end > rowStart);
		if (vis.length === 0) return 0;
		const sorted = [...vis].sort((a, b) => a.start - b.start);
		const lanes: { end: number }[] = [];
		for (const ann of sorted) {
			let assigned = false;
			for (const lane of lanes) {
				if (ann.start >= lane.end) { lane.end = ann.end; assigned = true; break; }
			}
			if (!assigned) lanes.push({ end: ann.end });
		}
		return lanes.length;
	}

	function estimateRowHeight(rowStart: number, rowEnd: number): number {
		let h = RULER_H + AA_BLOCK_H;
		const annotLanes = countAnnotationLanes(rowStart, rowEnd);
		if (annotLanes > 0) h += annotLanes * 18 + 4;
		h += CODON_TRACK_H;
		return h;
	}

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

	const svgWidth = $derived(SEQ_PAD + charsPerRow * effectiveCharWidth + SEQ_PAD);

	// --- Virtual scroll ---
	let scrollTop = $state(0);
	let containerEl: HTMLDivElement | undefined = $state(undefined);

	function handleScroll() {
		if (containerEl) scrollTop = containerEl.scrollTop;
	}

	const visibleRange = $derived.by(() => {
		if (rows.length === 0) return { start: 0, end: 0 };
		const viewTop = scrollTop;
		const viewBottom = scrollTop + height;
		let startIdx = 0;
		let endIdx = rows.length;
		for (let i = 0; i < rowPositions.length; i++) {
			if (rowPositions[i].y + rowPositions[i].height >= viewTop) {
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

	// --- Selection ---
	let internalSelStart = $state(-1);
	let internalSelEnd = $state(-1);
	let isSelecting = $state(false);

	const selRange = $derived.by(() => {
		if (selectionState) return selectionState.range;
		if (internalSelStart < 0 || internalSelEnd < 0) return null;
		return {
			start: Math.min(internalSelStart, internalSelEnd),
			end: Math.max(internalSelStart, internalSelEnd) + 1,
		};
	});

	const caretPos = $derived.by(() => {
		if (selectionState) return selectionState.caretPosition;
		if (internalSelStart >= 0 && internalSelStart === internalSelEnd) return internalSelStart;
		return -1;
	});

	const SEQ_X = SEQ_PAD;

	function aaFromMouseEvent(e: MouseEvent): number {
		const svgEl = (e.currentTarget as Element).closest('svg');
		if (!svgEl) return -1;
		const rect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		for (let i = 0; i < rows.length; i++) {
			const rp = rowPositions[i];
			if (mouseY >= rp.y && mouseY <= rp.y + rp.height) {
				const charIndex = Math.floor((mouseX - SEQ_X) / effectiveCharWidth);
				if (charIndex >= 0 && charIndex < rows[i].seq.length) {
					return rows[i].start + charIndex;
				}
			}
		}
		return -1;
	}

	function handleMouseDown(e: MouseEvent) {
		const pos = aaFromMouseEvent(e);
		if (pos >= 0) {
			if (selectionState) {
				selectionState.startDrag(pos);
			} else {
				internalSelStart = pos;
				internalSelEnd = pos;
			}
			isSelecting = true;
			window.addEventListener('mousemove', handleWindowMouseMove);
			window.addEventListener('mouseup', handleWindowMouseUp);
		}
	}

	function handleWindowMouseMove(e: MouseEvent) {
		if (!isSelecting) return;
		const svgEl = containerEl?.querySelector('svg');
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		let pos = -1;
		for (let i = 0; i < rows.length; i++) {
			const rp = rowPositions[i];
			if (mouseY >= rp.y && mouseY <= rp.y + rp.height) {
				const charIndex = Math.floor((mouseX - SEQ_X) / effectiveCharWidth);
				if (charIndex >= 0 && charIndex < rows[i].seq.length) {
					pos = rows[i].start + charIndex;
				}
				break;
			}
		}
		if (pos >= 0) {
			if (selectionState) {
				selectionState.updateDragLinear(pos);
			} else {
				internalSelEnd = pos;
			}
		}
	}

	function handleWindowMouseUp() {
		if (isSelecting) {
			isSelecting = false;
			window.removeEventListener('mousemove', handleWindowMouseMove);
			window.removeEventListener('mouseup', handleWindowMouseUp);
			if (selectionState) {
				selectionState.endDrag();
				const range = selectionState.range;
				if (range) onselect?.({ start: range.start, end: range.end });
			} else {
				if (internalSelStart >= 0 && internalSelEnd >= 0 && internalSelStart !== internalSelEnd) {
					const sStart = Math.min(internalSelStart, internalSelEnd);
					const sEnd = Math.max(internalSelStart, internalSelEnd) + 1;
					onselect?.({ start: sStart, end: sEnd });
				}
			}
		}
	}

	function selOverlapsRow(rowStart: number, rowEnd: number): boolean {
		if (!selRange) return false;
		return selRange.start < rowEnd && selRange.end > rowStart;
	}

	const selectionInfo = $derived.by(() => {
		if (!selRange) return '';
		const len = selRange.end - selRange.start;
		if (len === 0) return '';
		return `${selRange.start + 1}..${selRange.end} (${len} aa)`;
	});

	function handleAnnotationClick(ann: ProteinAnnotation) {
		if (selectionState) {
			selectionState.setSelection(ann.start, ann.end);
		} else {
			internalSelStart = ann.start;
			internalSelEnd = ann.end - 1;
		}
		onselect?.({ start: ann.start, end: ann.end });
	}

	function handleAnnotationHover(ann: ProteinAnnotation | null, e?: MouseEvent) {
		if (!ann || !e) { onhoverinfo?.(null); return; }
		onhoverinfo?.({
			title: ann.name,
			items: [
				{ label: 'Type', value: ann.type },
				{ label: 'Location', value: `${ann.start + 1}..${ann.end}` },
				{ label: 'Length', value: ann.end - ann.start, unit: 'aa' },
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	// Auto-scroll to selection
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
	class="hatch-protein-sequence-viewer"
	style:width="{svgWidth}px"
	style:height={height ? `${height}px` : undefined}
	bind:this={containerEl}
	onscroll={handleScroll}
>
	{#if selectionInfo}
		<div class="selection-bar">
			Selection: {selectionInfo}
		</div>
	{/if}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		width={svgWidth}
		height={totalSvgHeight}
		class="hatch-protein-sequence-svg"
		role="application"
		aria-label="Protein sequence viewer"
		onmousedown={handleMouseDown}
	>
		{#each rows as row, i (row.start)}
			{#if i >= visibleRange.start && i < visibleRange.end}
				{@const rowEnd = row.start + row.seq.length}
				{@const rp = rowPositions[i]}

				<g transform="translate(0, {rp.y})">
					<!-- Selection highlight -->
					{#if selRange && selOverlapsRow(row.start, rowEnd)}
						{@const hlStart = Math.max(selRange.start, row.start)}
						{@const hlEnd = Math.min(selRange.end, rowEnd)}
						<rect
							x={SEQ_X + (hlStart - row.start) * effectiveCharWidth}
							y={0}
							width={(hlEnd - hlStart) * effectiveCharWidth}
							height={rp.height}
							fill="var(--hatch-selection-fill, rgba(0, 130, 250, 0.3))"
							rx="2"
						/>
						{#if hlStart === (selRange?.start ?? -1)}
							<rect
								x={SEQ_X + (hlStart - row.start) * effectiveCharWidth - 2}
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
								x={SEQ_X + (hlEnd - row.start) * effectiveCharWidth - 2}
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
							x1={SEQ_X + (caretPos - row.start) * effectiveCharWidth}
							y1={0}
							x2={SEQ_X + (caretPos - row.start) * effectiveCharWidth}
							y2={rp.height}
							stroke="var(--hatch-caret-color, #333)"
							stroke-width="1.5"
							class="caret-line"
						/>
					{/if}

					<ProteinRow
						seq={row.seq}
						start={row.start}
						codons={row.codons}
						{annotations}
						charWidth={effectiveCharWidth}
						{showNumbers}
						{showCodons}
						{colorResidues}
						onannotationclick={handleAnnotationClick}
						onannotationhover={handleAnnotationHover}
					/>
				</g>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.hatch-protein-sequence-viewer {
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--hatch-bg, #0c1018);
		position: relative;
		cursor: text;
		user-select: none;
	}

	.hatch-protein-sequence-svg {
		display: block;
	}

	.selection-bar {
		position: sticky;
		top: 4px;
		float: right;
		z-index: 10;
		padding: 2px 8px;
		margin-right: 4px;
		margin-bottom: -20px;
		border-radius: 3px;
		background: var(--hatch-bg, rgba(12, 16, 24, 0.85));
		color: var(--hatch-highlight, #6ab8e0);
		font-size: 10px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
	}

	.grab-handle {
		cursor: ew-resize;
		opacity: 0.8;
	}

	.caret-line {
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		50% { opacity: 0; }
	}
</style>
