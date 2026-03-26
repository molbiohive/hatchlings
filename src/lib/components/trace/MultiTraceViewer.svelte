<script lang="ts">
	import type { TraceData } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { nucleotideColors } from '../../util/colors.js';
	import TraceViewer from './TraceViewer.svelte';

	interface Props {
		data?: TraceData[];
		/** Array of trace data, one per lane */
		traces?: TraceData[];
		/** Total width in pixels */
		width?: number;
		/** Height per lane in pixels */
		laneHeight?: number;
		/** Show quality sidebar per lane */
		showQuality?: boolean;
		/** Default quality trim threshold */
		trimQuality?: number;
		/** Initial zoom level */
		zoom?: number;
		/** Callback when a base is selected */
		onselect?: (traceIndex: number, baseIndex: number) => void;
		/** Hover info callback */
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		data,
		traces: tracesProp,
		width = 800,
		laneHeight = 200,
		showQuality = true,
		trimQuality = 20,
		zoom: initialZoom = 1,
		onselect,
		onhoverinfo,
	}: Props = $props();

	const traces = $derived(tracesProp ?? data ?? []);

	let sharedZoom = $state(1);
	$effect(() => { sharedZoom = initialZoom; });
	let sharedScrollX = $state(0);

	function handleZoomChange(newZoom: number) {
		sharedZoom = newZoom;
	}

	function handleScrollChange(newScrollX: number) {
		sharedScrollX = newScrollX;
	}

	const LABEL_WIDTH = 44;
	const QUALITY_BAR_WIDTH = 40;
	let traceContentWidth = $derived(width - LABEL_WIDTH);
	let viewportWidth = $derived(traceContentWidth - (showQuality ? QUALITY_BAR_WIDTH : 0));

	/** Total data width from longest trace for shared scrollbar */
	let totalDataWidth = $derived.by(() => {
		let maxLen = 0;
		for (const trace of traces) {
			const len = Math.max(trace.channels.A.length, trace.channels.C.length, trace.channels.G.length, trace.channels.T.length);
			if (len > maxLen) maxLen = len;
		}
		return maxLen * sharedZoom;
	});

	let showSharedScrollbar = $derived(totalDataWidth > viewportWidth);
	let thumbLeft = $derived(totalDataWidth > 0 ? (sharedScrollX / totalDataWidth) * 100 : 0);
	let thumbWidth = $derived(totalDataWidth > 0 ? Math.max(5, (viewportWidth / totalDataWidth) * 100) : 100);

	/** Traces that have alignments */
	let alignedTraces = $derived(traces.filter(t => t.alignment));
	let hasAlignments = $derived(alignedTraces.length > 0);

	/** Combined alignment panel */
	const ALIGN_FONT = 10;
	const ALIGN_LINE_H = 14;
	const ALIGN_PAD = 4;
	let alignPanelHeight = $derived(hasAlignments ? ALIGN_PAD + ALIGN_LINE_H + (alignedTraces.length * ALIGN_LINE_H) + ALIGN_PAD : 0);

	let refSeq = $derived(alignedTraces.length > 0 ? alignedTraces[0].alignment!.refSeq : '');

	let mismatchMaps = $derived.by(() => {
		return alignedTraces.map(t => {
			const map = new Map<number, string>();
			if (!t.alignment) return map;
			for (const m of t.alignment.mismatches) {
				switch (m.type) {
					case 'substitution': map.set(m.pos, '#e41a1c'); break;
					case 'insertion': map.set(m.pos, '#377eb8'); break;
					case 'deletion': map.set(m.pos, '#999999'); break;
				}
			}
			return map;
		});
	});

	let alignPeaks = $derived(alignedTraces.length > 0 ? alignedTraces[0].peakPositions : []);

	let visibleAlignCols = $derived.by(() => {
		if (!hasAlignments) return [];
		const len = refSeq.length;
		const cols: Array<{
			i: number;
			x: number;
			refBase: string;
			queries: Array<{ base: string; color: string; mismatchColor: string | null }>;
			anyMismatch: boolean;
		}> = [];

		for (let i = 0; i < len; i++) {
			const peakIdx = i < alignPeaks.length ? alignPeaks[i] : i * 10;
			const x = peakIdx * sharedZoom - sharedScrollX;
			if (x < -20 || x > viewportWidth + 20) continue;

			const rb = refSeq[i];
			let anyMismatch = false;
			const queries = alignedTraces.map((t, ti) => {
				const qBase = t.alignment!.querySeq[i] ?? '-';
				const mc = mismatchMaps[ti].get(i) ?? null;
				if (mc) anyMismatch = true;
				return {
					base: qBase,
					color: mc ?? (nucleotideColors[qBase] ?? '#888'),
					mismatchColor: mc,
				};
			});

			cols.push({ i, x, refBase: rb, queries, anyMismatch });
		}
		return cols;
	});
</script>

