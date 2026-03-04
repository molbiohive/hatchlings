<script lang="ts">
	import type { Part, CutSite } from '../../types/index.js';
	import type { SelectionState } from '../../state/index.js';
	import { formatBp, computeAnnotationLayers, arcMidpoint, bpToXY, bpToAngle, relaxLabels } from '../../util/coordinates.js';
	import type { LabelPosition } from '../../util/coordinates.js';
	import { getFeatureColor } from '../../util/colors.js';
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
	const CUTSITE_SPACE = 8;
	const LABEL_PADDING = 16;

	/** Compute part stacking offsets */
	let partOffsets = $derived.by(() => {
		const intervals = parts.map(p => ({ start: p.start, end: p.end }));
		return computeAnnotationLayers(intervals);
	});

	/** Max stacking depth for parts */
	let maxPartLayer = $derived.by(() => {
		let max = 0;
		for (const v of partOffsets.values()) {
			if (v > max) max = v;
		}
		return max;
	});

	/** Cumulative radii: backbone → cut sites → parts → labels */
	let partRadius = $derived(baseRadius + CUTSITE_SPACE + (cutSites.length > 0 ? 4 : 0));
	let labelRadius = $derived(
		partRadius + (maxPartLayer + 1) * (PART_WIDTH + PART_GAP) + 12
	);

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
	 * Unified label positions: parts + cut sites
	 * all go through one relaxation pass so they don't overlap each other.
	 */
	let allLabels = $derived.by(() => {
		if (!showLabels) return { part: [], cutSite: [] };

		type RawLabel = LabelPosition & {
			kind: 'part' | 'cutSite';
			color: string;
			index: number;
		};

		const raw: RawLabel[] = [];

		// Part labels
		for (let i = 0; i < parts.length; i++) {
			const p = parts[i];
			const yOff = partOffsets.get(i) ?? 0;
			const effectiveR = partRadius + yOff * (PART_WIDTH + PART_GAP);
			const mid = arcMidpoint(p.start, p.end, size, effectiveR, cx, cy);
			const dx = mid.x - cx;
			const dy = mid.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const pushR = labelRadius + LABEL_PADDING;
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle: mid.angle,
				text: p.label ?? p.name,
				anchorX: mid.x,
				anchorY: mid.y,
				kind: 'part',
				color: getFeatureColor(p.type, p.color),
				index: i,
			});
		}

		// Cut site labels
		for (let i = 0; i < cutSites.length; i++) {
			const cs = cutSites[i];
			const pt = bpToXY(cs.position, size, baseRadius, cx, cy);
			const dx = pt.x - cx;
			const dy = pt.y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const pushR = labelRadius + LABEL_PADDING;
			const angle = Math.atan2(dy, dx);
			raw.push({
				x: cx + (dx / dist) * pushR,
				y: cy + (dy / dist) * pushR,
				angle,
				text: cs.enzyme,
				anchorX: pt.x,
				anchorY: pt.y,
				kind: 'cutSite',
				color: '#d45858',
				index: i,
			});
		}

		// Run one unified relaxation pass
		const relaxed = relaxLabels(raw, labelRadius + 60, 18);

		// Clamp labels to viewport bounds
		const PAD = 8;
		for (const label of relaxed) {
			label.y = Math.max(PAD, Math.min(height - PAD, label.y));
			const textWidth = label.text.length * 6;
			const isLeft = label.x < cx;
			if (isLeft) {
				if (label.x - textWidth < PAD) label.x = PAD + textWidth;
			} else {
				if (label.x + textWidth > width - PAD) label.x = width - PAD - textWidth;
			}
		}

		// Split back into categories
		const partLabels: typeof relaxed = [];
		const cutSiteLabels: typeof relaxed = [];

		for (const label of relaxed) {
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
					radius={baseRadius}
					{cx}
					{cy}
					width={partRadius - baseRadius + PART_WIDTH + 10}
				/>
			{/if}

			<!-- Layer 3: Backbone ring with tick marks -->
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

			<!-- Layer 5: Part arcs (outer ring with stacking) -->
			{#each parts as part, i (part.name + part.start)}
				<PartArc
					{part}
					totalSize={size}
					radius={partRadius}
					{cx}
					{cy}
					yOffset={partOffsets.get(i) ?? 0}
					showInternalLabel={showInternalLabels}
					selected={selectedPart === part}
					onmouseenter={(e) => handlePartMouseEnter(e, part)}
					onmouseleave={handleMouseLeave}
					onclick={() => handlePartClick(part)}
				/>
			{/each}

			<!-- Layer 6: Label dots + text (on top of everything) -->
			{#if showLabels}
				{#each allLabels.part as lbl (lbl.text + lbl.anchorX + '-lbl')}
					{@const rl = lbl as any}
					{@const part = parts[rl.index]}
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
						onmouseenter={(e) => handlePartMouseEnter(e, part)}
						onmouseleave={handleMouseLeave}
						onclick={() => handlePartClick(part)}
					/>
				{/each}
				{#each allLabels.cutSite as lbl (lbl.text + lbl.anchorX + '-lbl')}
					{@const rl = lbl as any}
					{@const cs = cutSites[rl.index]}
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
						onmouseenter={(e) => handleCutSiteMouseEnter(e, cs)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleCutSiteClick(cs)}
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
		border-radius: 8px;
		overflow: hidden;
	}

	.center-name {
		font-size: 16px;
		font-weight: 700;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.center-size {
		font-size: 12px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

</style>
