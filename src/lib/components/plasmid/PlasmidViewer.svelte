<script lang="ts">
	import type { Part, CutSite } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import { formatBp, computeCircularAnnotationLayers, arcMidpoint, bpToXY, bpToAngle, relaxLabels } from '../../util/coordinates.js';
	import type { LabelPosition } from '../../util/coordinates.js';
	import { getFeatureColor, isPrimer, PRIMER_COLOR } from '../../util/colors.js';
	import PlasmidRing from './PlasmidRing.svelte';
	import PartArc from './PartArc.svelte';
	import CutSiteMarker from './CutSiteMarker.svelte';
	import PlasmidLabel from './PlasmidLabel.svelte';
	import CircularSelection from './CircularSelection.svelte';
	import type { HoverInfo } from '../../types/utility.js';

	const TWO_PI = 2 * Math.PI;

	interface Props {
		name: string;
		size: number;
		parts?: Part[];
		cutSites?: CutSite[];
		selectionState?: SelectionState;
		width?: number;
		height?: number;
		showLabels?: boolean;
		showTicks?: boolean;
		showInternalLabels?: boolean;
		/** Sequence topology */
		topology?: 'circular' | 'linear';
		onselect?: (selection: { start: number; end: number }) => void;
		onselectionchange?: (selection: { start: number; end: number } | null) => void;
		oncaretmove?: (position: number) => void;
		onpartclick?: (part: Part) => void;
		oncopysequence?: (sequence: string) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		name,
		size,
		parts = [],
		cutSites = [],
		selectionState,
		width = 500,
		height = 500,
		showLabels = true,
		showTicks = true,
		showInternalLabels = true,
		topology = 'circular',
		onselect,
		onselectionchange,
		oncaretmove,
		onpartclick,
		oncopysequence,
		onhoverinfo,
	}: Props = $props();

	let svgElement: SVGSVGElement | undefined = $state(undefined);

	let cx = $derived(width / 2);
	let cy = $derived(height / 2);

	let baseRadius = $derived(Math.min(width, height) * 0.32);

	// --- Layer computation ---

	const PART_WIDTH = 14;
	const PART_GAP = 4;
	const CUTSITE_SPACE = 14;
	const LABEL_PADDING = 16;

	/** Split parts into features and primers (no enrichment — plasmid shows simple arcs) */
	let features = $derived(parts.filter(p => !isPrimer(p)));
	let primers = $derived(parts.filter(p => isPrimer(p)));

	/** Split features into forward (+) and reverse (-) groups with indices into features array */
	let forwardParts = $derived(features.map((p, i) => ({ part: p, index: i })).filter(x => x.part.strand !== -1));
	let reverseParts = $derived(features.map((p, i) => ({ part: p, index: i })).filter(x => x.part.strand === -1));

	/** Compute stacking layers for each group separately (circular-aware for wrapping parts) */
	let forwardOffsets = $derived.by(() => {
		const intervals = forwardParts.map(x => ({ start: x.part.start, end: x.part.end }));
		return computeCircularAnnotationLayers(intervals, size);
	});
	let reverseOffsets = $derived.by(() => {
		const intervals = reverseParts.map(x => ({ start: x.part.start, end: x.part.end }));
		return computeCircularAnnotationLayers(intervals, size);
	});

	/** Max stacking depth per group */
	let maxForwardLayer = $derived.by(() => {
		let max = 0;
		for (const v of forwardOffsets.values()) if (v > max) max = v;
		return max;
	});
	let maxReverseLayer = $derived.by(() => {
		let max = 0;
		for (const v of reverseOffsets.values()) if (v > max) max = v;
		return max;
	});

	/** Primer stacking layers */
	let forwardPrimers = $derived(primers.filter(p => p.strand !== -1));
	let reversePrimers = $derived(primers.filter(p => p.strand === -1));

	let forwardPrimerOffsets = $derived.by(() => {
		const intervals = forwardPrimers.map(p => ({ start: p.start, end: p.end }));
		return computeCircularAnnotationLayers(intervals, size);
	});
	let reversePrimerOffsets = $derived.by(() => {
		const intervals = reversePrimers.map(p => ({ start: p.start, end: p.end }));
		return computeCircularAnnotationLayers(intervals, size);
	});

	let maxForwardPrimerLayer = $derived.by(() => {
		let max = 0;
		for (const v of forwardPrimerOffsets.values()) if (v > max) max = v;
		return forwardPrimers.length > 0 ? max : -1;
	});
	let maxReversePrimerLayer = $derived.by(() => {
		let max = 0;
		for (const v of reversePrimerOffsets.values()) if (v > max) max = v;
		return reversePrimers.length > 0 ? max : -1;
	});

	/** Scale band width — ticks and labels live between two circles */
	const SCALE_BAND = 16;

	/** Forward features: just outside backbone + cut site space */
	let forwardRadius = $derived(
		baseRadius + CUTSITE_SPACE + (cutSites.length > 0 ? 4 : 0)
	);

	/** Forward primers: beyond the forward feature ring */
	let primerForwardRadius = $derived(
		forwardRadius +
		(forwardParts.length > 0
			? (maxForwardLayer + 1) * (PART_WIDTH + PART_GAP) + 4
			: 4)
	);

	/** Reverse features: just inside scale band */
	let reverseRadius = $derived(baseRadius - SCALE_BAND - 10);

	/** Reverse primers: beyond reverse features (further inward) */
	let primerReverseRadius = $derived(
		reverseRadius -
		(reverseParts.length > 0
			? (maxReverseLayer + 1) * (PART_WIDTH + PART_GAP) + 4
			: 4)
	);

	/** Outer label radius (above forward primers — now outermost ring) */
	let labelRadius = $derived(
		primerForwardRadius +
		(forwardPrimers.length > 0
			? (maxForwardPrimerLayer + 1) * (PART_WIDTH + PART_GAP)
			: 0) + 12
	);

	/** Build a unified featureRenderInfo map: feature index → { radius, layer } for PartArc rendering */
	let featureRenderInfo = $derived.by(() => {
		const info = new Map<number, { radius: number; yOffset: number }>();
		for (let fi = 0; fi < forwardParts.length; fi++) {
			const origIdx = forwardParts[fi].index;
			const layer = forwardOffsets.get(fi) ?? 0;
			info.set(origIdx, { radius: forwardRadius, yOffset: layer });
		}
		for (let ri = 0; ri < reverseParts.length; ri++) {
			const origIdx = reverseParts[ri].index;
			const layer = reverseOffsets.get(ri) ?? 0;
			info.set(origIdx, { radius: reverseRadius, yOffset: -layer });
		}
		return info;
	});

	/** Build primer render info */
	let primerRenderInfo = $derived.by(() => {
		const info = new Map<number, { radius: number; yOffset: number }>();
		for (let fi = 0; fi < forwardPrimers.length; fi++) {
			const layer = forwardPrimerOffsets.get(fi) ?? 0;
			info.set(fi, { radius: primerForwardRadius, yOffset: layer });
		}
		for (let ri = 0; ri < reversePrimers.length; ri++) {
			const layer = reversePrimerOffsets.get(ri) ?? 0;
			info.set(forwardPrimers.length + ri, { radius: primerReverseRadius, yOffset: -layer });
		}
		return info;
	});

	/** Combined primer list for rendering (forward then reverse) */
	let allPrimers = $derived([...forwardPrimers, ...reversePrimers]);

	/** Unique cutter enzymes (appear exactly once) */
	let uniqueCutters = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const cs of cutSites) {
			counts.set(cs.enzyme, (counts.get(cs.enzyme) ?? 0) + 1);
		}
		const unique = new Set<string>();
		for (const [enzyme, count] of counts) {
			if (count === 1) unique.add(enzyme);
		}
		return unique;
	});

	/** Cluster nearby cut sites for label display */
	const CLUSTER_BP = 30; // bp threshold for grouping
	type CutSiteCluster = { primary: CutSite; primaryIndex: number; enzymes: string[]; indices: number[] };
	let cutSiteClusters = $derived.by(() => {
		if (cutSites.length === 0) return [] as CutSiteCluster[];
		const sorted = cutSites.map((cs, i) => ({ cs, i })).sort((a, b) => a.cs.position - b.cs.position);
		const clusters: CutSiteCluster[] = [];
		for (const entry of sorted) {
			const last = clusters[clusters.length - 1];
			if (last && entry.cs.position - last.primary.position <= CLUSTER_BP) {
				last.enzymes.push(entry.cs.enzyme);
				last.indices.push(entry.i);
			} else {
				clusters.push({
					primary: entry.cs,
					primaryIndex: entry.i,
					enzymes: [entry.cs.enzyme],
					indices: [entry.i],
				});
			}
		}
		return clusters;
	});

	let selectedPart: Part | null = $state(null);

	// Rotation state for circular mode (Ctrl+drag)
	let rotationDeg = $state(0);
	let isRotating = $state(false);
	let rotateStartAngle = $state(0);
	let rotateStartRotation = $state(0);

	// Selection interaction state
	let isSelectDragging = $state(false);

	/** Convert mouse position to bp on the circular map */
	function mouseToBp(e: MouseEvent): number {
		const rect = svgElement?.getBoundingClientRect();
		if (!rect) return 0;
		const mx = e.clientX - rect.left - cx;
		const my = e.clientY - rect.top - cy;
		let angle = Math.atan2(my, mx) + Math.PI / 2;
		angle -= (rotationDeg * Math.PI) / 180;
		angle = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
		return Math.round((angle / TWO_PI) * size) % size;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		rotationDeg += e.deltaY * 0.3;
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;

		if (e.ctrlKey || e.metaKey) {
			isRotating = true;
			const rect = svgElement?.getBoundingClientRect();
			if (!rect) return;
			const mx = e.clientX - rect.left - cx;
			const my = e.clientY - rect.top - cy;
			rotateStartAngle = Math.atan2(my, mx) * (180 / Math.PI);
			rotateStartRotation = rotationDeg;
		} else if (selectionState) {
			const bp = mouseToBp(e);
			selectionState.startDrag(bp);
			isSelectDragging = true;
			oncaretmove?.(bp);
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isRotating) {
			const rect = svgElement?.getBoundingClientRect();
			if (!rect) return;
			const mx = e.clientX - rect.left - cx;
			const my = e.clientY - rect.top - cy;
			const currentAngle = Math.atan2(my, mx) * (180 / Math.PI);
			rotationDeg = rotateStartRotation + (currentAngle - rotateStartAngle);
		} else if (isSelectDragging && selectionState) {
			const bp = mouseToBp(e);
			selectionState.updateDrag(bp);
		}
	}

	function handleMouseUp() {
		if (isRotating) {
			isRotating = false;
		}
		if (isSelectDragging && selectionState) {
			selectionState.endDrag();
			isSelectDragging = false;
			const range = selectionState.range;
			if (range) {
				onselect?.({ start: range.start, end: range.end });
				onselectionchange?.(range);
			} else {
				onselectionchange?.(null);
			}
		}
	}

	function handlePartMouseEnter(e: MouseEvent, part: Part) {
		const bpLen = ((part.end - part.start + size) % size) || size;
		onhoverinfo?.({
			title: part.name,
			items: [
				{ label: 'Type', value: part.type },
				{ label: 'Location', value: `${part.start}..${part.end}` },
				{ label: 'Strand', value: part.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				{ label: 'Length', value: bpLen, unit: 'bp' },
				...(part.tm !== undefined ? [{ label: 'Tm', value: part.tm.toFixed(1), unit: '°C' }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleCutSiteMouseEnter(e: MouseEvent, cutSite: CutSite) {
		onhoverinfo?.({
			title: cutSite.enzyme,
			items: [
				{ label: 'Position', value: cutSite.position, unit: 'bp' },
				{ label: 'Strand', value: cutSite.strand === 1 ? 'Forward (+)' : 'Reverse (-)' },
				...(cutSite.overhang ? [{ label: 'Overhang', value: cutSite.overhang }] : []),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleClusterMouseEnter(e: MouseEvent, cluster: CutSiteCluster) {
		onhoverinfo?.({
			title: cluster.enzymes.length === 1 ? cluster.primary.enzyme : `${cluster.primary.enzyme} +${cluster.enzymes.length - 1}`,
			items: [
				{ label: 'Position', value: cluster.primary.position, unit: 'bp' },
				...(cluster.enzymes.length > 1
					? [{ label: 'Enzymes', value: cluster.enzymes.join(', ') }]
					: [{ label: 'Strand', value: cluster.primary.strand === 1 ? 'Forward (+)' : 'Reverse (-)' }]),
			],
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function handleClusterClick(cluster: CutSiteCluster) {
		const start = cluster.primary.position;
		const last = cutSites[cluster.indices[cluster.indices.length - 1]];
		const end = cutSiteEnd(last);
		if (selectionState) {
			selectionState.setSelection(start, end);
			onselect?.({ start, end });
			onselectionchange?.({ start, end });
		}
	}

	function handleMouseLeave() {
		onhoverinfo?.(null);
	}

	function handlePartClick(part: Part) {
		selectedPart = part;
		onpartclick?.(part);
		// Select the sequence region covered by this part
		if (selectionState) {
			selectionState.setSelection(part.start, part.end);
			onselect?.({ start: part.start, end: part.end });
			onselectionchange?.({ start: part.start, end: part.end });
			if (part.id) {
				selectionState.selectAnnotation(part.id);
			}
		}
	}

	function cutSiteEnd(site: CutSite): number {
		if (site.end !== undefined) return site.end;
		return site.position + Math.max(site.cutPosition ?? 1, site.complementCutPosition ?? 1);
	}

	function handleCutSiteClick(cutSite: CutSite) {
		const end = cutSiteEnd(cutSite);
		if (selectionState) {
			selectionState.setSelection(cutSite.position, end);
			onselect?.({ start: cutSite.position, end });
			onselectionchange?.({ start: cutSite.position, end });
		}
	}

	let sizeLabel = $derived(formatBp(size));

	/**
	 * Unified label positions: parts + cut sites.
	 * Forward parts + cut sites go to outer labels; reverse parts go to inner labels.
	 * Each group is relaxed separately.
	 */
	let allLabels = $derived.by(() => {
		if (!showLabels) return { part: [] as any[], cutSite: [] as any[] };

		type RawLabel = LabelPosition & {
			kind: 'part' | 'cutSite';
			color: string;
			index: number;
			bold?: boolean;
			partRef?: Part; // direct Part reference for hover/click
		};

		const raw: RawLabel[] = [];

		// Feature labels — only when internal label can't fit the full name
		const CHAR_WIDTH = 5.5; // approximate px per char at font-size 9px
		const ARROW_TIP_PX = 20; // arrowhead eats into usable text area
		for (let i = 0; i < features.length; i++) {
			const p = features[i];
			const ri = featureRenderInfo.get(i);
			if (!ri) continue;
			const effectiveR = ri.radius + ri.yOffset * (PART_WIDTH + PART_GAP);
			let bpLen = p.end - p.start;
			if (bpLen < 0) bpLen += size;
			const arcLenPx = (bpLen / size) * TWO_PI * effectiveR;
			const labelText = p.label ?? p.name;
			const textWidthPx = labelText.length * CHAR_WIDTH + 8;
			if (showInternalLabels && (arcLenPx - ARROW_TIP_PX) >= textWidthPx) continue;

			const mid = arcMidpoint(p.start, p.end, size, effectiveR, cx, cy);
			const dx = mid.x - cx;
			const dy = mid.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			const pushR = labelRadius + LABEL_PADDING;
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle: mid.angle,
				text: labelText,
				anchorX: mid.x,
				anchorY: mid.y,
				kind: 'part',
				color: getFeatureColor(p.type, p.color),
				index: i,
				partRef: p,
			});
		}

		// Primer labels — use full span
		for (let i = 0; i < allPrimers.length; i++) {
			const p = allPrimers[i];
			const ri = primerRenderInfo.get(i);
			if (!ri) continue;
			const effectiveR = ri.radius + ri.yOffset * (PART_WIDTH + PART_GAP);
			let bpLen = p.end - p.start;
			if (bpLen < 0) bpLen += size;
			const arcLenPx = (bpLen / size) * TWO_PI * effectiveR;
			const labelText = p.label ?? p.name;
			const textWidthPx = labelText.length * CHAR_WIDTH + 8;
			if (showInternalLabels && arcLenPx >= textWidthPx) continue;

			const mid = arcMidpoint(p.start, p.end, size, effectiveR, cx, cy);
			const dx = mid.x - cx;
			const dy = mid.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			const pushR = labelRadius + LABEL_PADDING;
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle: mid.angle,
				text: labelText,
				anchorX: mid.x,
				anchorY: mid.y,
				kind: 'part',
				color: PRIMER_COLOR,
				index: -1,
				partRef: p,
			});
		}

		// Cut site labels — clustered, one label per group
		for (let ci = 0; ci < cutSiteClusters.length; ci++) {
			const cluster = cutSiteClusters[ci];
			const pt = bpToXY(cluster.primary.position, size, baseRadius, cx, cy);
			const dx = pt.x - cx;
			const dy = pt.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			const pushR = labelRadius + LABEL_PADDING;
			const angle = Math.atan2(dy, dx);
			const labelText = cluster.enzymes.length === 1
				? cluster.primary.enzyme
				: `${cluster.primary.enzyme} +${cluster.enzymes.length - 1}`;
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle,
				text: labelText,
				anchorX: pt.x,
				anchorY: pt.y,
				kind: 'cutSite',
				color: '#d45858',
				index: ci, // cluster index
				bold: cluster.enzymes.length === 1 && uniqueCutters.has(cluster.primary.enzyme),
			});
		}

		// Single unified relaxation pass
		const relaxed = relaxLabels(raw, labelRadius + 60, 18);

		// Soft clamp: prevent labels from flying too far beyond viewport
		// Labels are allowed to extend past edges (overflow:visible) but we
		// keep them within a generous margin so connectors stay reasonable.
		const MARGIN = -40; // allow up to 40px outside viewport
		for (const label of relaxed) {
			label.y = Math.max(MARGIN, Math.min(height - MARGIN, label.y));
			const textWidth = label.text.length * 6;
			const isLeft = label.x < cx;
			if (isLeft) {
				if (label.x - textWidth < MARGIN) label.x = MARGIN + textWidth;
			} else {
				if (label.x + textWidth > width - MARGIN) label.x = width - MARGIN - textWidth;
			}
		}

		// Auto-merge labels that are too close after relaxation
		const MERGE_DIST = 16; // px threshold — labels closer than this get merged
		const merged: typeof relaxed = [];
		const used = new Set<number>();
		for (let i = 0; i < relaxed.length; i++) {
			if (used.has(i)) continue;
			const base = relaxed[i] as RawLabel;
			const group = [base];
			for (let j = i + 1; j < relaxed.length; j++) {
				if (used.has(j)) continue;
				const other = relaxed[j] as RawLabel;
				const dx2 = base.x - other.x;
				const dy2 = base.y - other.y;
				if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < MERGE_DIST) {
					group.push(other);
					used.add(j);
				}
			}
			if (group.length > 1) {
				base.text = `${base.text} +${group.length - 1}`;
			}
			merged.push(base);
		}

		// Split into categories
		const partLabels: typeof relaxed = [];
		const cutSiteLabels: typeof relaxed = [];

		for (const label of merged) {
			const rl = label as RawLabel;
			if (rl.kind === 'part') partLabels.push(label);
			else cutSiteLabels.push(label);
		}

		return { part: partLabels, cutSite: cutSiteLabels };
	});
</script>

<div class="plasmid-viewer" style:width="{width}px" style:height="{height}px" style:position="relative">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<svg
			bind:this={svgElement}
			{width}
			{height}
			viewBox="0 0 {width} {height}"
			overflow="visible"
			xmlns="http://www.w3.org/2000/svg"
			role="application"
			aria-label="Circular plasmid map for {name}"
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			style:cursor={isRotating ? 'grabbing' : (selectionState ? 'crosshair' : 'grab')}
		>
		<g transform="rotate({rotationDeg}, {cx}, {cy})">
			<!-- Layer 1: Label connector lines (behind everything) -->
			{#if showLabels}
				{#each [...allLabels.part, ...allLabels.cutSite] as lbl (lbl.text + lbl.anchorX + '-conn')}
					{@const rl = lbl as any}
					<PlasmidLabel
						name={lbl.text}
						x={lbl.x}
						y={lbl.y}
						anchorX={lbl.anchorX}
						anchorY={lbl.anchorY}
						{cx}
						{cy}
						labelRadius={labelRadius}
						color={rl.color}
						renderPart="connector"
						counterRotation={-rotationDeg}
					/>
				{/each}
			{/if}

			<!-- Layer 2: Selection overlay (behind backbone but above connectors) -->
			{#if selectionState}
				<CircularSelection
					selection={selectionState}
					totalSize={size}
					radius={baseRadius - SCALE_BAND - 4}
					{cx}
					{cy}
					width={labelRadius - baseRadius + SCALE_BAND + 12}
				/>
			{/if}

			<!-- Layer 3: Backbone ring with scale band -->
			<PlasmidRing {size} radius={baseRadius} {cx} {cy} {showTicks} rotation={rotationDeg} />

			<!-- Layer 4: Cut site markers on the backbone ring -->
			{#each cutSites as cutSite (cutSite.enzyme + cutSite.position)}
				<CutSiteMarker
					{cutSite}
					totalSize={size}
					radius={baseRadius}
					{cx}
					{cy}
					onmouseenter={(e) => handleCutSiteMouseEnter(e, cutSite)}
					onmouseleave={handleMouseLeave}
					onclick={() => handleCutSiteClick(cutSite)}
				/>
			{/each}

			<!-- Layer 5a: Feature arcs (inner ring, closer to backbone) -->
			{#each features as feature, i (feature.name + feature.start)}
				{@const ri = featureRenderInfo.get(i)}
				<PartArc
					part={feature}
					totalSize={size}
					radius={ri?.radius ?? forwardRadius}
					{cx}
					{cy}
					yOffset={ri?.yOffset ?? 0}
					showInternalLabel={showInternalLabels}
					rotation={rotationDeg}
					selected={selectedPart === feature}
					onmouseenter={(e) => handlePartMouseEnter(e, feature)}
					onmouseleave={handleMouseLeave}
					onclick={() => handlePartClick(feature)}
				/>
			{/each}

			<!-- Layer 5b: Primer arcs (outer ring, half-opaque teal, no overhangs/mismatches) -->
			{#each allPrimers as primer, i (primer.name + primer.start + '-primer')}
				{@const ri = primerRenderInfo.get(i)}
				<PartArc
					part={{ ...primer, bindingStart: undefined, bindingEnd: undefined, mismatches: undefined }}
					totalSize={size}
					radius={ri?.radius ?? primerForwardRadius}
					{cx}
					{cy}
					width={7}
					yOffset={ri?.yOffset ?? 0}
					showInternalLabel={showInternalLabels}
					rotation={rotationDeg}
					halfArrow={true}
					overrideColor={PRIMER_COLOR}
					fillOpacity={0.5}
					selected={selectedPart === primer}
					onmouseenter={(e) => handlePartMouseEnter(e, primer)}
					onmouseleave={handleMouseLeave}
					onclick={() => handlePartClick(primer)}
				/>
			{/each}

			<!-- Layer 6: Label dots + text (on top of everything) -->
			{#if showLabels}
				{#each allLabels.part as lbl (lbl.text + lbl.anchorX + '-lbl')}
					{@const rl = lbl as any}
					{@const part = rl.partRef as Part | undefined}
					<PlasmidLabel
						name={lbl.text}
						x={lbl.x}
						y={lbl.y}
						anchorX={lbl.anchorX}
						anchorY={lbl.anchorY}
						{cx}
						{cy}
						labelRadius={labelRadius}
						color={rl.color}
						renderPart="label"
						counterRotation={-rotationDeg}
						onmouseenter={part ? (e) => handlePartMouseEnter(e, part) : undefined}
						onmouseleave={handleMouseLeave}
						onclick={part ? () => handlePartClick(part) : undefined}
					/>
				{/each}
				{#each allLabels.cutSite as lbl (lbl.text + lbl.anchorX + '-lbl')}
					{@const rl = lbl as any}
					{@const cluster = cutSiteClusters[rl.index]}
					<PlasmidLabel
						name={lbl.text}
						x={lbl.x}
						y={lbl.y}
						anchorX={lbl.anchorX}
						anchorY={lbl.anchorY}
						{cx}
						{cy}
						labelRadius={labelRadius}
						color={rl.color}
						renderPart="label"
						counterRotation={-rotationDeg}
						bold={rl.bold ?? false}
						onmouseenter={(e) => handleClusterMouseEnter(e, cluster)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleClusterClick(cluster)}
					/>
				{/each}
			{/if}

		</g>

			<!-- Center text: plasmid name and size (outside rotation group) -->
			<text
				x={cx}
				y={cy - 10}
				text-anchor="middle"
				dominant-baseline="central"
				class="center-name"
			>
				{name}
			</text>
			<text
				x={cx}
				y={cy + 12}
				text-anchor="middle"
				dominant-baseline="central"
				class="center-size"
			>
				{sizeLabel} bp
			</text>
			</svg>
	</div>

<style>
	.plasmid-viewer {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
		overflow: visible;
	}

	.center-name {
		font-size: 16px;
		font-weight: 700;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.center-size {
		font-size: 12px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

</style>
