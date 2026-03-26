<script lang="ts">
	import type { LogoPosition, SeqLogoData, Alphabet } from '../../types/index.js';
	import { nucleotideColors, aminoAcidColors } from '../../util/colors.js';

	interface Props {
		data?: SeqLogoData;
		positions?: LogoPosition[];
		alphabet?: Alphabet;
		width?: number;
		height?: number;
		title?: string;
	}

	let {
		data,
		positions: positionsProp,
		alphabet: alphabetProp,
		width = 500,
		height = 200,
		title = '',
	}: Props = $props();

	const positions = $derived(positionsProp ?? data?.positions ?? []);
	const alphabet = $derived(alphabetProp ?? data?.alphabet ?? 'dna');

	const margin = { top: 25, right: 10, bottom: 30, left: 40 };
	const plotW = $derived(width - margin.left - margin.right);
	const plotH = $derived(height - margin.top - margin.bottom);
	const colW = $derived(plotW / Math.max(positions.length, 1));

	const colors = $derived(alphabet === 'protein' ? aminoAcidColors : nucleotideColors);

	// Maximum possible information content
	const maxBits = $derived(alphabet === 'protein' ? Math.log2(20) : 2);

	/**
	 * Calculate information content and letter heights for a position.
	 * Uses Shannon entropy: IC = maxBits - H(pos)
	 * Letter height = freq * IC
	 */
	function positionLetters(pos: LogoPosition): { letter: string; height: number; color: string }[] {
		const entries = Object.entries(pos).filter(([, v]) => v > 0);
		const total = entries.reduce((s, [, v]) => s + v, 0);

		// Normalize frequencies
		const freqs = entries.map(([letter, val]) => ({ letter, freq: val / total }));

		// Shannon entropy
		const H = -freqs.reduce((s, { freq }) => s + (freq > 0 ? freq * Math.log2(freq) : 0), 0);

		// Information content
		const IC = Math.max(0, maxBits - H);

		// Letter heights = freq * IC, sorted ascending (smallest at bottom)
		return freqs
			.map(({ letter, freq }) => ({
				letter: letter.toUpperCase(),
				height: freq * IC,
				color: colors[letter.toUpperCase()] ?? '#999',
			}))
			.sort((a, b) => a.height - b.height);
	}

	function scaleH(bits: number): number {
		return (bits / maxBits) * plotH;
	}
</script>

<div class="hatch-seqlogo">
	<svg {width} {height}>
		{#if title}
			<text x={width / 2} y="16" text-anchor="middle" fill="var(--hatch-title-color, #d4dce6)" font-size="12" font-weight="600">{title}</text>
		{/if}

		<!-- Y axis (bits) -->
		<line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH}
			stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" />
		{#each [0, 0.5, 1, 1.5, 2] as tick}
			{#if tick <= maxBits}
				{@const ty = margin.top + plotH - scaleH(tick)}
				<line x1={margin.left - 4} y1={ty} x2={margin.left} y2={ty}
					stroke="var(--hatch-axis-color, #3a4858)" stroke-width="1" />
				<text x={margin.left - 6} y={ty + 3} text-anchor="end" fill="var(--hatch-axis-text, #7a8898)" font-size="9">{tick}</text>
			{/if}
		{/each}
		<text x={margin.left - 28} y={margin.top + plotH / 2} text-anchor="middle" fill="var(--hatch-axis-label, #95a3b3)" font-size="10"
			transform="rotate(-90, {margin.left - 28}, {margin.top + plotH / 2})">bits</text>

		<!-- Position numbers -->
		{#each positions as _, i}
			{#if i % Math.ceil(positions.length / 20) === 0 || positions.length <= 20}
				<text
					x={margin.left + i * colW + colW / 2}
					y={margin.top + plotH + 16}
					text-anchor="middle"
					fill="var(--hatch-axis-text, #7a8898)"
					font-size="8"
				>{i + 1}</text>
			{/if}
		{/each}

		<!-- Letters -->
		{#each positions as pos, i}
			{@const letters = positionLetters(pos)}
			{@const x = margin.left + i * colW}
			{#each letters as letter}
				{@const h = scaleH(letter.height)}
				{@const letterY = margin.top + plotH - letters.slice(0, letters.indexOf(letter)).reduce((s, l) => s + scaleH(l.height), 0) - h}
				{#if h > 0.5}
					<text
						x={x + colW / 2}
						y={letterY + h}
						text-anchor="middle"
						dominant-baseline="auto"
						fill={letter.color}
						font-size={Math.min(colW * 1.2, h * 1.1)}
						font-weight="700"
						font-family="var(--hatch-font, Arial, Helvetica, sans-serif)"
						transform="scale(1, {h / Math.min(colW * 1.2, h * 1.1)})"
						transform-origin="{x + colW / 2} {letterY + h}"
					>{letter.letter}</text>
				{/if}
			{/each}
		{/each}
	</svg>
</div>

<style>
	.hatch-seqlogo {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}
</style>
