<script lang="ts">
	import type { TraceChannel, TraceAlignment } from '../../types/index.js';
	import type { HoverInfo } from '../../types/utility.js';
	import TracePeaks from './TracePeaks.svelte';
	import BaseCallTrack from './BaseCallTrack.svelte';
	import AlignmentView from './AlignmentView.svelte';

	interface Props {
		/** Base call string (e.g. "ATCGATCG...") */
		baseCalls: string;
		/** Phred quality score for each base call */
		qualityScores: number[];
		/** Four-channel chromatogram data */
		channels: TraceChannel;
		/** Peak position for each base call (data point index) */
		peakPositions: number[];
		/** Alignment between trace and reference */
		alignment?: TraceAlignment;
		/** Total width of the viewer in pixels */
		width?: number;
		/** Total height of the viewer in pixels */
		height?: number;
		/** Whether to display quality scores */
		showQuality?: boolean;
		/** Quality threshold for dimming low-quality bases */
		trimQuality?: number;
		/** Whether to highlight insertions and deletions */
		highlightIndels?: boolean;
		/** Horizontal zoom factor */
		zoom?: number;
		/** External scroll position (for synchronized scrolling) */
		scrollX?: number;
		/** Callback when a base is selected */
		onselect?: (index: number) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
		/** Callback when zoom changes (for multi-trace sync) */
		onzoomchange?: (zoom: number) => void;
		/** Callback when scroll position changes (for multi-trace sync) */
		onscrollchange?: (scrollX: number) => void;
		/** Hide scrollbar (when parent provides a shared one) */
		showScrollbar?: boolean;
		/** Embedded mode — no border/background (used inside MultiTraceViewer) */
		embedded?: boolean;
	}

	let {
		baseCalls,
		qualityScores,
		channels,
		peakPositions,
		alignment,
		width = 800,
		height = 300,
		showQuality = true,
		trimQuality = 20,
		highlightIndels = true,
		zoom: initialZoom = 1,
		scrollX: externalScrollX,
		onselect,
		onhoverinfo,
		onzoomchange,
		onscrollchange,
		showScrollbar = true,
		embedded = false,
	}: Props = $props();

	let zoom = $state(0);
	// Initialize zoom from prop; $effect syncs prop changes
	$effect(() => { zoom = initialZoom; }); // eslint-disable-line -- intentional prop→state sync
	let scrollX = $state(0);
	// Sync external scroll position when provided
	$effect(() => { if (externalScrollX !== undefined) scrollX = externalScrollX; });
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartScrollX = $state(0);
	let container: HTMLDivElement | undefined = $state();

	/** Which channels are visible */
	let showChannels = $state({ A: true, C: true, G: true, T: true });

	/** Height allocation for sub-components */
	let peaksHeight = $derived(Math.round(height * 0.65));
	let baseCallHeight = 60; // fixed
	let alignmentHeight = $derived(alignment ? 50 : 0);
	let qualityBarWidth = $derived(showQuality ? 40 : 0);

	/** Total scrollable width based on data length and zoom */
	let totalDataWidth = $derived.by(() => {
		const maxLen = Math.max(
			channels.A.length,
			channels.C.length,
			channels.G.length,
			channels.T.length,
		);
		return maxLen * zoom;
	});

	/** Maximum scroll X */
	let maxScrollX = $derived(Math.max(0, totalDataWidth - (width - qualityBarWidth)));

	/** Clamp scroll position */
	function clampScroll(val: number): number {
		return Math.max(0, Math.min(val, maxScrollX));
	}

	/** Quality summary: average quality, and fraction above threshold */
	let qualitySummary = $derived.by(() => {
		if (qualityScores.length === 0) return { avg: 0, goodFraction: 0, scores: [] as number[] };
		const avg = qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length;
		const good = qualityScores.filter((q) => q >= trimQuality).length;
		return {
			avg: Math.round(avg * 10) / 10,
			goodFraction: good / qualityScores.length,
			scores: qualityScores,
		};
	});

	/** Build quality histogram (10 bins from 0-60) */
	let qualityBins = $derived.by(() => {
		const bins = new Array(10).fill(0);
		const binSize = 6;
		for (const q of qualityScores) {
			const idx = Math.min(Math.floor(q / binSize), bins.length - 1);
			bins[idx]++;
		}
		const maxBin = Math.max(...bins, 1);
		return bins.map((count, i) => ({
			count,
			fraction: count / maxBin,
			rangeStart: i * binSize,
			rangeEnd: (i + 1) * binSize,
			aboveThreshold: i * binSize >= trimQuality,
		}));
	});

	/** Handle mouse wheel for horizontal scrolling */
	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		if (e.ctrlKey || e.metaKey) {
			// Zoom with ctrl/cmd + scroll
			const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(0.5, Math.min(20, zoom * zoomDelta));
			// Zoom toward cursor position
			const rect = container?.getBoundingClientRect();
			if (rect) {
				const cursorX = e.clientX - rect.left;
				const dataX = (scrollX + cursorX) / zoom;
				zoom = newZoom;
				scrollX = clampScroll(dataX * newZoom - cursorX);
			}
			onzoomchange?.(zoom);
			onscrollchange?.(scrollX);
		} else {
			// Horizontal scroll
			scrollX = clampScroll(scrollX + e.deltaX + e.deltaY);
			onscrollchange?.(scrollX);
		}
	}

	/** Handle drag start */
	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartScrollX = scrollX;
	}

	/** Handle drag move */
	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			const dx = dragStartX - e.clientX;
			scrollX = clampScroll(dragStartScrollX + dx);
			onscrollchange?.(scrollX);
			return;
		}
		if (!onhoverinfo || !container) return;
		const rect = container.getBoundingClientRect();
		if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
			onhoverinfo(null);
			return;
		}
		const hoverX = e.clientX - rect.left + scrollX;
		let closestIdx = 0;
		let closestDist = Infinity;
		for (let i = 0; i < peakPositions.length; i++) {
			const peakX = peakPositions[i] * zoom;
			const dist = Math.abs(peakX - hoverX);
			if (dist < closestDist) { closestDist = dist; closestIdx = i; }
		}
		if (closestDist > 20 * zoom) { onhoverinfo(null); return; }
		const base = baseCalls[closestIdx] ?? '?';
		const q = qualityScores[closestIdx] ?? 0;
		onhoverinfo({
			title: `Base ${closestIdx + 1}`,
			items: [
				{ label: 'Call', value: base },
				{ label: 'Quality', value: `Q${q}` },
				{ label: 'Position', value: String(peakPositions[closestIdx]) },
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	/** Handle drag end */
	function handleMouseUp() {
		isDragging = false;
	}

	/** Handle click on the trace to select a base */
	function handleClick(e: MouseEvent) {
		if (!onselect) return;
		const rect = container?.getBoundingClientRect();
		if (!rect) return;
		const clickX = e.clientX - rect.left + scrollX;
		// Find the closest peak position
		let closestIdx = 0;
		let closestDist = Infinity;
		for (let i = 0; i < peakPositions.length; i++) {
			const peakX = peakPositions[i] * zoom;
			const dist = Math.abs(peakX - clickX);
			if (dist < closestDist) {
				closestDist = dist;
				closestIdx = i;
			}
		}
		onselect(closestIdx);
	}

	/** Effective width for trace content (excluding quality bar) */
	let contentWidth = $derived(width - qualityBarWidth);
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />

<div
	class="trace-viewer"
	class:embedded
	style="width: {width}px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
>
	<div class="trace-body" style="display: flex;">
		<!-- Main trace content -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="trace-content"
			bind:this={container}
			role="application"
			aria-label="Sanger sequencing trace chromatogram"
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onclick={handleClick}
			style="cursor: {isDragging ? 'grabbing' : 'grab'}; width: {contentWidth}px; user-select: none; overflow: hidden;"
		>
			<!-- Chromatogram peaks (Canvas) -->
			<TracePeaks
				{channels}
				{peakPositions}
				width={contentWidth}
				height={peaksHeight}
				{zoom}
				{scrollX}
				{showChannels}
			/>

			<!-- Base call track (SVG) -->
			<BaseCallTrack
				{baseCalls}
				{peakPositions}
				{qualityScores}
				width={contentWidth}
				{zoom}
				{scrollX}
				{trimQuality}
			/>

			<!-- Alignment view (SVG) -->
			{#if alignment}
				<AlignmentView
					{alignment}
					{baseCalls}
					{peakPositions}
					width={contentWidth}
					{zoom}
					{scrollX}
				/>
			{/if}
		</div>

		<!-- Quality summary sidebar -->
		{#if showQuality}
			<div class="quality-sidebar" style="width: {qualityBarWidth}px;">
				<div class="quality-label">Q</div>
				<div class="quality-histogram">
					{#each qualityBins as bin, i}
						<div
							class="quality-bin"
							title="Q{bin.rangeStart}-{bin.rangeEnd}: {bin.count} bases"
						>
							<div
								class="quality-bar"
								style="
									height: {bin.fraction * 100}%;
									background: {bin.aboveThreshold ? 'var(--hatch-positive, #58b56a)' : 'var(--hatch-negative, #d45858)'};
									opacity: {0.5 + bin.fraction * 0.5};
								"
							></div>
						</div>
					{/each}
				</div>
				<div class="quality-avg" title="Mean quality score">
					{qualitySummary.avg}
				</div>
				<div
					class="quality-good"
					title="{Math.round(qualitySummary.goodFraction * 100)}% bases above Q{trimQuality}"
				>
					{Math.round(qualitySummary.goodFraction * 100)}%
				</div>
			</div>
		{/if}
	</div>

	<!-- Scrollbar indicator -->
	{#if showScrollbar && totalDataWidth > contentWidth}
		<div class="scroll-track" style="width: {contentWidth}px;">
			<div
				class="scroll-thumb"
				style="
					left: {(scrollX / totalDataWidth) * 100}%;
					width: {Math.max(5, (contentWidth / totalDataWidth) * 100)}%;
				"
			></div>
		</div>
	{/if}
</div>

<style>
	.trace-viewer {
		background: var(--hatch-bg, #0c1018);
		overflow: hidden;
	}

	.trace-viewer.embedded {
		background: none;
	}

	.trace-content {
		flex: 1;
		min-width: 0;
	}

	.quality-sidebar {
		background: var(--hatch-plot-bg, #141c26);
		border-left: 1px solid var(--hatch-border, #2a3848);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4px 2px;
		gap: 2px;
	}

	.quality-label {
		color: var(--hatch-text-dim, #566070);
		font-size: 10px;
		font-weight: 600;
		font-family: var(--hatch-font-mono, 'SF Mono', monospace);
	}

	.quality-histogram {
		flex: 1;
		display: flex;
		flex-direction: column-reverse;
		gap: 1px;
		width: 100%;
		padding: 2px 4px;
	}

	.quality-bin {
		flex: 1;
		display: flex;
		align-items: flex-end;
		min-height: 3px;
	}

	.quality-bar {
		width: 100%;
		border-radius: 1px;
		min-height: 1px;
		transition: height 0.2s;
	}

	.quality-avg {
		color: var(--hatch-axis-label, #95a3b3);
		font-size: 10px;
		font-weight: 700;
		font-family: var(--hatch-font-mono, 'SF Mono', monospace);
	}

	.quality-good {
		color: var(--hatch-positive, #58b56a);
		font-size: 9px;
		font-family: var(--hatch-font-mono, 'SF Mono', monospace);
	}

	.scroll-track {
		height: 4px;
		background: var(--hatch-plot-bg, #141c26);
		position: relative;
		border-top: 1px solid var(--hatch-border, #2a3848);
	}

	.scroll-thumb {
		position: absolute;
		height: 100%;
		background: var(--hatch-border, #2a3848);
		border-radius: 2px;
		transition: background 0.15s;
	}

	.scroll-thumb:hover {
		background: var(--hatch-axis-text, #7a8898);
	}
</style>
