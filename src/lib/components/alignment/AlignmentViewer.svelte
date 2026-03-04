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
	const HEADER_HEIGHT = 20;

	let canvas: HTMLCanvasElement | undefined = $state(undefined);
	let namePanel: HTMLDivElement | undefined = $state(undefined);
	let scrollContainer: HTMLDivElement | undefined = $state(undefined);

	let gridWidth = $derived(showNames ? width - NAME_PANEL_WIDTH : width);
	let alignmentLength = $derived(sequences.length > 0 ? sequences[0].sequence.length : 0);
	let totalCanvasWidth = $derived(alignmentLength * cellWidth);
	let consensusOffset = $derived(showConsensus ? cellHeight : 0);
	let totalCanvasHeight = $derived(sequences.length * cellHeight + consensusOffset);

	/** Scroll state for virtual rendering */
	let scrollX = $state(0);
	let scrollY = $state(0);

	function handleScroll() {
		if (scrollContainer) {
			scrollX = scrollContainer.scrollLeft;
			scrollY = scrollContainer.scrollTop;
		}
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

	/** Color cache for canvas rendering */
	function hexToRgb(hex: string): [number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return [r, g, b];
	}

	/** Canvas rendering effect */
	$effect(() => {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;
		canvas.width = gridWidth * dpr;
		canvas.height = (totalCanvasHeight + (showConservation ? CONSERVATION_HEIGHT : 0)) * dpr;
		canvas.style.width = `${gridWidth}px`;
		canvas.style.height = `${totalCanvasHeight + (showConservation ? CONSERVATION_HEIGHT : 0)}px`;
		ctx.scale(dpr, dpr);

		// Compute visible range
		const startCol = Math.floor(scrollX / cellWidth);
		const endCol = Math.min(alignmentLength, Math.ceil((scrollX + gridWidth) / cellWidth) + 1);
		const startRow = Math.floor(scrollY / cellHeight);
		const endRow = Math.min(sequences.length, Math.ceil((scrollY + height) / cellHeight) + 1);

		// Clear
		ctx.clearRect(0, 0, gridWidth, totalCanvasHeight + CONSERVATION_HEIGHT);

		// Set font
		ctx.font = `500 ${Math.min(cellHeight - 2, 13)}px "SF Mono", "Fira Code", monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Draw consensus row (if enabled) as first row
		if (showConsensus && consensus.length > 0) {
			ctx.font = `700 ${Math.min(cellHeight - 2, 13)}px "SF Mono", "Fira Code", monospace`;
			for (let col = startCol; col < endCol; col++) {
				const ch = consensus[col]?.toUpperCase() ?? '-';
				const x = col * cellWidth;
				const color = colorMap[ch];

				if (color && ch !== '-') {
					const [r, g, b] = hexToRgb(color);
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
					ctx.fillRect(x, 0, cellWidth, cellHeight);
					ctx.fillStyle = color;
				} else {
					ctx.fillStyle = '#555';
				}

				ctx.fillText(ch, x + cellWidth / 2, cellHeight / 2 + 1);
			}
			ctx.font = `500 ${Math.min(cellHeight - 2, 13)}px "SF Mono", "Fira Code", monospace`;
		}

		// Draw sequence cells (shifted down by consensusOffset)
		for (let row = startRow; row < endRow; row++) {
			const seq = sequences[row];
			const y = row * cellHeight + consensusOffset;

			for (let col = startCol; col < endCol; col++) {
				const ch = seq.sequence[col]?.toUpperCase() ?? '-';
				const x = col * cellWidth;
				const color = colorMap[ch];

				if (color && ch !== '-') {
					const [r, g, b] = hexToRgb(color);
					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
					ctx.fillRect(x, y, cellWidth, cellHeight);
					ctx.fillStyle = color;
				} else {
					ctx.fillStyle = '#555';
				}

				ctx.fillText(ch, x + cellWidth / 2, y + cellHeight / 2 + 1);
			}
		}

		// Draw conservation bar at bottom (below all rows)
		if (showConservation && conservation.length > 0) {
			const barY = sequences.length * cellHeight + consensusOffset + 4;
			const maxScore = Math.max(...conservation.map(c => c.score), 1);

			for (let col = startCol; col < endCol; col++) {
				const c = conservation[col];
				if (!c) continue;
				const barH = (c.score / maxScore) * (CONSERVATION_HEIGHT - 8);
				const x = col * cellWidth;

				ctx.fillStyle = 'rgba(106, 184, 224, 0.6)';
				ctx.fillRect(x + 1, barY + CONSERVATION_HEIGHT - 8 - barH, cellWidth - 2, barH);
			}
		}

		// Draw annotations as colored bars above alignment
		for (const ann of annotations) {
			if (ann.end < startCol || ann.start > endCol) continue;
			const x = ann.start * cellWidth;
			const w = (ann.end - ann.start) * cellWidth;
			ctx.fillStyle = ann.color ?? 'rgba(255, 165, 0, 0.3)';
			ctx.fillRect(x, 0, w, 3);
		}
	});
</script>

<div class="hatch-alignment-viewer" style:width="{width}px" style:height="{height}px">
	{#if showNames}
		<!-- Name panel (fixed left, synced via CSS transform) -->
		<div
			class="name-panel"
			bind:this={namePanel}
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
				{#each sequences as seq, i}
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
	<div
		class="grid-container"
		bind:this={scrollContainer}
		onscroll={handleScroll}
		style:width="{gridWidth}px"
		style:height="{height}px"
	>
		<div
			class="grid-sizer"
			style:width="{totalCanvasWidth}px"
			style:height="{totalCanvasHeight + (showConservation ? CONSERVATION_HEIGHT : 0)}px"
		>
			<canvas
				bind:this={canvas}
				class="alignment-canvas"
			></canvas>
		</div>
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
	}

	.grid-sizer {
		position: relative;
	}

	.alignment-canvas {
		position: sticky;
		top: 0;
		left: 0;
	}
</style>
