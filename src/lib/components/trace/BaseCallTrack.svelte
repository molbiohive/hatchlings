<script lang="ts">
	import { nucleotideColors } from '../../util/colors.js';

	interface Props {
		/** Base call string (e.g. "ATCGATCG...") */
		baseCalls: string;
		/** Peak position for each base call (data point index) */
		peakPositions: number[];
		/** Phred quality score for each base call */
		qualityScores: number[];
		/** SVG width in pixels */
		width: number;
		/** Horizontal zoom factor */
		zoom?: number;
		/** Horizontal scroll offset in pixels */
		scrollX?: number;
		/** Quality threshold: bases below this shown at reduced opacity */
		trimQuality?: number;
	}

	let {
		baseCalls,
		peakPositions,
		qualityScores,
		width,
		zoom = 1,
		scrollX = 0,
		trimQuality = 20,
	}: Props = $props();

	const TRACK_HEIGHT = 60;
	const QUALITY_BAR_HEIGHT = 24;
	const BASE_FONT_SIZE = 13;
	const MAX_QUALITY = 60;

	/** Compute the visible base call items with position, color, opacity, quality */
	let visibleBases = $derived.by(() => {
		const items: Array<{
			base: string;
			x: number;
			color: string;
			opacity: number;
			quality: number;
			qualityHeight: number;
		}> = [];

		for (let i = 0; i < baseCalls.length; i++) {
			if (i >= peakPositions.length) break;

			const x = peakPositions[i] * zoom - scrollX;

			// Skip bases outside the visible range (with small margin)
			if (x < -20 || x > width + 20) continue;

			const base = baseCalls[i];
			const quality = i < qualityScores.length ? qualityScores[i] : 0;
			const color = nucleotideColors[base] ?? nucleotideColors['N'];
			const opacity = quality < trimQuality ? 0.35 : 1.0;
			const qualityHeight = Math.min(quality / MAX_QUALITY, 1) * QUALITY_BAR_HEIGHT;

			items.push({ base, x, color, opacity, quality, qualityHeight });
		}

		return items;
	});
</script>

<svg
	{width}
	height={TRACK_HEIGHT}
	viewBox="0 0 {width} {TRACK_HEIGHT}"
	style="display: block; background: var(--hatch-bg, #0d1117);"
>
	<!-- Quality score bars behind each base -->
	{#each visibleBases as item}
		<rect
			x={item.x - 5}
			y={QUALITY_BAR_HEIGHT - item.qualityHeight}
			width={10}
			height={item.qualityHeight}
			fill={item.color}
			fill-opacity={item.opacity * 0.25}
			rx="1"
		/>
	{/each}

	<!-- Quality threshold line -->
	<line
		x1={0}
		y1={QUALITY_BAR_HEIGHT - (trimQuality / MAX_QUALITY) * QUALITY_BAR_HEIGHT}
		x2={width}
		y2={QUALITY_BAR_HEIGHT - (trimQuality / MAX_QUALITY) * QUALITY_BAR_HEIGHT}
		stroke="rgba(255,100,100,0.3)"
		stroke-width="0.5"
		stroke-dasharray="4,3"
	/>

	<!-- Base call letters -->
	{#each visibleBases as item}
		<text
			x={item.x}
			y={QUALITY_BAR_HEIGHT + 8 + BASE_FONT_SIZE}
			text-anchor="middle"
			dominant-baseline="auto"
			fill={item.color}
			fill-opacity={item.opacity}
			font-size={BASE_FONT_SIZE}
			font-weight="600"
			font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', 'Consolas', monospace)"
		>
			{item.base}
		</text>
	{/each}
</svg>

<style>
	svg {
		border-radius: 0;
	}
</style>
