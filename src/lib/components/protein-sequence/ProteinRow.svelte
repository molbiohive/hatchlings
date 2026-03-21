<script lang="ts">
	import type { ProteinAnnotation } from '../../types/index.js';
	import { aminoAcidColors, getFeatureColor } from '../../util/colors.js';
	import { truncateLabel, maxLayer as getMaxLayer } from '../../util/coordinates.js';
	import { IntervalTree } from '../../util/interval-tree.js';
	import { SEQ_PAD, LINE_HEIGHT, AA_BLOCK_H, CODON_H, ANNOTATION_H, ANNOTATION_GAP, FONT_PRIMARY, FONT_SECONDARY } from '../../util/layout.js';

	interface Props {
		seq: string;
		start: number;
		codons?: string[];
		annotations?: ProteinAnnotation[];
		charWidth?: number;
		showNumbers?: boolean;
		showCodons?: boolean;
		colorResidues?: boolean;
		onannotationclick?: (annotation: ProteinAnnotation) => void;
		onannotationhover?: (annotation: ProteinAnnotation | null, e?: MouseEvent) => void;
	}

	let {
		seq,
		start,
		codons = [],
		annotations = [],
		charWidth = 20,
		showNumbers = true,
		showCodons = false,
		colorResidues = true,
		onannotationclick,
		onannotationhover,
	}: Props = $props();

	const SEQ_X = SEQ_PAD;

	const end = $derived(start + seq.length);

	const visibleAnnotations = $derived.by(() => {
		return annotations.filter((a) => a.start < end && a.end > start);
	});

	const laneAssignments = $derived.by(() => {
		const intervals = visibleAnnotations.map((a) => ({ start: a.start, end: a.end }));
		const layers = IntervalTree.computeLayers(intervals);
		const assignments = new Map<ProteinAnnotation, number>();
		visibleAnnotations.forEach((ann, i) => {
			assignments.set(ann, layers.get(i) ?? 0);
		});
		return assignments;
	});

	const maxLane = $derived(getMaxLayer(laneAssignments));

	const ANNOTATION_TOTAL_H = $derived(maxLane >= 0 ? (maxLane + 1) * (ANNOTATION_H + ANNOTATION_GAP) + 4 : 0);

	const RULER_HEIGHT = $derived(showNumbers ? 16 : 0);
	const CODON_TRACK_H = $derived(showCodons && codons.length > 0 ? CODON_H + 4 : 0);

	const annotationY = $derived(RULER_HEIGHT);
	const aaY = $derived(RULER_HEIGHT + ANNOTATION_TOTAL_H);
	const codonY = $derived(aaY + AA_BLOCK_H + 2);

	const TICK_INTERVAL = $derived.by(() => {
		const maxPos = start + seq.length;
		const digitCount = String(maxPos).length;
		const labelPx = digitCount * 5 + 6;
		const minSpacingPx = labelPx + 10;
		const basesPerLabel = Math.ceil(minSpacingPx / charWidth);
		const niceSteps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
		return niceSteps.find(s => s >= basesPerLabel) ?? basesPerLabel;
	});

	function annX(bp: number): number {
		return Math.max(0, (bp - start)) * charWidth;
	}

	function annWidth(ann: ProteinAnnotation): number {
		const visStart = Math.max(ann.start, start);
		const visEnd = Math.min(ann.end, end);
		return (visEnd - visStart) * charWidth;
	}

	/** Arrow-shaped path for AA residue — same chevron as TranslationTrack.
	 *  Forward (N-to-C): notch on left, arrowhead on right.
	 *  First residue has flat left edge instead of notch. */
	function aaArrowPath(i: number): string {
		const x = i * charWidth;
		const w = charWidth;
		const ay = 0.5;
		const h = AA_BLOCK_H - 1;
		const tip = Math.min(4, w * 0.25);
		const midY = ay + h / 2;

		if (i === 0) {
			// First: flat left, arrowhead right
			return `M ${x} ${ay} L ${x + w - tip} ${ay} L ${x + w} ${midY} L ${x + w - tip} ${ay + h} L ${x} ${ay + h} Z`;
		}
		// Notch left, arrowhead right
		return `M ${x} ${ay} L ${x + tip} ${midY} L ${x} ${ay + h} L ${x + w - tip} ${ay + h} L ${x + w} ${midY} L ${x + w - tip} ${ay} Z`;
	}

	const MONO_COLOR = 'var(--hatch-seq-base-mono, #8a95a5)';
</script>

