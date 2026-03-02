<script lang="ts">
	import type { Feature, Primer, Translation } from '../../types/index.js';
	import { nucleotideColors } from '../../util/colors.js';
	import AnnotationTrack from './AnnotationTrack.svelte';
	import PrimerTrack from './PrimerTrack.svelte';
	import TranslationTrack from './TranslationTrack.svelte';

	interface Props {
		/** Sequence string for this row */
		seq: string;
		/** Bp position of the first base in this row (0-based) */
		start: number;
		/** Features overlapping this row */
		features?: Feature[];
		/** Primers overlapping this row */
		primers?: Primer[];
		/** Translations overlapping this row */
		translations?: Translation[];
		/** Width of each character in pixels */
		charWidth?: number;
		/** Show position numbers on left */
		showNumbers?: boolean;
		/** Show feature annotations */
		showAnnotations?: boolean;
		/** Show primers */
		showPrimers?: boolean;
		/** Show translations */
		showTranslations?: boolean;
	}

	let {
		seq,
		start,
		features = [],
		primers = [],
		translations = [],
		charWidth = 10,
		showNumbers = true,
		showAnnotations = true,
		showPrimers = true,
		showTranslations = true,
	}: Props = $props();

	const end = $derived(start + seq.length);
	const NUMBER_WIDTH = 50;
	const SEQ_X = $derived(showNumbers ? NUMBER_WIDTH : 0);
	const LINE_HEIGHT = 14;

	/** Compute lane count for annotation track to properly offset subsequent tracks */
	const annotationLanes = $derived.by(() => {
		if (!showAnnotations || features.length === 0) return 0;
		const visible = features.filter((f) => f.start < end && f.end > start);
		if (visible.length === 0) return 0;

		const sorted = [...visible].sort((a, b) => a.start - b.start);
		const lanes: { end: number }[] = [];
		for (const feat of sorted) {
			let assigned = false;
			for (const lane of lanes) {
				if (feat.start >= lane.end) {
					lane.end = feat.end;
					assigned = true;
					break;
				}
			}
			if (!assigned) {
				lanes.push({ end: feat.end });
			}
		}
		return lanes.length;
	});

	const ANNOTATION_TRACK_HEIGHT = $derived(annotationLanes * 18);

	/** Y positions for each sub-element */
	const annotationY = 0;
	const seqY = $derived(ANNOTATION_TRACK_HEIGHT + (annotationLanes > 0 ? 4 : 0));
	const translationY = $derived(seqY + LINE_HEIGHT + 4);
	const primerY = $derived(
		translationY +
			(showTranslations && translations.length > 0 ? 20 : 0) +
			(showTranslations && translations.length > 0 ? 4 : 0)
	);
	const totalHeight = $derived(
		primerY +
			(showPrimers && primers.length > 0 ? 26 : 0)
	);
</script>

<g class="hatch-sequence-row">
	<!-- Position number -->
	{#if showNumbers}
		<text
			x={NUMBER_WIDTH - 8}
			y={seqY + LINE_HEIGHT / 2 + 1}
			text-anchor="end"
			dominant-baseline="middle"
			fill="var(--hatch-line-number, #666)"
			font-size="10"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>{start + 1}</text>
	{/if}

	<!-- Annotation track -->
	{#if showAnnotations && features.length > 0}
		<g transform="translate({SEQ_X}, 0)">
			<AnnotationTrack
				{features}
				{start}
				{end}
				y={annotationY}
				charsPerRow={seq.length}
				{charWidth}
			/>
		</g>
	{/if}

	<!-- Sequence bases -->
	<g transform="translate({SEQ_X}, {seqY})">
		{#each seq.split('') as base, i}
			{@const color = nucleotideColors[base.toUpperCase()] ?? '#999'}
			<text
				x={i * charWidth + charWidth / 2}
				y={LINE_HEIGHT / 2 + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				fill={color}
				font-size="12"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
				font-weight="500"
			>{base.toUpperCase()}</text>
		{/each}
	</g>

	<!-- Translation track -->
	{#if showTranslations && translations.length > 0}
		<g transform="translate({SEQ_X}, 0)">
			{#each translations as translation}
				<TranslationTrack
					{translation}
					{start}
					{end}
					y={translationY}
					{charWidth}
				/>
			{/each}
		</g>
	{/if}

	<!-- Primer track -->
	{#if showPrimers && primers.length > 0}
		<g transform="translate({SEQ_X}, 0)">
			<PrimerTrack
				{primers}
				{start}
				{end}
				y={primerY}
				charsPerRow={seq.length}
				{charWidth}
			/>
		</g>
	{/if}
</g>
