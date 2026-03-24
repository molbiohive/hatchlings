<script lang="ts">
	import type { Part, Alphabet } from '../../types/index.js';
	import { nucleotideColors, aminoAcidColors, getFeatureColor } from '../../util/colors.js';

	interface Props {
		/** First sequence */
		seqA: string;
		/** Second sequence */
		seqB: string;
		/** Label for first construct */
		nameA?: string;
		/** Label for second construct */
		nameB?: string;
		/** Features on construct A */
		featuresA?: Part[];
		/** Features on construct B */
		featuresB?: Part[];
		/** Sequence alphabet */
		alphabet?: Alphabet;
		/** Width of the SVG */
		width?: number;
	}

	let {
		seqA,
		seqB,
		nameA = 'Construct A',
		nameB = 'Construct B',
		featuresA = [],
		featuresB = [],
		alphabet = 'dna',
		width = 750,
		maxHeight = 500,
	}: Props & { maxHeight?: number } = $props();

	let colorMap = $derived(alphabet === 'protein' ? aminoAcidColors : nucleotideColors);

	const MARGIN = { top: 40, left: 10, right: 10 };
	const TRACK_H = 20;
	const LABEL_H = 22;
	const BACKBONE_H = 6;
	const FEATURE_H = 14;
	const FEATURE_GAP = 2;
	const SECTION_GAP = 16;
	const DIFF_REGION_H = 60;
	const CONNECTOR_MIN_W = 2;

	let barW = $derived(width - MARGIN.left - MARGIN.right);

	/** Align sequences using simple Needleman-Wunsch-ish approach:
	 *  For construct comparison, find matching/inserted/deleted blocks. */
	let diffBlocks = $derived.by(() => {
		// Simple LCS-based diff at block level
		const maxLen = Math.max(seqA.length, seqB.length);
		if (maxLen === 0) return { matches: [], insertions: [], deletions: [], mismatches: [] };

		const matches: { startA: number; startB: number; length: number }[] = [];
		const mismatches: { posA: number; posB: number }[] = [];

		// Walk both sequences character-by-character (pre-aligned)
		const padA = seqA.padEnd(maxLen, '-');
		const padB = seqB.padEnd(maxLen, '-');

		let currentMatch: { startA: number; startB: number; length: number } | null = null;

		for (let i = 0; i < maxLen; i++) {
			const a = padA[i]?.toUpperCase();
			const b = padB[i]?.toUpperCase();

			if (a === b && a !== '-') {
				if (currentMatch) {
					currentMatch.length++;
				} else {
					currentMatch = { startA: i, startB: i, length: 1 };
				}
			} else {
				if (currentMatch) {
					matches.push(currentMatch);
					currentMatch = null;
				}
				if (a !== '-' && b !== '-' && a !== b) {
					mismatches.push({ posA: i, posB: i });
				}
			}
		}
		if (currentMatch) matches.push(currentMatch);

		// Find regions only in A (deletions from B's perspective)
		const deletions: { start: number; end: number }[] = [];
		for (let i = 0; i < maxLen; i++) {
			if (padA[i] !== '-' && padB[i] === '-') {
				if (deletions.length > 0 && deletions[deletions.length - 1].end === i) {
					deletions[deletions.length - 1].end = i + 1;
				} else {
					deletions.push({ start: i, end: i + 1 });
				}
			}
		}

		// Find regions only in B (insertions from A's perspective)
		const insertions: { start: number; end: number }[] = [];
		for (let i = 0; i < maxLen; i++) {
			if (padB[i] !== '-' && padA[i] === '-') {
				if (insertions.length > 0 && insertions[insertions.length - 1].end === i) {
					insertions[insertions.length - 1].end = i + 1;
				} else {
					insertions.push({ start: i, end: i + 1 });
				}
			}
		}

		return { matches, insertions, deletions, mismatches };
	});

	/** Stats */
	let stats = $derived.by(() => {
		const maxLen = Math.max(seqA.length, seqB.length);
		const matchBp = diffBlocks.matches.reduce((s, m) => s + m.length, 0);
		const mismatchCount = diffBlocks.mismatches.length;
		const insertedBp = diffBlocks.insertions.reduce((s, r) => s + (r.end - r.start), 0);
		const deletedBp = diffBlocks.deletions.reduce((s, r) => s + (r.end - r.start), 0);
		const identity = maxLen > 0 ? (matchBp / maxLen * 100) : 0;
		return { matchBp, mismatchCount, insertedBp, deletedBp, identity, lenA: seqA.length, lenB: seqB.length };
	});

	/** Scale bp position to x coordinate for a given sequence length */
	function scaleA(bp: number): number {
		return MARGIN.left + (bp / Math.max(seqA.length, 1)) * barW;
	}
	function scaleB(bp: number): number {
		return MARGIN.left + (bp / Math.max(seqB.length, 1)) * barW;
	}
	function scaleW(bp: number, len: number): number {
		return Math.max(CONNECTOR_MIN_W, (bp / Math.max(len, 1)) * barW);
	}

	/** Layout Y positions */
	let yLabelA = MARGIN.top;
	let yFeatA = $derived(yLabelA + LABEL_H);
	let featALanes = $derived(assignLanes(featuresA));
	let featAHeight = $derived(Math.max(0, featALanes.maxLane + 1) * (FEATURE_H + FEATURE_GAP));
	let yBackboneA = $derived(yFeatA + featAHeight + 4);
	let yDiffStart = $derived(yBackboneA + BACKBONE_H + 8);
	let yDiffEnd = $derived(yDiffStart + DIFF_REGION_H);
	let yBackboneB = $derived(yDiffEnd + 8);
	let yFeatB = $derived(yBackboneB + BACKBONE_H + 4);
	let featBLanes = $derived(assignLanes(featuresB));
	let featBHeight = $derived(Math.max(0, featBLanes.maxLane + 1) * (FEATURE_H + FEATURE_GAP));
	let yLabelB = $derived(yFeatB + featBHeight + 4);
	let totalHeight = $derived(yLabelB + LABEL_H + 10);
	let ly = $derived(totalHeight - 4);

	function assignLanes(features: Part[]): { assignments: Map<Part, number>; maxLane: number } {
		const sorted = [...features].sort((a, b) => a.start - b.start);
		const lanes: { end: number }[] = [];
		const assignments = new Map<Part, number>();
		for (const f of sorted) {
			let lane = -1;
			for (let i = 0; i < lanes.length; i++) {
				if (f.start >= lanes[i].end) { lane = i; lanes[i].end = f.end; break; }
			}
			if (lane === -1) { lane = lanes.length; lanes.push({ end: f.end }); }
			assignments.set(f, lane);
		}
		return { assignments, maxLane: lanes.length - 1 };
	}
