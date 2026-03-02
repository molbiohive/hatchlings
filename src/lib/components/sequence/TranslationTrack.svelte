<script lang="ts">
	import type { Translation } from '../../types/index.js';
	import { aminoAcidColors } from '../../util/colors.js';

	interface Props {
		/** Translation data */
		translation: Translation;
		/** Start bp of this row */
		start: number;
		/** End bp of this row */
		end: number;
		/** Y position */
		y?: number;
		/** Width of each character in pixels */
		charWidth?: number;
	}

	let { translation, start, end, y = 0, charWidth = 10 }: Props = $props();

	const CODON_WIDTH = $derived(charWidth * 3);
	const AA_HEIGHT = 16;

	/** Amino acids that fall within this row's visible range */
	const visibleAminoAcids = $derived.by(() => {
		const result: { aa: string; x: number; codonStart: number }[] = [];

		// Each amino acid corresponds to 3 bases starting from translation.start
		const aaString = translation.aminoAcids;

		for (let i = 0; i < aaString.length; i++) {
			const codonStart = translation.start + i * 3;
			const codonEnd = codonStart + 3;

			// Check if this codon overlaps with the visible range
			if (codonEnd > start && codonStart < end) {
				const x = Math.max(0, (codonStart - start)) * charWidth;
				result.push({
					aa: aaString[i],
					x,
					codonStart,
				});
			}
		}
		return result;
	});
</script>

<g class="hatch-translation-track">
	{#each visibleAminoAcids as { aa, x, codonStart }}
		{@const color = aminoAcidColors[aa] ?? '#999'}
		{@const visibleWidth = Math.min(CODON_WIDTH, (end - Math.max(codonStart, start)) * charWidth)}

		<!-- Amino acid background -->
		<rect
			{x}
			{y}
			width={visibleWidth}
			height={AA_HEIGHT}
			fill={color}
			fill-opacity="0.2"
			stroke={color}
			stroke-opacity="0.4"
			stroke-width="0.5"
			rx="1"
		/>

		<!-- Amino acid letter -->
		{#if visibleWidth >= charWidth}
			<text
				x={x + visibleWidth / 2}
				y={y + AA_HEIGHT / 2 + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				fill={color}
				font-size="11"
				font-weight="bold"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
			>{aa}</text>
		{/if}
	{/each}
</g>
