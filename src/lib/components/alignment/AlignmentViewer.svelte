<script lang="ts">
	import type { AlignmentSequence, ConservationScore, AlignmentAnnotation } from '../../types/index.js';
	import { nucleotideColors, aminoAcidColors } from '../../util/colors.js';

	interface Props {
		/** Array of aligned sequences */
		sequences: AlignmentSequence[];
		/** Sequence alphabet */
		alphabet?: 'dna' | 'rna' | 'protein';
		/** Per-position conservation scores */
		conservation?: ConservationScore[];
		/** Annotations to highlight */
		annotations?: AlignmentAnnotation[];
		/** Total width */
		width?: number;
		/** Total height */
		height?: number;
		/** Width of each cell in pixels */
		cellWidth?: number;
		/** Height of each cell in pixels */
		cellHeight?: number;
		/** Show consensus row */
		showConsensus?: boolean;
		/** Show conservation bar chart */
		showConservation?: boolean;
		/** Show sequence names panel */
		showNames?: boolean;
		/** Selection callback */
		onselect?: (selection: { seqIdx: number; start: number; end: number }) => void;
	}

	let {
		sequences,
		alphabet = 'dna',
		conservation = [],
		annotations = [],
		width = 800,
		height = 500,
		cellWidth = 12,
		cellHeight = 16,
		showConsensus = true,
		showConservation = true,
		showNames = true,
		onselect,
	}: Props = $props();

	let colorMap = $derived(alphabet === 'protein' ? aminoAcidColors : nucleotideColors);

	const NAME_PANEL_WIDTH = 120;
	const CONSERVATION_HEIGHT = 40;

	let canvas: HTMLCanvasElement | undefined = $state(undefined);
	let scrollContainer: HTMLDivElement | undefined = $state(undefined);

	let gridWidth = $derived(showNames ? width - NAME_PANEL_WIDTH : width);
	let alignmentLength = $derived(sequences.length > 0 ? sequences[0].sequence.length : 0);
	let totalContentWidth = $derived(alignmentLength * cellWidth);
	let consensusOffset = $derived(showConsensus ? cellHeight : 0);
	let totalContentHeight = $derived(sequences.length * cellHeight + consensusOffset + (showConservation ? CONSERVATION_HEIGHT : 0));

	/** Scroll state for virtual rendering */
	let scrollX = $state(0);
	let scrollY = $state(0);

	/** Drag-to-pan state */
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragStartScrollX = $state(0);
	let dragStartScrollY = $state(0);

	function handleScroll() {
		if (scrollContainer) {
			scrollX = scrollContainer.scrollLeft;
			scrollY = scrollContainer.scrollTop;
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartScrollX = scrollContainer?.scrollLeft ?? 0;
		dragStartScrollY = scrollContainer?.scrollTop ?? 0;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !scrollContainer) return;
		scrollContainer.scrollLeft = dragStartScrollX - (e.clientX - dragStartX);
		scrollContainer.scrollTop = dragStartScrollY - (e.clientY - dragStartY);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	/** Compute consensus from sequences */
	let consensus = $derived.by(() => {
		if (!showConsensus || sequences.length === 0) return '';
		const result: string[] = [];
		for (let pos = 0; pos < alignmentLength; pos++) {
			const counts: Record<string, number> = {};
			for (const seq of sequences) {
				const ch = seq.sequence[pos]?.toUpperCase() ?? '-';
				counts[ch] = (counts[ch] ?? 0) + 1;
			}
			let maxChar = '-';
			let maxCount = 0;
			for (const [ch, count] of Object.entries(counts)) {
				if (ch !== '-' && count > maxCount) {
					maxChar = ch;
					maxCount = count;
				}
			}
			result.push(maxChar);
		}
		return result.join('');
	});

	function hexToRgb(hex: string): [number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return [r, g, b];
	}

	/** Canvas rendering — draws only visible cells, offset by scroll position */
	$effect(() => {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;
		const canvasW = gridWidth;
		const canvasH = Math.min(height, totalContentHeight);

		canvas.width = canvasW * dpr;
		canvas.height = canvasH * dpr;
		canvas.style.width = `${canvasW}px`;
		canvas.style.height = `${canvasH}px`;
		ctx.scale(dpr, dpr);

		// Visible range based on scroll
		const startCol = Math.floor(scrollX / cellWidth);
		const endCol = Math.min(alignmentLength, Math.ceil((scrollX + gridWidth) / cellWidth) + 1);
		const startRow = Math.max(0, Math.floor((scrollY - consensusOffset) / cellHeight));
		const endRow = Math.min(sequences.length, Math.ceil((scrollY - consensusOffset + height) / cellHeight) + 1);

		// Clear entire canvas
		ctx.clearRect(0, 0, canvasW, canvasH);

		const fontSize = Math.min(cellHeight - 2, 13);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Draw consensus row
		if (showConsensus && consensus.length > 0) {
			const consY = consensusOffset - scrollY;
			if (consY + cellHeight > 0 && consY < height) {
				ctx.font = `700 ${fontSize}px "SF Mono", "Fira Code", monospace`;
				for (let col = startCol; col < endCol; col++) {
					const ch = consensus[col]?.toUpperCase() ?? '-';
					const drawX = col * cellWidth - scrollX;
					const color = colorMap[ch];

					if (color && ch !== '-') {
						const [r, g, b] = hexToRgb(color);
						ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
						ctx.fillRect(drawX, 0 - scrollY, cellWidth, cellHeight);
						ctx.fillStyle = color;
					} else {
						ctx.fillStyle = '#555';
					}
					ctx.fillText(ch, drawX + cellWidth / 2, -scrollY + cellHeight / 2 + 1);
				}
			}
		}

		// Draw sequence cells
		ctx.font = `500 ${fontSize}px "SF Mono", "Fira Code", monospace`;
		for (let row = startRow; row < endRow; row++) {
			const seq = sequences[row];
			const drawY = row * cellHeight + consensusOffset - scrollY;

			if (drawY + cellHeight < 0 || drawY > height) continue;

			for (let col = startCol; col < endCol; col++) {
				const ch = seq.sequence[col]?.toUpperCase() ?? '-';
				const drawX = col * cellWidth - scrollX;
				const color = colorMap[ch];

				if (color && ch !== '-') {
					const [r, g, b] = hexToRgb(color);
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
					ctx.fillRect(drawX, drawY, cellWidth, cellHeight);
					ctx.fillStyle = color;
				} else {
					ctx.fillStyle = '#555';
				}

				ctx.fillText(ch, drawX + cellWidth / 2, drawY + cellHeight / 2 + 1);
			}
		}

		// Conservation bar at bottom
		if (showConservation && conservation.length > 0) {
			const barBaseY = sequences.length * cellHeight + consensusOffset - scrollY + 4;
			const maxScore = Math.max(...conservation.map(c => c.score), 1);

			for (let col = startCol; col < endCol; col++) {
				const c = conservation[col];
				if (!c) continue;
				const barH = (c.score / maxScore) * (CONSERVATION_HEIGHT - 8);
				const drawX = col * cellWidth - scrollX;

				ctx.fillStyle = 'rgba(106, 184, 224, 0.6)';
				ctx.fillRect(drawX + 1, barBaseY + CONSERVATION_HEIGHT - 8 - barH, cellWidth - 2, barH);
			}
		}

		// Annotation bars
		for (const ann of annotations) {
			if (ann.end < startCol || ann.start > endCol) continue;
			const drawX = ann.start * cellWidth - scrollX;
			const w = (ann.end - ann.start) * cellWidth;
			ctx.fillStyle = ann.color ?? 'rgba(255, 165, 0, 0.3)';
			ctx.fillRect(drawX, -scrollY, w, 3);
		}
	});
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
	class="hatch-alignment-viewer"
	class:dragging={isDragging}
	style:width="{width}px"
	style:height="{height}px"
>
	{#if showNames}
		<div
			class="name-panel"
			style:width="{NAME_PANEL_WIDTH}px"
			style:height="{height}px"
		>
			<div style="transform: translateY(-{scrollY}px)">
				{#if showConsensus}
					<div
						class="seq-name consensus-name"
						style:height="{cellHeight}px"
						style:line-height="{cellHeight}px"
					>
						Consensus
					</div>
				{/if}
				{#each sequences as seq}
					<div
						class="seq-name"
						style:height="{cellHeight}px"
						style:line-height="{cellHeight}px"
						title={seq.name}
					>
						{seq.name}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Scrollable grid area -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="grid-container"
		role="application"
		aria-label="Sequence alignment grid"
		bind:this={scrollContainer}
		onscroll={handleScroll}
		onmousedown={handleMouseDown}
		style:width="{gridWidth}px"
		style:height="{height}px"
	>
		<!-- Invisible sizer for scroll bounds -->
		<div
			class="grid-sizer"
			style:width="{totalContentWidth}px"
			style:height="{totalContentHeight}px"
		></div>
		<!-- Canvas renders at viewport position, draws scroll-offset cells -->
		<canvas
			bind:this={canvas}
			class="alignment-canvas"
		></canvas>
	</div>
</div>

<style>
	.hatch-alignment-viewer {
		display: flex;
		background: var(--hatch-bg, #0c1018);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 6px;
		overflow: hidden;
	}

	.name-panel {
		overflow: hidden;
		border-right: 1px solid var(--hatch-border, #2a3848);
		flex-shrink: 0;
	}

	.seq-name {
		padding: 0 8px;
		font-size: 11px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		color: var(--hatch-text, #d4dce6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.consensus-name {
		font-weight: 700;
		color: var(--hatch-highlight, #6ab8e0);
	}

	.grid-container {
		overflow: auto;
		position: relative;
		cursor: grab;
	}

	.dragging .grid-container {
		cursor: grabbing;
	}

	.grid-sizer {
		position: absolute;
		top: 0;
		left: 0;
	}

	.alignment-canvas {
		position: sticky;
		top: 0;
		left: 0;
		display: block;
		/* Canvas floats above the sizer at viewport origin */
	}
</style>