</script>

<div class="diff-scroll-container" style:max-height="{maxHeight}px">
<svg {width} height={totalHeight} class="hatch-diff-viewer" role="img" aria-label="Construct comparison">
	<!-- ===== CONSTRUCT A ===== -->
	<text x={MARGIN.left} y={yLabelA + 14} class="construct-label">{nameA}</text>
	<text x={MARGIN.left + barW} y={yLabelA + 14} text-anchor="end" class="construct-length">{stats.lenA} {alphabet === 'protein' ? 'aa' : 'bp'}</text>

	<!-- Features A -->
	{#each featuresA as feat}
		{@const lane = featALanes.assignments.get(feat) ?? 0}
		{@const fx = scaleA(feat.start)}
		{@const fw = scaleW(feat.end - feat.start, seqA.length)}
		{@const fy = yFeatA + lane * (FEATURE_H + FEATURE_GAP)}
		{@const color = getFeatureColor(feat.type, feat.color)}
		<rect x={fx} y={fy} width={fw} height={FEATURE_H} fill={color} fill-opacity="0.75" rx="3" />
		{#if fw > 30}
			<text x={fx + fw / 2} y={fy + FEATURE_H / 2 + 1} text-anchor="middle" dominant-baseline="middle" class="feature-text">{feat.label ?? feat.name}</text>
		{/if}
	{/each}

	<!-- Backbone A -->
	<rect x={MARGIN.left} y={yBackboneA} width={barW} height={BACKBONE_H} fill="var(--hatch-ring-color, #4a5a6a)" rx="3" />

	<!-- ===== DIFF REGION ===== -->

	<!-- Matching blocks: connectors between A and B -->
	{#each diffBlocks.matches as m}
		{@const xA1 = scaleA(m.startA)}
		{@const xA2 = scaleA(m.startA + m.length)}
		{@const xB1 = scaleB(m.startB)}
		{@const xB2 = scaleB(m.startB + m.length)}
		<path
			d="M {xA1} {yBackboneA + BACKBONE_H} L {xB1} {yBackboneB} L {xB2} {yBackboneB} L {xA2} {yBackboneA + BACKBONE_H} Z"
			fill="var(--hatch-positive, #58b56a)"
			fill-opacity="0.12"
		/>
	{/each}

	<!-- Mismatch markers -->
	{#each diffBlocks.mismatches as mm}
		{@const xA = scaleA(mm.posA)}
		{@const xB = scaleB(mm.posB)}
		<line x1={xA + 1} y1={yBackboneA + BACKBONE_H} x2={xB + 1} y2={yBackboneB} stroke="var(--hatch-warning, #d9953a)" stroke-width="1" stroke-opacity="0.5" />
		<rect x={xA} y={yBackboneA - 1} width={Math.max(2, barW / Math.max(seqA.length, 1))} height={BACKBONE_H + 2} fill="var(--hatch-warning, #d9953a)" fill-opacity="0.8" rx="1" />
		<rect x={xB} y={yBackboneB - 1} width={Math.max(2, barW / Math.max(seqB.length, 1))} height={BACKBONE_H + 2} fill="var(--hatch-warning, #d9953a)" fill-opacity="0.8" rx="1" />
	{/each}

	<!-- Deletions (in A only) — red markers on A backbone -->
	{#each diffBlocks.deletions as del}
		{@const x = scaleA(del.start)}
		{@const w = scaleW(del.end - del.start, seqA.length)}
		<rect x={x} y={yBackboneA - 2} width={w} height={BACKBONE_H + 4} fill="var(--hatch-negative, #d45858)" fill-opacity="0.6" rx="2" />
		<text x={x + w / 2} y={yDiffStart + DIFF_REGION_H * 0.3} text-anchor="middle" class="diff-label-del">-{del.end - del.start}</text>
	{/each}

	<!-- Insertions (in B only) — green markers on B backbone -->
	{#each diffBlocks.insertions as ins}
		{@const x = scaleB(ins.start)}
		{@const w = scaleW(ins.end - ins.start, seqB.length)}
		<rect x={x} y={yBackboneB - 2} width={w} height={BACKBONE_H + 4} fill="var(--hatch-positive, #58b56a)" fill-opacity="0.6" rx="2" />
		<text x={x + w / 2} y={yDiffStart + DIFF_REGION_H * 0.7} text-anchor="middle" class="diff-label-ins">+{ins.end - ins.start}</text>
	{/each}

	<!-- Stats bar -->
	<text x={MARGIN.left} y={yDiffStart + DIFF_REGION_H / 2 + 1} dominant-baseline="middle" class="stats-text">
		Identity: {stats.identity.toFixed(1)}%  |  {stats.mismatchCount} mismatches  |  +{stats.insertedBp} ins  |  -{stats.deletedBp} del
	</text>

	<!-- ===== CONSTRUCT B ===== -->

	<!-- Backbone B -->
	<rect x={MARGIN.left} y={yBackboneB} width={barW} height={BACKBONE_H} fill="var(--hatch-ring-color, #4a5a6a)" rx="3" />

	<!-- Features B -->
	{#each featuresB as feat}
		{@const lane = featBLanes.assignments.get(feat) ?? 0}
		{@const fx = scaleB(feat.start)}
		{@const fw = scaleW(feat.end - feat.start, seqB.length)}
		{@const fy = yFeatB + lane * (FEATURE_H + FEATURE_GAP)}
		{@const color = getFeatureColor(feat.type, feat.color)}
		<rect x={fx} y={fy} width={fw} height={FEATURE_H} fill={color} fill-opacity="0.75" rx="3" />
		{#if fw > 30}
			<text x={fx + fw / 2} y={fy + FEATURE_H / 2 + 1} text-anchor="middle" dominant-baseline="middle" class="feature-text">{feat.label ?? feat.name}</text>
		{/if}
	{/each}

	<text x={MARGIN.left} y={yLabelB + 14} class="construct-label">{nameB}</text>
	<text x={MARGIN.left + barW} y={yLabelB + 14} text-anchor="end" class="construct-length">{stats.lenB} {alphabet === 'protein' ? 'aa' : 'bp'}</text>

	<!-- Legend -->
	<rect x={MARGIN.left} y={ly - 8} width={8} height={8} fill="var(--hatch-positive, #58b56a)" fill-opacity="0.5" rx="2" />
	<text x={MARGIN.left + 12} y={ly} class="legend-text">Match</text>
	<rect x={MARGIN.left + 55} y={ly - 8} width={8} height={8} fill="var(--hatch-warning, #d9953a)" fill-opacity="0.8" rx="2" />
	<text x={MARGIN.left + 67} y={ly} class="legend-text">Mismatch</text>
	<rect x={MARGIN.left + 130} y={ly - 8} width={8} height={8} fill="var(--hatch-negative, #d45858)" fill-opacity="0.6" rx="2" />
	<text x={MARGIN.left + 142} y={ly} class="legend-text">Deletion</text>
	<rect x={MARGIN.left + 200} y={ly - 8} width={8} height={8} fill="var(--hatch-positive, #58b56a)" fill-opacity="0.6" rx="2" />
	<text x={MARGIN.left + 212} y={ly} class="legend-text">Insertion</text>
</svg>
</div>

<style>
	.diff-scroll-container {
		overflow-y: auto;
	}

	.hatch-diff-viewer {
		background: var(--hatch-bg, #0c1018);
		display: block;
	}

	.construct-label {
		font-size: 13px;
		font-weight: 600;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.construct-length {
		font-size: 11px;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.feature-text {
		font-size: 9px;
		font-weight: 600;
		fill: var(--hatch-annotation-text, #fff);
		font-family: var(--hatch-font, -apple-system, sans-serif);
	}

	.stats-text {
		font-size: 11px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.diff-label-del {
		font-size: 10px;
		font-weight: 600;
		fill: var(--hatch-negative, #d45858);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.diff-label-ins {
		font-size: 10px;
		font-weight: 600;
		fill: var(--hatch-positive, #58b56a);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.legend-text {
		font-size: 9px;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font, -apple-system, sans-serif);
	}
</style>
