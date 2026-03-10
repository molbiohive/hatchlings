<script lang="ts">
	import type { Part, CutSite, Translation } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import SequenceRow from './SequenceRow.svelte';

	interface Props {
		/** Full sequence string */
		seq: string;
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
		/** Show complement strand */
		showComplement?: boolean;
		/** Color bases */
		colorBases?: boolean;
		/** Sequence topology (circular allows wrapping cut site selection) */
		topology?: 'circular' | 'linear';
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
		parts = [],
		cutSites = [],
		translations = [],
		selectionState,
		charsPerRow: charsPerRowProp,
		charWidth = 10,
		width = 700,
		height = 500,
		showAnnotations = true,
		showTranslations = true,
		showNumbers = true,
		showComplement = true,
		colorBases = false,
		topology = 'linear',
		onselect,
		onpartclick,
		oncopysequence,
		onhoverinfo,
	}: Props = $props();

	const LABEL_PAD = 16; // space for 5'/3' strand labels on each side
	const SEQ_X = LABEL_PAD;
	const ROW_PADDING = 4;

	/** Auto-compute chars per row from width if not explicitly set */
	let charsPerRow = $derived(
		charsPerRowProp ?? Math.max(10, Math.floor((width - LABEL_PAD * 2 - ROW_PADDING) / charWidth))
	);
	const BUFFER_ROWS = 2;
	const CUTSITE_LABEL_H = 14;

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

	/** Check if a row has any cut sites (including those whose whiskers extend into this row) */
	function rowHasCutSites(rowStart: number, rowEnd: number): boolean {
		return cutSites.some((cs) => {
			const csEnd = cutSiteEnd(cs);
			return cs.position < rowEnd && csEnd > rowStart;
		});
	}

	/** Count annotation lanes for a row */
	function countAnnotationLanes(rowStart: number, rowEnd: number): number {
		if (!showAnnotations) return 0;
		const visParts = parts.filter((p) => p.start < rowEnd && p.end > rowStart);
		if (visParts.length === 0) return 0;
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
		return lanes.length;
	}

	/** Height of the inline position ruler */
	let RULER_HEIGHT = $derived(showNumbers ? 16 : 0);

	/** Compute estimated height per row based on visible tracks */
	function estimateRowHeight(rowStart: number, rowEnd: number): number {
		let h = RULER_HEIGHT + 14; // ruler + base sequence height

		if (showComplement) h += 14 + 2;

		const annotLanes = countAnnotationLanes(rowStart, rowEnd);
		if (annotLanes > 0) h += annotLanes * 18 + 4;

		if (showTranslations) {
			const visTrans = translations.filter((t) => t.start < rowEnd && t.end > rowStart);
			if (visTrans.length > 0) h += 24;
		}

		// Add space for cut site enzyme labels above annotations
		if (rowHasCutSites(rowStart, rowEnd)) h += CUTSITE_LABEL_H;

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

	const svgWidth = $derived(width);

	/** Virtual scrolling state */
	let scrollTop = $state(0);
	let containerEl: HTMLDivElement | undefined = $state(undefined);

	function handleScroll() {
		if (containerEl) scrollTop = containerEl.scrollTop;
	}

	/** Compute visible row indices based on scroll position */
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

	/* Selection state — use SelectionState if provided, otherwise internal */
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

	function bpFromMouseEvent(e: MouseEvent): number {
		const svgEl = (e.currentTarget as Element).closest('svg');
		if (!svgEl) return -1;
		const rect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
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
					onselect?.({ start: range.start, end: range.end, sequence: seq.slice(range.start, range.end) });
				}
			} else {
				if (internalSelStart >= 0 && internalSelEnd >= 0 && internalSelStart !== internalSelEnd) {
					const sStart = Math.min(internalSelStart, internalSelEnd);
					const sEnd = Math.max(internalSelStart, internalSelEnd) + 1;
					onselect?.({ start: sStart, end: sEnd, sequence: seq.slice(sStart, sEnd) });
				}
			}
		}
	}

	let selectionInfo = $derived.by(() => {
		if (!selRange) return '';
		const len = selRange.end - selRange.start;
		if (len <= 0) return '';
		return `${selRange.start + 1}..${selRange.end} (${len} bp)`;
	});

	function handlePartClick(part: Part) {
		onpartclick?.(part);
		if (selectionState) {
			selectionState.setSelection(part.start, part.end);
			onselect?.({ start: part.start, end: part.end, sequence: seq.slice(part.start, part.end) });
		}
	}

	function handlePartHover(part: Part | null, e?: MouseEvent) {
		if (!part || !e) { onhoverinfo?.(null); return; }
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

	function handleCutSiteHover(site: CutSite | null, e?: MouseEvent) {
		if (!site || !e) { onhoverinfo?.(null); return; }
		onhoverinfo?.({
			title: site.enzyme,
			items: [
				{ label: 'Position', value: site.position, unit: 'bp' },
				{ label: 'Strand', value: site.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				...(site.overhang ? [{ label: 'Overhang', value: site.overhang }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function cutSiteEnd(site: CutSite): number {
		if (site.end !== undefined) return site.end;
		return site.position + Math.max(site.cutPosition ?? 1, site.complementCutPosition ?? 1);
	}

	/** Cluster nearby cut sites per row so dense MCS regions show "+N" */
	const CLUSTER_CHAR_DIST = 4;
	type SeqCutCluster = { primary: CutSite; enzymes: string[]; sites: CutSite[] };

	function clusterRowCutSites(rowStart: number, rowEnd: number): SeqCutCluster[] {
		const rowSites = cutSites
			.filter((cs) => {
				const csEnd = cutSiteEnd(cs);
				return cs.position < rowEnd && csEnd > rowStart;
			})
			.sort((a, b) => a.position - b.position);
		if (rowSites.length === 0) return [];

		const clusters: SeqCutCluster[] = [];
		let current: SeqCutCluster = { primary: rowSites[0], enzymes: [rowSites[0].enzyme], sites: [rowSites[0]] };

		for (let i = 1; i < rowSites.length; i++) {
			const charDist = rowSites[i].position - current.primary.position;
			if (charDist <= CLUSTER_CHAR_DIST) {
				current.enzymes.push(rowSites[i].enzyme);
				current.sites.push(rowSites[i]);
			} else {
				clusters.push(current);
				current = { primary: rowSites[i], enzymes: [rowSites[i].enzyme], sites: [rowSites[i]] };
			}
		}
		clusters.push(current);
		return clusters;
	}

	/** Clamp an X coordinate to the visible row area */
	function clampX(x: number, rowLen: number): number {
		return Math.max(SEQ_X, Math.min(x, SEQ_X + rowLen * charWidth));
	}

	/** Get the full bp range for a cluster (first site start to last site end) */
	function clusterRange(cluster: SeqCutCluster): { start: number; end: number } {
		const first = cluster.sites[0];
		const last = cluster.sites[cluster.sites.length - 1];
		return { start: first.position, end: cutSiteEnd(last) };
	}

	function handleCutSiteClick(site: CutSite) {
		const s = site.position;
		const e = cutSiteEnd(site);
		if (selectionState) {
			selectionState.setSelection(s, e);
			onselect?.({ start: s, end: e, sequence: seq.slice(s, e) });
		} else {
			internalSelStart = s;
			internalSelEnd = e - 1;
		}
	}

	function handleClusterClick(cluster: SeqCutCluster) {
		const r = clusterRange(cluster);
		if (selectionState) {
			selectionState.setSelection(r.start, r.end);
			onselect?.({ start: r.start, end: r.end, sequence: seq.slice(r.start, r.end) });
		} else {
			internalSelStart = r.start;
			internalSelEnd = r.end - 1;
		}
	}

	function handleClusterHover(cluster: SeqCutCluster | null, e?: MouseEvent) {
		if (!cluster || !e) { onhoverinfo?.(null); return; }
		const r = clusterRange(cluster);
		onhoverinfo?.({
			title: cluster.enzymes.join(', '),
			items: [
				{ label: 'Enzymes', value: cluster.enzymes.length },
				{ label: 'Region', value: `${r.start}..${r.end}`, unit: 'bp' },
				...cluster.sites.map(s => ({ label: s.enzyme, value: s.position, unit: 'bp' })),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	/** Compute strand Y bounds WITHIN SequenceRow (relative to its own origin) */
	function strandBounds(rowStart: number, rowEnd: number): { seqY: number; endY: number; annotH: number } {
		const LINE_HEIGHT = 14;
		const annotLanes = countAnnotationLanes(rowStart, rowEnd);
		const annotH = RULER_HEIGHT + annotLanes * 18 + (annotLanes > 0 ? 4 : 0);
		const csGap = rowHasCutSites(rowStart, rowEnd) ? CUTSITE_LABEL_H : 0;
		const seqY = annotH + csGap;
		const compY = seqY + LINE_HEIGHT + 2;
		const endY = showComplement ? compY + LINE_HEIGHT : seqY + LINE_HEIGHT;
		return { seqY, endY, annotH };
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
	style:max-height={height ? `${height}px` : undefined}
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
		class="hatch-sequence-svg"
		role="application"
		aria-label="DNA sequence viewer"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
	>
		{#each rows as row, i}
			{#if i >= visibleRange.start && i < visibleRange.end}
				{@const rowEnd = row.start + row.seq.length}
				{@const rp = rowPositions[i]}
				{@const hasCutSites = rowHasCutSites(row.start, rowEnd)}

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

					<!-- SequenceRow (cutsiteGap pushes sequence below annotation+label zone) -->
					<SequenceRow
						seq={row.seq}
						start={row.start}
						parts={rowParts(row.start, rowEnd)}
						translations={rowTranslations(row.start, rowEnd)}
						{charWidth}
						{showNumbers}
						{showAnnotations}
						{showTranslations}
						{showComplement}
						{colorBases}
						cutsiteGap={hasCutSites ? CUTSITE_LABEL_H : 0}
						onpartclick={handlePartClick}
						onparthover={handlePartHover}
					/>

					<!-- Cut site markers — all positions visible, labels clustered -->
					{#if hasCutSites}
					{@const sb = strandBounds(row.start, rowEnd)}
					{@const clusters = clusterRowCutSites(row.start, rowEnd)}
					{#each clusters as cluster}
						{@const cr = clusterRange(cluster)}
						{@const visStart = Math.max(cr.start, row.start)}
						{@const visEnd = Math.min(cr.end, rowEnd)}
						{@const bgLeftX = SEQ_X + (visStart - row.start) * charWidth}
						{@const bgRightX = SEQ_X + (visEnd - row.start) * charWidth}
						{@const labelX = (bgLeftX + bgRightX) / 2}
						{@const labelY = sb.annotH + CUTSITE_LABEL_H / 2}
						{@const whiskerTop = sb.seqY}
						{@const whiskerBot = sb.endY}
						{@const labelText = cluster.enzymes.length === 1 ? cluster.primary.enzyme : cluster.primary.enzyme + ' +' + (cluster.enzymes.length - 1)}
						{@const showLabel = cluster.primary.position >= row.start && cluster.primary.position < rowEnd}
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<g
							class="cutsite-marker"
							role="button"
							tabindex="-1"
							onmouseover={(e) => cluster.sites.length > 1 ? handleClusterHover(cluster, e) : handleCutSiteHover(cluster.primary, e)}
							onmouseout={() => cluster.sites.length > 1 ? handleClusterHover(null) : handleCutSiteHover(null)}
							onclick={(e) => { e.stopPropagation(); cluster.sites.length > 1 ? handleClusterClick(cluster) : handleCutSiteClick(cluster.primary); }}
							onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); cluster.sites.length > 1 ? handleClusterClick(cluster) : handleCutSiteClick(cluster.primary); } }}
						>
							<!-- Semi-transparent background matching the selection area -->
							<rect
								x={bgLeftX}
								y={sb.annotH}
								width={bgRightX - bgLeftX}
								height={whiskerBot - sb.annotH}
								class="cutsite-bg"
								rx="2"
							/>
							<!-- Clustered label (only on the row where the primary site starts) -->
							{#if showLabel}
								<text
									x={labelX}
									y={labelY}
									text-anchor="middle"
									dominant-baseline="middle"
									fill="var(--hatch-cutsite-text, #d45858)"
									font-size="8"
									font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
									class="cutsite-label"
								>{labelText}</text>
							{/if}
							<!-- Whisker lines for EVERY site in the cluster, clamped to row -->
							{#each cluster.sites as cs}
								{@const topCut = cs.cutPosition ?? 0}
								{@const botCut = cs.complementCutPosition ?? 0}
								{@const isSticky = topCut !== botCut}
								{@const rawTopX = SEQ_X + (cs.position - row.start + topCut) * charWidth}
								{@const rawBotX = SEQ_X + (cs.position - row.start + botCut) * charWidth}
								{@const topX = clampX(rawTopX, row.seq.length)}
								{@const botX = clampX(rawBotX, row.seq.length)}
								{@const midY = (whiskerTop + whiskerBot) / 2}
								{#if isSticky}
									<line x1={topX} y1={whiskerTop} x2={topX} y2={midY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" />
									<line x1={topX} y1={midY} x2={botX} y2={midY} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" />
									<line x1={botX} y1={midY} x2={botX} y2={whiskerBot} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.6" />
								{:else}
									<line x1={topX} y1={whiskerTop} x2={topX} y2={whiskerBot} stroke="var(--hatch-cutsite-color, #d45858)" stroke-width="1" stroke-opacity="0.5" />
								{/if}
							{/each}
						</g>
					{/each}
					{/if}
				</g>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.hatch-sequence-viewer {
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--hatch-bg, #0c1018);
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

	.cutsite-marker {
		cursor: pointer;
	}

	.cutsite-bg {
		fill: var(--hatch-cutsite-bg, rgba(212, 88, 88, 0.06));
		stroke: none;
		transition: fill 0.15s;
	}

	.cutsite-marker:hover .cutsite-bg {
		fill: var(--hatch-cutsite-bg-hover, rgba(212, 88, 88, 0.15));
	}

	.cutsite-marker:hover line {
		stroke-opacity: 1;
		stroke-width: 1.5;
	}

	.cutsite-marker:hover .cutsite-label {
		font-weight: 700;
	}
</style>