<div class="multi-trace-viewer" style="width: {width}px;">
	{#each traces as trace, i}
		<div class="trace-lane">
			<div class="lane-label" style="width: {LABEL_WIDTH}px; height: {laneHeight}px;">
				<span class="lane-name">{trace.label ?? `Lane ${i + 1}`}</span>
			</div>
			<TraceViewer
				baseCalls={trace.baseCalls}
				qualityScores={trace.qualityScores}
				channels={trace.channels}
				peakPositions={trace.peakPositions}
				width={traceContentWidth}
				height={laneHeight}
				{showQuality}
				trimQuality={trace.trimQuality ?? trimQuality}
				zoom={sharedZoom}
				scrollX={sharedScrollX}
				onzoomchange={handleZoomChange}
				onscrollchange={handleScrollChange}
				onselect={onselect ? (idx) => onselect(i, idx) : undefined}
				{onhoverinfo}
				showScrollbar={false}
				embedded
			/>
		</div>
	{/each}

	<!-- Combined alignment panel -->
	{#if hasAlignments}
		<div class="align-lane">
			<div class="lane-label align-label" style="width: {LABEL_WIDTH}px; height: {alignPanelHeight}px;">
				<span class="lane-tag">ref</span>
				{#each alignedTraces as t, ti}
					<span class="lane-tag query-tag">{(t.label ?? `${traces.indexOf(t) + 1}`).slice(0, 3).toLowerCase()}</span>
				{/each}
			</div>
			<div class="align-content" style="width: {traceContentWidth}px;">
				<svg
					width={viewportWidth}
					height={alignPanelHeight}
					viewBox="0 0 {viewportWidth} {alignPanelHeight}"
					class="align-svg"
				>
					{#each visibleAlignCols as col}
						{#if col.anyMismatch}
							<rect
								x={col.x - 5}
								y={ALIGN_PAD - 1}
								width={10}
								height={ALIGN_LINE_H + col.queries.length * ALIGN_LINE_H + 2}
								fill="#e41a1c"
								fill-opacity="0.08"
								rx="2"
							/>
						{/if}

						<text
							x={col.x}
							y={ALIGN_PAD + ALIGN_FONT}
							text-anchor="middle"
							fill={col.anyMismatch ? '#e41a1c' : (nucleotideColors[col.refBase] ?? '#666')}
							fill-opacity={col.refBase === '-' ? 0.4 : 0.7}
							font-size={ALIGN_FONT}
							font-weight="500"
							font-family="var(--hatch-font-mono, 'SF Mono', monospace)"
						>{col.refBase}</text>

						{#each col.queries as q, qi}
							{@const yPos = ALIGN_PAD + ALIGN_LINE_H + qi * ALIGN_LINE_H + ALIGN_FONT}
							{#if !q.mismatchColor && q.base === col.refBase}
								<text
									x={col.x}
									y={yPos}
									text-anchor="middle"
									fill="var(--hatch-tick-minor, #2a3848)"
									font-size={ALIGN_FONT}
									font-family="var(--hatch-font-mono, 'SF Mono', monospace)"
								>·</text>
							{:else}
								<text
									x={col.x}
									y={yPos}
									text-anchor="middle"
									fill={q.color}
									fill-opacity={q.base === '-' ? 0.4 : 0.9}
									font-size={ALIGN_FONT}
									font-weight={q.mismatchColor ? '700' : '500'}
									font-family="var(--hatch-font-mono, 'SF Mono', monospace)"
								>{q.base}</text>
							{/if}
						{/each}
					{/each}
				</svg>
			</div>
		</div>
	{/if}

	{#if showSharedScrollbar}
		<div class="scroll-track">
			<div class="scroll-pad" style="width: {LABEL_WIDTH}px;"></div>
			<div class="scroll-bar" style="width: {traceContentWidth}px;">
				<div
					class="scroll-thumb"
					style="left: {thumbLeft}%; width: {thumbWidth}%;"
				></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.multi-trace-viewer {
		background: var(--hatch-bg, #0c1018);
		overflow: hidden;
	}

	.trace-lane {
		display: flex;
	}

	.align-lane {
		display: flex;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.lane-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		background: var(--hatch-plot-bg, #141c26);
		flex-shrink: 0;
	}

	.lane-name {
		color: var(--hatch-text-dim, #566070);
		font-size: 9px;
		font-weight: 600;
		font-family: var(--hatch-font-mono, 'SF Mono', monospace);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(180deg);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.align-label {
		flex-direction: column;
		justify-content: flex-start;
		padding-top: 4px;
		gap: 0;
	}

	.lane-tag {
		color: var(--hatch-text-dim, #566070);
		font-size: 8px;
		font-family: var(--hatch-font-mono, 'SF Mono', monospace);
		line-height: 14px;
		text-transform: lowercase;
	}

	.query-tag {
		color: var(--hatch-text-dim, #4a5868);
	}

	.align-content {
		overflow: hidden;
	}

	.align-svg {
		display: block;
		background: var(--hatch-bg, #0c1018);
	}

	.scroll-track {
		display: flex;
		height: 4px;
	}

	.scroll-pad {
		background: var(--hatch-plot-bg, #141c26);
		flex-shrink: 0;
	}

	.scroll-bar {
		background: var(--hatch-plot-bg, #141c26);
		position: relative;
	}

	.scroll-thumb {
		position: absolute;
		height: 100%;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		transition: background 0.15s;
	}

	.scroll-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
