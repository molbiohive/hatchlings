<script lang="ts">
	import type { SelectionState } from '../../state/index.js';
	import { bpToAngle, angleToXY, arcPath } from '../../util/coordinates.js';

	interface Props {
		selection: SelectionState;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
		width?: number;
	}

	let { selection, totalSize, radius, cx, cy, width = 30 }: Props = $props();

	/** Selection arc path */
	let selectionArcPath = $derived.by(() => {
		const range = selection.range;
		if (!range) return '';
		return arcPath(range.start, range.end, totalSize, radius, cx, cy, width);
	});

	/** Caret line (thin radial line) */
	let caretLine = $derived.by(() => {
		const inner = angleToXY(
			bpToAngle(selection.caretPosition, totalSize),
			radius - width / 2 - 4,
			cx,
			cy,
		);
		const outer = angleToXY(
			bpToAngle(selection.caretPosition, totalSize),
			radius + width / 2 + 4,
			cx,
			cy,
		);
		return { inner, outer };
	});

	/** Grab handles at selection boundaries */
	let handleStart = $derived.by(() => {
		const range = selection.range;
		if (!range) return null;
		return angleToXY(bpToAngle(range.start, totalSize), radius, cx, cy);
	});

	let handleEnd = $derived.by(() => {
		const range = selection.range;
		if (!range) return null;
		return angleToXY(bpToAngle(range.end, totalSize), radius, cx, cy);
	});
</script>

<g class="circular-selection">
	<!-- Selection arc overlay -->
	{#if selectionArcPath}
		<path
			d={selectionArcPath}
			fill="var(--hatch-selection-fill, rgba(0, 130, 250, 0.3))"
			stroke="var(--hatch-selection-stroke, rgba(0, 130, 250, 0.6))"
			stroke-width="0.5"
			pointer-events="none"
		/>
	{/if}

	<!-- Caret line -->
	<line
		x1={caretLine.inner.x}
		y1={caretLine.inner.y}
		x2={caretLine.outer.x}
		y2={caretLine.outer.y}
		stroke="var(--hatch-caret-color, #333)"
		stroke-width="1.5"
		pointer-events="none"
		class="caret-line"
	/>

	<!-- Grab handles -->
	{#if handleStart && handleEnd}
		<circle
			cx={handleStart.x}
			cy={handleStart.y}
			r="3.5"
			fill="var(--hatch-selection-handle, rgba(0, 130, 250, 0.8))"
			stroke="var(--hatch-selection-outline, #fff)"
			stroke-width="0.5"
			class="grab-handle"
		/>
		<circle
			cx={handleEnd.x}
			cy={handleEnd.y}
			r="3.5"
			fill="var(--hatch-selection-handle, rgba(0, 130, 250, 0.8))"
			stroke="var(--hatch-selection-outline, #fff)"
			stroke-width="0.5"
			class="grab-handle"
		/>
	{/if}
</g>

<style>
	.caret-line {
		opacity: 1;
	}

	.grab-handle {
		cursor: ew-resize;
	}
</style>
