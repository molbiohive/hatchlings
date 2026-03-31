<script lang="ts">
	import type { Part, CutSite, PlasmidData } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import { formatBp, bpToXY, bpToAngle, angleToXY, relaxLabels, TWO_PI, cutSiteEnd, buildPartHoverInfo, buildCutSiteHoverInfo, isPrimer } from '../../util/coordinates.js';
	import type { LabelPosition } from '../../util/coordinates.js';
	import { getFeatureColor, PRIMER_COLOR, CUT_SITE_COLOR } from '../../util/colors.js';
	import { PART_WIDTH, PART_GAP, CUTSITE_SPACE, SCALE_BAND } from '../../util/layout.js';
	import { LinearMap } from '../linear/index.js';
	import PlasmidRing from './PlasmidRing.svelte';
	import PartArc from './PartArc.svelte';
	import CutSiteMarker from './CutSiteMarker.svelte';
	import PlasmidLabel from './PlasmidLabel.svelte';
	import CircularSelection from './CircularSelection.svelte';
	import type { HoverInfo } from '../../types/utility.js';

	interface Props {
		data?: PlasmidData;
		name?: string;
		size?: number;
		parts?: Part[];
		cutSites?: CutSite[];
		selectionState?: SelectionState;
		width?: number;
		height?: number;
		showTicks?: boolean;
		showInternalLabels?: boolean;
		/** Sequence topology */
		topology?: 'circular' | 'linear';
		/** Maximum stacking layers for features/primers before collapsing (default 4) */
		maxLayers?: number;
		/** When false, disables all mouse/wheel/keyboard handlers, selection, and cut-site labels */
		interactive?: boolean;
		onselect?: (selection: { start: number; end: number }) => void;
		onselectionchange?: (selection: { start: number; end: number } | null) => void;
		oncaretmove?: (position: number) => void;
		onpartclick?: (part: Part) => void;
		oncopysequence?: (sequence: string) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		data,
		name: nameProp,
		size: sizeProp,
		parts: partsProp,
		cutSites: cutSitesProp,
		selectionState,
		width = 500,
		height = 500,
		showTicks = true,
		showInternalLabels = true,
		topology: topologyProp,
		maxLayers = 4,
		interactive = true,
		onselect,
		onselectionchange,
		oncaretmove,
		onpartclick,
		oncopysequence,
		onhoverinfo,
	}: Props = $props();

	const name = $derived(nameProp ?? data?.name ?? '');
	const size = $derived(sizeProp ?? data?.size ?? 0);
	const parts = $derived(partsProp ?? data?.parts ?? []);
	const cutSites = $derived(cutSitesProp ?? data?.cutSites ?? []);
	const topology = $derived(topologyProp ?? data?.topology ?? 'circular');

	let svgElement: SVGSVGElement | undefined = $state(undefined);

	let cx = $derived(width / 2);
	let cy = $derived(height / 2);

	let baseRadius = $derived(Math.min(width, height) * 0.36);

	// --- Layer computation ---

	/** Split parts into features and primers (kept for selectionInfo / center hover) */
	let features = $derived(parts.filter(p => !isPrimer(p)));
	let primers = $derived(parts.filter(p => isPrimer(p)));

	/** Combined per-strand arrays — each entry carries its index in `parts` */
	let forwardAll = $derived(
		parts.map((p, i) => ({ part: p, idx: i, kind: isPrimer(p) ? 'primer' as const : 'feature' as const }))
			.filter(x => x.part.strand !== -1)
	);
	let reverseAll = $derived(
		parts.map((p, i) => ({ part: p, idx: i, kind: isPrimer(p) ? 'primer' as const : 'feature' as const }))
			.filter(x => x.part.strand === -1)
	);

	/** Check if an interval overlaps any interval in a layer (circular-aware) */
	function overlapsAnyInLayer(
		interval: { start: number; end: number },
		layer: { start: number; end: number }[],
	): boolean {
		for (const other of layer) {
			if (rangesOverlap(interval.start, interval.end, other.start, other.end)) return true;
		}
		return false;
	}

	/**
	 * Two-phase layer assignment: features first (longest innermost), then primers (prefer outer layers).
	 * Returns Map<idx, layer> where idx is the index into `parts`.
	 */
	function assignCombinedLayers(
		featureIntervals: { start: number; end: number; idx: number }[],
		primerIntervals: { start: number; end: number; idx: number }[],
	): Map<number, number> {
		const result = new Map<number, number>();
		const layerOccupied: { start: number; end: number }[][] = [];

		// Phase 1: Features — sorted by length DESC (longest -> layer 0)
		const sortedFeatures = [...featureIntervals].sort((a, b) => {
			const lenA = ((a.end - a.start) % size + size) % size;
			const lenB = ((b.end - b.start) % size + size) % size;
			return lenB - lenA;
		});
		for (const feat of sortedFeatures) {
			let assigned = -1;
			for (let layer = 0; layer < layerOccupied.length; layer++) {
				if (!overlapsAnyInLayer(feat, layerOccupied[layer])) {
					assigned = layer;
					break;
				}
			}
			if (assigned === -1) {
				assigned = layerOccupied.length;
				layerOccupied.push([]);
			}
			layerOccupied[assigned].push(feat);
			result.set(feat.idx, assigned);
		}

		// Phase 2: Primers — prefer higher layers (on top), fall back to lower, or create new
		const sortedPrimers = [...primerIntervals].sort((a, b) => {
			const lenA = ((a.end - a.start) % size + size) % size;
			const lenB = ((b.end - b.start) % size + size) % size;
			return lenB - lenA;
		});
		for (const pmr of sortedPrimers) {
			let assigned = -1;
			for (let layer = 0; layer < layerOccupied.length; layer++) {
				if (!overlapsAnyInLayer(pmr, layerOccupied[layer])) {
					assigned = layer;
					break;
				}
			}
			if (assigned === -1) {
				assigned = layerOccupied.length;
				layerOccupied.push([]);
			}
			layerOccupied[assigned].push(pmr);
			result.set(pmr.idx, assigned);
		}

		return result;
	}

	/** Compute combined stacking layers for forward strand */
	let forwardOffsets = $derived.by(() => {
		const feats = forwardAll
			.filter(x => x.kind === 'feature')
			.map(x => ({ start: x.part.start, end: x.part.end, idx: x.idx }));
		const pmrs = forwardAll
			.filter(x => x.kind === 'primer')
			.map(x => ({ start: x.part.start, end: x.part.end, idx: x.idx }));
		return assignCombinedLayers(feats, pmrs);
	});

	/** Compute combined stacking layers for reverse strand */
	let reverseOffsets = $derived.by(() => {
		const feats = reverseAll
			.filter(x => x.kind === 'feature')
			.map(x => ({ start: x.part.start, end: x.part.end, idx: x.idx }));
		const pmrs = reverseAll
			.filter(x => x.kind === 'primer')
			.map(x => ({ start: x.part.start, end: x.part.end, idx: x.idx }));
		return assignCombinedLayers(feats, pmrs);
	});

	/** Max stacking depth per strand */
	let maxForwardLayer = $derived(
		forwardAll.reduce((max, x) => Math.max(max, forwardOffsets.get(x.idx) ?? 0), 0)
	);
	let maxReverseLayer = $derived(
		reverseAll.reduce((max, x) => Math.max(max, reverseOffsets.get(x.idx) ?? 0), 0)
	);

	/** Capped layer counts for radius calculations */
	let cappedMaxForwardLayer = $derived(Math.min(maxForwardLayer, maxLayers - 1));
	let cappedMaxReverseLayer = $derived(Math.min(maxReverseLayer, maxLayers - 1));

	/** Overflow counts */
	let overflowFeatureCount = $derived(
		[...forwardAll, ...reverseAll].filter(x => {
			if (x.kind !== 'feature') return false;
			const offsets = x.part.strand !== -1 ? forwardOffsets : reverseOffsets;
			return (offsets.get(x.idx) ?? 0) >= maxLayers;
		}).length
	);
	let overflowPrimerCount = $derived(
		[...forwardAll, ...reverseAll].filter(x => {
			if (x.kind !== 'primer') return false;
			const offsets = x.part.strand !== -1 ? forwardOffsets : reverseOffsets;
			return (offsets.get(x.idx) ?? 0) >= maxLayers;
		}).length
	);

	/** Find the end angle of the last feature on the outermost visible layer for overflow badge placement */
	let overflowFtrBadge = $derived.by((): { angle: number; effR: number } | null => {
		if (overflowFeatureCount === 0) return null;
		const topLayer = maxLayers - 1;
		let bestEnd = -1;
		let effR = 0;
		for (const item of forwardAll) {
			if (item.kind !== 'feature') continue;
			if ((forwardOffsets.get(item.idx) ?? 0) === topLayer) {
				if (item.part.end > bestEnd) {
					bestEnd = item.part.end;
					effR = forwardRadius + topLayer * (PART_WIDTH + PART_GAP);
				}
			}
		}
		for (const item of reverseAll) {
			if (item.kind !== 'feature') continue;
			if ((reverseOffsets.get(item.idx) ?? 0) === topLayer) {
				if (bestEnd === -1 || item.part.end > bestEnd) {
					bestEnd = item.part.end;
					effR = reverseRadius - topLayer * (PART_WIDTH + PART_GAP);
				}
			}
		}
		if (bestEnd === -1) return null;
		return { angle: bpToAngle(bestEnd, size), effR };
	});

	let overflowPmrBadge = $derived.by((): { angle: number; effR: number } | null => {
		if (overflowPrimerCount === 0) return null;
		const topLayer = maxLayers - 1;
		let bestEnd = -1;
		let effR = 0;
		for (const item of forwardAll) {
			if (item.kind !== 'primer') continue;
			if ((forwardOffsets.get(item.idx) ?? 0) === topLayer) {
				if (item.part.end > bestEnd) {
					bestEnd = item.part.end;
					effR = forwardRadius + topLayer * (PART_WIDTH + PART_GAP);
				}
			}
		}
		for (const item of reverseAll) {
			if (item.kind !== 'primer') continue;
			if ((reverseOffsets.get(item.idx) ?? 0) === topLayer) {
				if (bestEnd === -1 || item.part.end > bestEnd) {
					bestEnd = item.part.end;
					effR = reverseRadius - topLayer * (PART_WIDTH + PART_GAP);
				}
			}
		}
		if (bestEnd === -1) return null;
		return { angle: bpToAngle(bestEnd, size), effR };
	});

	/** Forward: just outside backbone + cut site space */
	let forwardRadius = $derived(
		baseRadius + CUTSITE_SPACE + (cutSites.length > 0 ? 4 : 0)
	);

	/** Reverse: just inside scale band */
	let reverseRadius = $derived(baseRadius - SCALE_BAND - 10);

	/** Outermost ring radius (for selection overlay width) */
	let outerRingRadius = $derived(
		forwardRadius + (forwardAll.length > 0
			? (cappedMaxForwardLayer + 1) * (PART_WIDTH + PART_GAP) : 0) + 12
	);

	/** Unified render info: parts index -> { radius, kind }.
	 *  Pre-computes effective radius using uniform step PART_WIDTH + PART_GAP.
	 *  Skips parts whose layer >= maxLayers (overflow). */
	let renderInfo = $derived.by(() => {
		const info = new Map<number, { radius: number; kind: 'feature' | 'primer' }>();
		for (const item of forwardAll) {
			const layer = forwardOffsets.get(item.idx) ?? 0;
			if (layer >= maxLayers) continue;
			info.set(item.idx, {
				radius: forwardRadius + layer * (PART_WIDTH + PART_GAP),
				kind: item.kind,
			});
		}
		for (const item of reverseAll) {
			const layer = reverseOffsets.get(item.idx) ?? 0;
			if (layer >= maxLayers) continue;
			info.set(item.idx, {
				radius: reverseRadius - layer * (PART_WIDTH + PART_GAP),
				kind: item.kind,
			});
		}
		return info;
	});

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

	/** Label radius (just beyond outermost ring, short arms) */
	const LABEL_PADDING = 6;
	let labelRadius = $derived(outerRingRadius);

	/** Cluster nearby cut sites into single labels */
	const CLUSTER_BP = 30;
	let cutSiteLabels = $derived.by(() => {
		if (cutSites.length === 0) return [] as (LabelPosition & { color: string; bold: boolean; cutSite: CutSite })[];

		// Cluster nearby sites
		const sorted = cutSites.map((cs, i) => ({ cs, i })).sort((a, b) => a.cs.position - b.cs.position);
		type Cluster = { primary: CutSite; enzymes: string[] };
		const clusters: Cluster[] = [];
		for (const entry of sorted) {
			const last = clusters[clusters.length - 1];
			if (last && entry.cs.position - last.primary.position <= CLUSTER_BP) {
				last.enzymes.push(entry.cs.enzyme);
			} else {
				clusters.push({ primary: entry.cs, enzymes: [entry.cs.enzyme] });
			}
		}

		// Build label positions — short arm outward from backbone
		const raw: (LabelPosition & { color: string; bold: boolean; cutSite: CutSite })[] = [];
		for (const cluster of clusters) {
			const pt = bpToXY(cluster.primary.position, size, baseRadius, cx, cy);
			const dx = pt.x - cx;
			const dy = pt.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			const pushR = labelRadius + LABEL_PADDING;
			const angle = Math.atan2(dy, dx);
			const text = cluster.enzymes.length === 1
				? cluster.primary.enzyme
				: `${cluster.primary.enzyme} +${cluster.enzymes.length - 1}`;
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle,
				text,
				anchorX: pt.x,
				anchorY: pt.y,
				color: CUT_SITE_COLOR,
				bold: cluster.enzymes.length === 1 && uniqueCutters.has(cluster.primary.enzyme),
				cutSite: cluster.primary,
			});
		}

		// Cap at 24, merge angular neighbors if too many
		const MAX_LABELS = 24;
		let capped = raw;
		if (raw.length > MAX_LABELS) {
			const byAngle = [...raw].sort((a, b) => a.angle - b.angle);
			const minGap = TWO_PI / MAX_LABELS;
			capped = [];
			let i = 0;
			while (i < byAngle.length) {
				const leader = { ...byAngle[i] };
				let count = 1;
				let j = i + 1;
				while (j < byAngle.length && byAngle[j].angle - leader.angle < minGap) { count++; j++; }
				if (count > 1) leader.text = `${leader.text} +${count - 1}`;
				capped.push(leader);
				i = j;
			}
		}

		const relaxed = relaxLabels(capped, labelRadius + 20, 16);

		return relaxed as typeof raw;
	});

	let selectedPart: Part | null = $state(null);

	// Rotation state for circular mode (Ctrl+drag)
	let rotationDeg = $state(0);
	let isRotating = $state(false);
	let rotateStartAngle = $state(0);
	let rotateStartRotation = $state(0);

	// Selection interaction state
	let isSelectDragging = $state(false);

	// --- Selection-based center annotations ---
	type SelectionEntry = { name: string; color: string; bold?: boolean };

	/** Check if two circular ranges overlap */
	function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
		// Normalize to length-based check for circular ranges
		function contains(rStart: number, rEnd: number, bp: number): boolean {
			if (rStart <= rEnd) return bp >= rStart && bp < rEnd;
			return bp >= rStart || bp < rEnd;
		}
		// Two ranges overlap if either contains part of the other
		if (contains(aStart, aEnd, bStart)) return true;
		if (contains(aStart, aEnd, bEnd > 0 ? bEnd - 1 : size - 1)) return true;
		if (contains(bStart, bEnd, aStart)) return true;
		return false;
	}

	/** Selection range + annotations within it */
	let selectionInfo = $derived.by((): {
		start: number; end: number; length: number;
		items: SelectionEntry[]; overflow: number;
	} | null => {
		if (!selectionState) return null;
		const range = selectionState.range;
		if (!range) return null;
		let len = range.end - range.start;
		if (len <= 0) len += size;

		const entries: SelectionEntry[] = [];
		for (const p of features) {
			if (rangesOverlap(range.start, range.end, p.start, p.end)) {
				entries.push({ name: p.label ?? p.name, color: getFeatureColor(p.type, p.color) });
			}
		}
		for (const p of primers) {
			if (rangesOverlap(range.start, range.end, p.start, p.end)) {
				entries.push({ name: p.label ?? p.name, color: PRIMER_COLOR });
			}
		}
		for (const cs of cutSites) {
			const csEnd = cs.end ?? cs.position + 1;
			if (rangesOverlap(range.start, range.end, cs.position, csEnd)) {
				entries.push({ name: cs.enzyme, color: CUT_SITE_COLOR, bold: uniqueCutters.has(cs.enzyme) });
			}
		}

		const MAX_SHOWN = 6;
		return {
			start: range.start,
			end: range.end,
			length: len,
			items: entries.slice(0, MAX_SHOWN),
			overflow: entries.length > MAX_SHOWN ? entries.length - MAX_SHOWN : 0,
		};
	});

	/** Convert mouse event to rotation-corrected angle in radians [0, 2π) */
	function mouseToAngle(e: MouseEvent): number {
		const rect = svgElement?.getBoundingClientRect();
		if (!rect) return 0;
		const mx = e.clientX - rect.left - cx;
		const my = e.clientY - rect.top - cy;
		let angle = Math.atan2(my, mx) + Math.PI / 2;
		angle -= (rotationDeg * Math.PI) / 180;
		return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
	}

	/** Convert mouse position to bp on the circular map */
	function mouseToBp(e: MouseEvent): number {
		return Math.round((mouseToAngle(e) / TWO_PI) * size) % size;
	}

	// Drag direction tracking for circular selection
	let lastDragAngle = 0;
	let cumulativeDragAngle = 0;

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
			lastDragAngle = mouseToAngle(e);
			cumulativeDragAngle = 0;
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
			const angle = mouseToAngle(e);
			// Compute shortest angular delta, handling the 0/2π wrap
			let delta = angle - lastDragAngle;
			if (delta > Math.PI) delta -= TWO_PI;
			if (delta < -Math.PI) delta += TWO_PI;
			cumulativeDragAngle += delta;
			lastDragAngle = angle;

			// Convert cumulative angle to bp offset from anchor
			const bpOffset = Math.round((cumulativeDragAngle / TWO_PI) * size);
			const anchor = selectionState.dragAnchor;

			if (bpOffset >= 0) {
				// Clockwise drag
				const end = ((anchor + bpOffset) % size + size) % size;
				selectionState.updateDragCircular(anchor, end);
			} else {
				// Counterclockwise drag
				const start = ((anchor + bpOffset) % size + size) % size;
				selectionState.updateDragCircular(start, anchor);
			}
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
		onhoverinfo?.(buildPartHoverInfo(part, e, size));
	}

	function handleCutSiteMouseEnter(e: MouseEvent, cutSite: CutSite) {
		onhoverinfo?.(buildCutSiteHoverInfo(cutSite, e));
	}

	function handleLabelClick(cutSite: CutSite) {
		const end = cutSiteEnd(cutSite);
		if (selectionState) {
			selectionState.setSelection(cutSite.position, end);
			onselect?.({ start: cutSite.position, end });
			onselectionchange?.({ start: cutSite.position, end });
		}
	}

	function handleMouseLeave() {
		onhoverinfo?.(null);
	}

	function handleCenterEnter(e: MouseEvent) {
		const pos = { x: e.clientX, y: e.clientY };

		// When selection is active, show the complete annotation table
		if (selectionInfo) {
			const allEntries: SelectionEntry[] = [];
			for (const p of features) {
				if (rangesOverlap(selectionInfo.start, selectionInfo.end, p.start, p.end)) {
					allEntries.push({ name: p.label ?? p.name, color: getFeatureColor(p.type, p.color) });
				}
			}
			for (const p of primers) {
				if (rangesOverlap(selectionInfo.start, selectionInfo.end, p.start, p.end)) {
					allEntries.push({ name: p.label ?? p.name, color: PRIMER_COLOR });
				}
			}
			for (const cs of cutSites) {
				const csEnd = cs.end ?? cs.position + 1;
				if (rangesOverlap(selectionInfo.start, selectionInfo.end, cs.position, csEnd)) {
					allEntries.push({ name: cs.enzyme, color: CUT_SITE_COLOR, bold: uniqueCutters.has(cs.enzyme) });
				}
			}
			const items = allEntries.map(e => ({ label: e.name, value: e.color === CUT_SITE_COLOR ? 'cut site' : 'feature' }));
			onhoverinfo?.({
				title: `${selectionInfo.start}..${selectionInfo.end} (${formatBp(selectionInfo.length)} bp)`,
				items,
				position: pos,
			});
			return;
		}

		// Default: construct summary
		const items: { label: string; value: string | number; unit?: string }[] = [
			{ label: 'Length', value: size, unit: 'bp' },
			{ label: 'Topology', value: topology },
		];
		if (parts.length > 0) items.push({ label: 'Features', value: parts.length });
		if (cutSites.length > 0) items.push({ label: 'Cut sites', value: cutSites.length });
		onhoverinfo?.({ title: name, items, position: pos });
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

	function handleCutSiteClick(cutSite: CutSite) {
		const end = cutSiteEnd(cutSite);
		if (selectionState) {
			selectionState.setSelection(cutSite.position, end);
			onselect?.({ start: cutSite.position, end });
			onselectionchange?.({ start: cutSite.position, end });
		}
	}

	let sizeLabel = $derived(formatBp(size));

	/** Truncate name to fit inside the inner circle */
	const CENTER_CHAR_PX = 9.5; // approximate px per char at 16px mono
	let displayName = $derived.by(() => {
		const maxWidth = (reverseRadius - 16) * 2; // diameter minus padding
		const maxChars = Math.floor(maxWidth / CENTER_CHAR_PX);
		if (name.length <= maxChars) return name;
		return name.slice(0, maxChars - 1) + '\u2026';
	});
</script>

{#if topology === 'linear'}
	<LinearMap {name} {size} {parts} {cutSites} {width} {selectionState}
		{showTicks} {showInternalLabels} {interactive}
		{onselect} {onselectionchange} {oncaretmove} {onpartclick}
		{oncopysequence} {onhoverinfo} />
{:else}
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
			onwheel={interactive ? handleWheel : undefined}
			onmousedown={interactive ? handleMouseDown : undefined}
			onmousemove={interactive ? handleMouseMove : undefined}
			onmouseup={interactive ? handleMouseUp : undefined}
			onmouseleave={interactive ? handleMouseLeave : undefined}
			style:cursor={!interactive ? 'default' : isRotating ? 'grabbing' : (selectionState ? 'crosshair' : 'grab')}
			style:outline="none"
		>
		<g transform="rotate({rotationDeg}, {cx}, {cy})">
			<!-- Layer 0: Cut site label connector lines (behind everything) -->
			{#if interactive}
				{#each cutSiteLabels as lbl (lbl.text + lbl.anchorX + '-conn')}
					<PlasmidLabel
						name={lbl.text}
						x={lbl.x}
						y={lbl.y}
						anchorX={lbl.anchorX}
						anchorY={lbl.anchorY}
						{cx}
						{cy}
						labelRadius={labelRadius}
						color={lbl.color}
						renderPart="connector"
						counterRotation={-rotationDeg}
					/>
				{/each}
			{/if}

			<!-- Layer 1: Selection overlay -->
			{#if interactive && selectionState}
				<CircularSelection
					selection={selectionState}
					totalSize={size}
					radius={baseRadius - SCALE_BAND - 4}
					{cx}
					{cy}
					width={outerRingRadius - baseRadius + SCALE_BAND + 12}
				/>
			{/if}

			<!-- Layer 2: Backbone ring with scale band -->
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

			<!-- Layer 5: Feature and primer arcs (unified stacking, skip overflow layers) -->
			{#each parts as part, i (part.name + part.start + '-' + i)}
				{#if renderInfo.has(i)}
					{@const ri = renderInfo.get(i)}
					<PartArc
						part={ri?.kind === 'primer' ? { ...part, bindingStart: undefined, bindingEnd: undefined, mismatches: undefined } : part}
						totalSize={size}
						radius={ri?.radius ?? forwardRadius}
						{cx}
						{cy}
						width={ri?.kind === 'primer' ? 7 : 14}
						showInternalLabel={showInternalLabels}
						rotation={rotationDeg}
						halfArrow={ri?.kind === 'primer'}
						overrideColor={ri?.kind === 'primer' ? PRIMER_COLOR : undefined}
						fillOpacity={ri?.kind === 'primer' ? 0.5 : 1.0}
						selected={selectedPart === part}
						onmouseenter={(e) => handlePartMouseEnter(e, part)}
						onmouseleave={handleMouseLeave}
						onclick={() => handlePartClick(part)}
					/>
				{/if}
			{/each}

			<!-- Layer 5c: Overflow indicators (arc-following text on the last visible layer) -->
			{#if overflowFtrBadge}
				{@const startAngle = overflowFtrBadge.angle + 0.04}
				{@const endAngle = startAngle + 0.35}
				{@const p1 = angleToXY(startAngle, overflowFtrBadge.effR, cx, cy)}
				{@const p2 = angleToXY(endAngle, overflowFtrBadge.effR, cx, cy)}
				<path id="overflow-ftr-arc" d="M {p1.x} {p1.y} A {overflowFtrBadge.effR} {overflowFtrBadge.effR} 0 0 1 {p2.x} {p2.y}" fill="none" stroke="none" />
				<text class="overflow-indicator">
					<textPath href="#overflow-ftr-arc" startOffset="50%" text-anchor="middle">+{overflowFeatureCount} ftr</textPath>
				</text>
			{/if}
			{#if overflowPmrBadge}
				{@const startAngle = overflowPmrBadge.angle + 0.04}
				{@const endAngle = startAngle + 0.35}
				{@const p1 = angleToXY(startAngle, overflowPmrBadge.effR, cx, cy)}
				{@const p2 = angleToXY(endAngle, overflowPmrBadge.effR, cx, cy)}
				<path id="overflow-pmr-arc" d="M {p1.x} {p1.y} A {overflowPmrBadge.effR} {overflowPmrBadge.effR} 0 0 1 {p2.x} {p2.y}" fill="none" stroke="none" />
				<text class="overflow-indicator">
					<textPath href="#overflow-pmr-arc" startOffset="50%" text-anchor="middle">+{overflowPrimerCount} pmr</textPath>
				</text>
			{/if}

			<!-- Layer 6: Cut site label text -->
			{#if interactive}
				{#each cutSiteLabels as lbl (lbl.text + lbl.anchorX + '-lbl')}
					<PlasmidLabel
						name={lbl.text}
						x={lbl.x}
						y={lbl.y}
						anchorX={lbl.anchorX}
						anchorY={lbl.anchorY}
						{cx}
						{cy}
						labelRadius={labelRadius}
						color={lbl.color}
						renderPart="label"
						counterRotation={-rotationDeg}
						bold={lbl.bold}
						onmouseenter={(e) => handleCutSiteMouseEnter(e, lbl.cutSite)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleLabelClick(lbl.cutSite)}
					/>
				{/each}
			{/if}

		</g>

			<!-- Center hit area for hover info -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				{cx} {cy}
				r={baseRadius * 0.325}
				fill="transparent"
				onmouseenter={handleCenterEnter}
				onmouseleave={handleMouseLeave}
				style="cursor:default;"
			/>

			<!-- Center text (outside rotation group) -->
			{#if interactive && selectionInfo}
				{@const totalLines = 2 + selectionInfo.items.length + (selectionInfo.overflow > 0 ? 1 : 0)}
				{@const startY = cy - ((totalLines - 1) * 13) / 2}
				<!-- Selection range header -->
				<text
					x={cx}
					y={startY}
					text-anchor="middle"
					dominant-baseline="central"
					class="center-range"
				>
					{selectionInfo.start}..{selectionInfo.end} ({formatBp(selectionInfo.length)} bp)
				</text>
				<!-- Annotation list -->
				{#each selectionInfo.items as entry, i (entry.name + i)}
					<circle
						cx={cx - 52}
						cy={startY + (i + 1) * 13}
						r="3"
						fill={entry.color}
					/>
					<text
						x={cx - 44}
						y={startY + (i + 1) * 13}
						dominant-baseline="central"
						class="center-annotation"
						font-weight={entry.bold ? 700 : 400}
					>
						{entry.name}
					</text>
				{/each}
				{#if selectionInfo.overflow > 0}
					<text
						x={cx}
						y={startY + (selectionInfo.items.length + 1) * 13}
						text-anchor="middle"
						dominant-baseline="central"
						class="center-overflow"
					>
						+{selectionInfo.overflow} more
					</text>
				{/if}
			{:else}
				<!-- Default: plasmid name + size -->
				<text
					x={cx}
					y={cy - 10}
					text-anchor="middle"
					dominant-baseline="central"
					class="center-name"
				>
					{displayName}
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
			{/if}
			</svg>
	</div>
{/if}

<style>
	.plasmid-viewer {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
		overflow: visible;
		position: relative;
		z-index: 1000;
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

	.center-range {
		font-size: 8px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.center-annotation {
		font-size: 9px;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.center-overflow {
		font-size: 8px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.overflow-indicator {
		font-size: 10px;
		fill: var(--hatch-text-muted, #8892a4);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		pointer-events: none;
		user-select: none;
	}

</style>
