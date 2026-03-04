<script lang="ts">
	interface Props {
		name: string;
		/** Relaxed label X position */
		x: number;
		/** Relaxed label Y position */
		y: number;
		/** Anchor point X (on the arc/feature/site) */
		anchorX: number;
		/** Anchor point Y */
		anchorY: number;
		/** Center X of the plasmid */
		cx: number;
		/** Center Y of the plasmid */
		cy: number;
		/** Radius at which labels sit (for elbow connector midpoint) */
		labelRadius?: number;
		/** Color for the label text */
		color?: string;
		/** Which part to render: connector line only, label (dot+text) only, or all */
		renderPart?: 'connector' | 'label' | 'all';
		/** Counter-rotation in degrees to keep labels upright during map rotation */
		counterRotation?: number;
		/** Mouse enter callback */
		onmouseenter?: (e: MouseEvent) => void;
		/** Mouse leave callback */
		onmouseleave?: (e: MouseEvent) => void;
		/** Click callback */
		onclick?: (e: MouseEvent) => void;
	}

	let { name, x, y, anchorX, anchorY, cx, cy, labelRadius = 100, color, renderPart = 'all', counterRotation = 0, onmouseenter, onmouseleave, onclick }: Props = $props();

	/** Text anchor: right-aligned for left-side labels, left-aligned for right-side */
	let isLeftSide = $derived(x < cx);
	let textAnchor = $derived(isLeftSide ? 'end' : 'start');

	/** Max elbow bend angle (radians). Above this threshold, use a straight line. */
	const MAX_ELBOW_ANGLE = Math.PI / 4; // 45 degrees

	/**
	 * Connector line: elbow (anchor → radial midpoint → label) when the bend is gentle,
	 * straight line (anchor → label) when the angle between the two segments is too sharp.
	 */
	let connectorPoints = $derived.by(() => {
		const dx = anchorX - cx;
		const dy = anchorY - cy;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		const midR = labelRadius + 8;
		const midX = cx + (dx / dist) * midR;
		const midY = cy + (dy / dist) * midR;

		// Compute the angle of the bend at the elbow midpoint
		// Vector from anchor to mid
		const v1x = midX - anchorX;
		const v1y = midY - anchorY;
		// Vector from mid to label
		const v2x = x - midX;
		const v2y = y - midY;
		const dot = v1x * v2x + v1y * v2y;
		const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
		const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
		const cosAngle = dot / (mag1 * mag2);
		// Bend angle: 0 = straight, PI = full reversal
		const bendAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

		// If the bend is too sharp (> threshold), draw a straight line
		if (bendAngle > MAX_ELBOW_ANGLE) {
			return `${anchorX},${anchorY} ${x},${y}`;
		}
		return `${anchorX},${anchorY} ${midX},${midY} ${x},${y}`;
	});
</script>

{#if renderPart === 'connector' || renderPart === 'all'}
	<!-- Elbow-style polyline connector from anchor to label -->
	<polyline
		points={connectorPoints}
		stroke="var(--hatch-label-connector, #4a5568)"
		stroke-width="0.7"
		stroke-opacity="0.35"
		fill="none"
		class="label-connector"
	/>
{/if}

{#if renderPart === 'label' || renderPart === 'all'}
	<!-- Counter-rotate group to keep labels upright during map rotation -->
	<g
		transform="rotate({counterRotation}, {x}, {y})"
		class="plasmid-label-group"
		onmouseover={onmouseenter}
		onmouseout={(e) => { if (e.currentTarget?.contains(e.relatedTarget as Node)) return; onmouseleave?.(e); }}
		onclick={onclick}
	>
		<text
			{x}
			{y}
			text-anchor={textAnchor}
			dominant-baseline="central"
			fill={color ?? 'var(--hatch-text, #d4dce6)'}
			class="plasmid-label"
		>
			{name}
		</text>
	</g>
{/if}

<style>
	.plasmid-label-group {
		cursor: pointer;
	}

	.plasmid-label {
		font-size: 10px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.plasmid-label-group:hover .plasmid-label {
		font-weight: 700;
	}

	.label-connector {
		pointer-events: none;
	}
</style>
