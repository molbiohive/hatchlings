<script lang="ts">
	import type { Part, Translation } from '../../types/index.js';
	import { nucleotideColors } from '../../util/colors.js';
	import AnnotationTrack from './AnnotationTrack.svelte';
	import TranslationTrack from './TranslationTrack.svelte';

	interface Props {
		/** Sequence string for this row */
		seq: string;
		/** Bp position of the first base in this row (0-based) */
		start: number;
		/** Parts overlapping this row (unified features + primers) */
		parts?: Part[];
		/** Translations overlapping this row */
		translations?: Translation[];
		/** Width of each character in pixels */
		charWidth?: number;
		/** Show position numbers on left */
		showNumbers?: boolean;
		/** Show annotation tracks */
		showAnnotations?: boolean;
		/** Show translations */
		showTranslations?: boolean;
		/** Show complement strand */
		showComplement?: boolean;
		/** Color individual bases */
		colorBases?: boolean;
		/** Extra vertical gap between annotations and sequence (for cut site labels) */
		cutsiteGap?: number;
		/** Part click callback */
		onpartclick?: (part: Part) => void;
		/** Part hover callback */
		onparthover?: (part: Part | null, e?: MouseEvent) => void;
	}

	let {
		seq,
		start,
		parts = [],
		translations = [],
		charWidth = 10,
		showNumbers = true,
		showAnnotations = true,
		showTranslations = true,
		showComplement = true,
		colorBases = false,
		cutsiteGap = 0,
		onpartclick,
		onparthover,
	}: Props = $props();

	const COMPLEMENT_MAP: Record<string, string> = {
		A: 'T', T: 'A', G: 'C', C: 'G',
	};
	function complementBase(b: string): string {
		return COMPLEMENT_MAP[b.toUpperCase()] ?? b;
	}

	const MONO_COLOR = 'var(--hatch-seq-base-mono, #8a95a5)';

	const colorMap = nucleotideColors;

	const end = $derived(start + seq.length);
	const NUMBER_WIDTH = 50;
	const SEQ_X = $derived(showNumbers ? NUMBER_WIDTH : 0);
	const LINE_HEIGHT = 14;

	/** Compute lane count for annotation track */
	const annotationLanes = $derived.by(() => {
		if (!showAnnotations || parts.length === 0) return 0;
		const visible = parts.filter((p) => p.start < end && p.end > start);
		if (visible.length === 0) return 0;

		const sorted = [...visible].sort((a, b) => a.start - b.start);
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
			if (!assigned) {
				lanes.push({ end: part.end });
			}
		}
		return lanes.length;
	});

	const ANNOTATION_TRACK_HEIGHT = $derived(annotationLanes * 18);

	const annotationY = 0;
	const seqY = $derived(ANNOTATION_TRACK_HEIGHT + (annotationLanes > 0 ? 4 : 0) + cutsiteGap);
	const complementY = $derived(seqY + LINE_HEIGHT + 2);
	const complementOffset = $derived(showComplement ? LINE_HEIGHT + 2 : 0);
	const translationY = $derived(seqY + LINE_HEIGHT + complementOffset + 4);
	const totalHeight = $derived(
		translationY +
			(showTranslations && translations.length > 0 ? 24 : 0)
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
			fill="var(--hatch-line-number, #566070)"
			font-size="10"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>{start + 1}</text>
	{/if}

	<!-- Annotation track (unified parts) -->
	{#if showAnnotations && parts.length > 0}
		<g transform="translate({SEQ_X}, 0)">
			<AnnotationTrack
				{parts}
				{start}
				{end}
				y={annotationY}
				charsPerRow={seq.length}
				{charWidth}
				{onpartclick}
				{onparthover}
			/>
		</g>
	{/if}

	<!-- Direction indicators (right side only, to avoid overlap with line numbers) -->
	{#if showComplement}
		<text
			x={SEQ_X + seq.length * charWidth + 4}
			y={seqY + LINE_HEIGHT / 2 + 1}
			text-anchor="start"
			dominant-baseline="middle"
			fill="var(--hatch-text-dim, #566070)"
			font-size="8"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>5'→3'</text>
		<text
			x={SEQ_X + seq.length * charWidth + 4}
			y={complementY + LINE_HEIGHT / 2 + 1}
			text-anchor="start"
			dominant-baseline="middle"
			fill="var(--hatch-text-dim, #566070)"
			font-size="8"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
		>3'→5'</text>
	{/if}

	<!-- Forward strand bases -->
	<g transform="translate({SEQ_X}, {seqY})">
		{#each seq.split('') as base, i}
			{@const upper = base.toUpperCase()}
			{@const color = colorBases ? (colorMap[upper] ?? '#999') : MONO_COLOR}
			<text
				x={i * charWidth + charWidth / 2}
				y={LINE_HEIGHT / 2 + 1}
				text-anchor="middle"
				dominant-baseline="middle"
				fill={color}
				font-size="12"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
				font-weight="500"
			>{upper}</text>
		{/each}
	</g>

	<!-- Complement strand -->
	{#if showComplement}
		<g transform="translate({SEQ_X}, {complementY})">
			{#each seq.split('') as base, i}
				{@const upper = base.toUpperCase()}
				{@const comp = complementBase(upper)}
				{@const color = colorBases ? (colorMap[comp] ?? '#999') : MONO_COLOR}
				<text
					x={i * charWidth + charWidth / 2}
					y={LINE_HEIGHT / 2 + 1}
					text-anchor="middle"
					dominant-baseline="middle"
					fill={color}
					font-size="12"
					font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
					font-weight="500"
				>{comp}</text>
			{/each}
		</g>
	{/if}

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
</g>