<g class="hatch-protein-row">
	<!-- Position ruler -->
	{#if showNumbers}
		<line
			x1={SEQ_X}
			y1={RULER_HEIGHT - 2}
			x2={SEQ_X + seq.length * charWidth}
			y2={RULER_HEIGHT - 2}
			stroke="var(--hatch-line-number, #566070)"
			stroke-opacity="0.3"
			stroke-width="0.5"
		/>
		{#each { length: seq.length } as _, i}
			{@const pos = start + i + 1}
			{@const isIntervalTick = pos % TICK_INTERVAL === 0}
			{@const isFirstTick = i === 0 && !isIntervalTick}
			{@const firstTickOverlap = isFirstTick && (TICK_INTERVAL - (pos % TICK_INTERVAL)) * charWidth < String(pos).length * 5 + 16}
			{@const isTick = isIntervalTick || (isFirstTick && !firstTickOverlap)}
			{#if isTick}
				<line
					x1={SEQ_X + i * charWidth + charWidth / 2}
					y1={RULER_HEIGHT - 5}
					x2={SEQ_X + i * charWidth + charWidth / 2}
					y2={RULER_HEIGHT - 1}
					stroke="var(--hatch-line-number, #566070)"
					stroke-opacity="0.5"
					stroke-width="0.5"
				/>
				<text
					x={SEQ_X + i * charWidth + charWidth / 2}
					y={RULER_HEIGHT - 7}
					text-anchor="middle"
					fill="var(--hatch-line-number, #566070)"
					font-size={FONT_SECONDARY}
					font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
				>{pos}</text>
			{/if}
		{/each}
	{/if}

	<!-- Annotation track (domains, motifs) -->
	{#if visibleAnnotations.length > 0}
		<g transform="translate({SEQ_X}, {annotationY})">
			{#each visibleAnnotations as ann}
				{@const lane = laneAssignments.get(ann) ?? 0}
				{@const color = getFeatureColor(ann.type, ann.color)}
				{@const fx = annX(Math.max(ann.start, start))}
				{@const fw = annWidth(ann)}
				{@const fy = lane * (ANNOTATION_H + ANNOTATION_GAP)}
				{@const labelText = ann.label ?? ann.name}
				{@const displayLabel = truncateLabel(labelText, fw - 8)}
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<g
					class="annotation-part"
					role="button"
					tabindex="-1"
					onclick={() => onannotationclick?.(ann)}
					onkeydown={(e) => { if (e.key === 'Enter') onannotationclick?.(ann); }}
					onmouseover={(e) => onannotationhover?.(ann, e)}
					onmouseout={(e) => { if (e.currentTarget?.contains(e.relatedTarget as Node)) return; onannotationhover?.(null); }}
				>
					<rect
						x={fx}
						y={fy}
						width={fw}
						height={ANNOTATION_H}
						fill={color}
						fill-opacity="0.8"
						stroke="var(--hatch-annotation-stroke, #fff)"
						stroke-width="0.5"
						rx="4"
					/>
					{#if displayLabel}
						<text
							x={fx + fw / 2}
							y={fy + ANNOTATION_H / 2 + 1}
							text-anchor="middle"
							dominant-baseline="middle"
							fill="var(--hatch-annotation-text, #fff)"
							font-size="10"
							font-weight="600"
							font-family="var(--hatch-font, -apple-system, sans-serif)"
						>{displayLabel}</text>
					{/if}
					<title>{labelText} ({ann.type}) {ann.start + 1}..{ann.end}</title>
				</g>
			{/each}
		</g>
	{/if}

	<!-- N-term / C-term labels -->
	<text
		x={2}
		y={aaY + AA_BLOCK_H / 2 + 1}
		text-anchor="start"
		dominant-baseline="middle"
		fill="var(--hatch-text-dim, #566070)"
		font-size={FONT_SECONDARY}
		font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
	>N</text>
	<text
		x={SEQ_X + seq.length * charWidth + 2}
		y={aaY + AA_BLOCK_H / 2 + 1}
		text-anchor="start"
		dominant-baseline="middle"
		fill="var(--hatch-text-dim, #566070)"
		font-size={FONT_SECONDARY}
		font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
	>C</text>

	<!-- AA blocks -->
	<g transform="translate({SEQ_X}, {aaY})">
		{#each seq.split('') as aa, i}
			{@const upper = aa.toUpperCase()}
			{@const bgColor = colorResidues ? (aminoAcidColors[upper] ?? '#666') : 'transparent'}
			{@const textColor = colorResidues ? '#fff' : MONO_COLOR}
			<path
				d={aaArrowPath(i)}
				fill={bgColor}
				fill-opacity={colorResidues ? 0.75 : 0}
			/>
			<text
				x={i * charWidth + charWidth / 2}
				y={AA_BLOCK_H / 2 + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				fill={textColor}
				font-size={FONT_PRIMARY}
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
				font-weight="600"
			>{upper}</text>
		{/each}
	</g>

	<!-- Codon track -->
	{#if showCodons && codons.length > 0}
		<g transform="translate({SEQ_X}, {codonY})">
			{#each codons as codon, i}
				{#if i < seq.length}
					{@const even = i % 2 === 0}
					<rect
						x={i * charWidth}
						y={0}
						width={charWidth}
						height={CODON_H}
						fill={even ? 'var(--hatch-grid-color, #1e2a38)' : 'transparent'}
						fill-opacity="0.5"
					/>
					<text
						x={i * charWidth + charWidth / 2}
						y={CODON_H / 2 + 1}
						text-anchor="middle"
						dominant-baseline="middle"
						fill="var(--hatch-text-dim, #566070)"
						font-size={FONT_SECONDARY}
						font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
					>{codon}</text>
				{/if}
			{/each}
		</g>
	{/if}
</g>

<style>
	.annotation-part {
		cursor: pointer;
	}

	.annotation-part:hover rect {
		stroke: var(--hatch-annotation-stroke-hover, #fff);
		stroke-width: 1.5;
	}
</style>
