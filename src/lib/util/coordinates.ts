/** Coordinate math for circular and linear sequence rendering */

import { IntervalTree } from './interval-tree.js';

const TWO_PI = 2 * Math.PI;

/** Label position for relaxation */
export interface LabelPosition {
	x: number;
	y: number;
	angle: number;
	text: string;
	anchorX: number;
	anchorY: number;
}

/**
 * Convert a base-pair position to an angle on a circular map.
 * 0 bp = 12 o'clock (top), clockwise.
 */
export function bpToAngle(bp: number, totalSize: number): number {
	return (bp / totalSize) * TWO_PI - Math.PI / 2;
}

/**
 * Convert an angle to x,y coordinates on a circle.
 */
export function angleToXY(angle: number, radius: number, cx: number, cy: number): { x: number; y: number } {
	return {
		x: cx + radius * Math.cos(angle),
		y: cy + radius * Math.sin(angle),
	};
}

/**
 * Convert a bp position to x,y on a circular map.
 */
export function bpToXY(bp: number, totalSize: number, radius: number, cx: number, cy: number): { x: number; y: number } {
	const angle = bpToAngle(bp, totalSize);
	return angleToXY(angle, radius, cx, cy);
}

/**
 * Generate an SVG arc path for a feature/annotation on a circular map.
 * Returns a path `d` string for an arc from startBp to endBp.
 */
export function arcPath(
	startBp: number,
	endBp: number,
	totalSize: number,
	radius: number,
	cx: number,
	cy: number,
	width: number = 14,
): string {
	const innerR = radius - width / 2;
	const outerR = radius + width / 2;

	let arcLength = endBp - startBp;
	if (arcLength < 0) arcLength += totalSize;

	const startAngle = bpToAngle(startBp, totalSize);
	const endAngle = bpToAngle(endBp, totalSize);

	const largeArc = arcLength / totalSize > 0.5 ? 1 : 0;

	const outerStart = angleToXY(startAngle, outerR, cx, cy);
	const outerEnd = angleToXY(endAngle, outerR, cx, cy);
	const innerStart = angleToXY(startAngle, innerR, cx, cy);
	const innerEnd = angleToXY(endAngle, innerR, cx, cy);

	return [
		`M ${outerStart.x} ${outerStart.y}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
		`L ${innerEnd.x} ${innerEnd.y}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
		'Z',
	].join(' ');
}

/**
 * Generate an SVG arc path with an arrowhead for directional features.
 * The arrow points in the direction of the strand.
 */
export function arrowArcPath(
	startBp: number,
	endBp: number,
	totalSize: number,
	radius: number,
	cx: number,
	cy: number,
	strand: 1 | -1,
	width: number = 14,
	arrowLength: number = 8,
): string {
	const innerR = radius - width / 2;
	const outerR = radius + width / 2;

	let arcLength = endBp - startBp;
	if (arcLength < 0) arcLength += totalSize;

	// Arrow tip takes up a portion of the arc
	const arrowBpLength = (arrowLength / (TWO_PI * radius)) * totalSize;
	const bodyEnd = strand === 1
		? ((endBp - arrowBpLength + totalSize) % totalSize)
		: ((startBp + arrowBpLength) % totalSize);

	if (arcLength <= arrowBpLength * 2) {
		// Too small for arrow, just draw a simple arc
		return arcPath(startBp, endBp, totalSize, radius, cx, cy, width);
	}

	if (strand === 1) {
		// Arrow points clockwise (toward endBp)
		const bodyStartAngle = bpToAngle(startBp, totalSize);
		const bodyEndAngle = bpToAngle(bodyEnd, totalSize);
		const tipAngle = bpToAngle(endBp, totalSize);
		const bodyLargeArc = ((bodyEnd - startBp + totalSize) % totalSize) / totalSize > 0.5 ? 1 : 0;

		const oS = angleToXY(bodyStartAngle, outerR, cx, cy);
		const oE = angleToXY(bodyEndAngle, outerR, cx, cy);
		const iS = angleToXY(bodyStartAngle, innerR, cx, cy);
		const iE = angleToXY(bodyEndAngle, innerR, cx, cy);
		const tip = angleToXY(tipAngle, radius, cx, cy);
		const arrowOuter = angleToXY(bodyEndAngle, outerR + 4, cx, cy);
		const arrowInner = angleToXY(bodyEndAngle, innerR - 4, cx, cy);

		return [
			`M ${oS.x} ${oS.y}`,
			`A ${outerR} ${outerR} 0 ${bodyLargeArc} 1 ${oE.x} ${oE.y}`,
			`L ${arrowOuter.x} ${arrowOuter.y}`,
			`L ${tip.x} ${tip.y}`,
			`L ${arrowInner.x} ${arrowInner.y}`,
			`L ${iE.x} ${iE.y}`,
			`A ${innerR} ${innerR} 0 ${bodyLargeArc} 0 ${iS.x} ${iS.y}`,
			'Z',
		].join(' ');
	} else {
		// Arrow points counter-clockwise (toward startBp)
		const bodyStartAngle = bpToAngle(bodyEnd, totalSize);
		const bodyEndAngle = bpToAngle(endBp, totalSize);
		const tipAngle = bpToAngle(startBp, totalSize);
		const bodyLargeArc = ((endBp - bodyEnd + totalSize) % totalSize) / totalSize > 0.5 ? 1 : 0;

		const oS = angleToXY(bodyStartAngle, outerR, cx, cy);
		const oE = angleToXY(bodyEndAngle, outerR, cx, cy);
		const iS = angleToXY(bodyStartAngle, innerR, cx, cy);
		const iE = angleToXY(bodyEndAngle, innerR, cx, cy);
		const tip = angleToXY(tipAngle, radius, cx, cy);
		const arrowOuter = angleToXY(bodyStartAngle, outerR + 4, cx, cy);
		const arrowInner = angleToXY(bodyStartAngle, innerR - 4, cx, cy);

		return [
			`M ${oS.x} ${oS.y}`,
			`A ${outerR} ${outerR} 0 ${bodyLargeArc} 1 ${oE.x} ${oE.y}`,
			`L ${iE.x} ${iE.y}`,
			`A ${innerR} ${innerR} 0 ${bodyLargeArc} 0 ${iS.x} ${iS.y}`,
			`L ${arrowInner.x} ${arrowInner.y}`,
			`L ${tip.x} ${tip.y}`,
			`L ${arrowOuter.x} ${arrowOuter.y}`,
			'Z',
		].join(' ');
	}
}

/**
 * Generate tick mark positions for a circular map.
 */
export function generateTicks(
	totalSize: number,
	majorInterval?: number,
	minorInterval?: number,
): { position: number; major: boolean; label: string }[] {
	if (!majorInterval) {
		// Auto-calculate based on size
		if (totalSize <= 1000) majorInterval = 100;
		else if (totalSize <= 5000) majorInterval = 500;
		else if (totalSize <= 20000) majorInterval = 2000;
		else if (totalSize <= 50000) majorInterval = 5000;
		else majorInterval = 10000;
	}

	if (!minorInterval) {
		minorInterval = majorInterval / 5;
	}

	const ticks: { position: number; major: boolean; label: string }[] = [];
	for (let pos = 0; pos < totalSize; pos += minorInterval) {
		const isMajor = pos % majorInterval === 0;
		ticks.push({
			position: pos,
			major: isMajor,
			label: isMajor ? formatBp(pos) : '',
		});
	}
	return ticks;
}

/** Format a bp value for display (e.g., 2500 -> "2.5 kb") */
export function formatBp(bp: number): string {
	if (bp === 0) return '0';
	if (bp >= 1000000) return `${(bp / 1000000).toFixed(1)} Mb`;
	if (bp >= 1000) return `${(bp / 1000).toFixed(bp % 1000 === 0 ? 0 : 1)} kb`;
	return `${bp}`;
}

/**
 * Calculate the midpoint of an arc (for label placement).
 */
export function arcMidpoint(
	startBp: number,
	endBp: number,
	totalSize: number,
	radius: number,
	cx: number,
	cy: number,
): { x: number; y: number; angle: number } {
	let midBp: number;
	if (endBp >= startBp) {
		midBp = (startBp + endBp) / 2;
	} else {
		// Wraps origin
		const arcLen = endBp + totalSize - startBp;
		midBp = (startBp + arcLen / 2) % totalSize;
	}
	const angle = bpToAngle(midBp, totalSize);
	const pos = angleToXY(angle, radius, cx, cy);
	return { ...pos, angle };
}

/**
 * Generate a directed arc path with constant-width body and a clean triangular arrowhead.
 * Body arcs at full outerR/innerR the entire length — only the arrowhead tip pinches to center.
 */
export function drawDirectedArc(
	startBp: number,
	endBp: number,
	totalSize: number,
	innerR: number,
	outerR: number,
	cx: number,
	cy: number,
	strand: 1 | -1,
	arrowAngle: number = 0.06,
): string {
	let arcLength = endBp - startBp;
	if (arcLength < 0) arcLength += totalSize;

	const midR = (innerR + outerR) / 2;

	const startAngle = bpToAngle(startBp, totalSize);
	const endAngle = bpToAngle(endBp, totalSize);

	// If arc is too small, draw simple filled arc
	const arcFraction = arcLength / totalSize;
	if (arcFraction < 0.01) {
		return arcPath(startBp, endBp, totalSize, midR, cx, cy, outerR - innerR);
	}

	// Clamp arrow angle to at most 40% of the arc span so small features don't invert
	const arcAngle = arcFraction * TWO_PI;
	const effectiveArrow = Math.min(arrowAngle, arcAngle * 0.4);

	if (strand === 1) {
		// Arrow tip at endBp — body runs full width from start to arrowhead junction
		const bodyEndAngle = endAngle - effectiveArrow;
		const bodyLargeArc = ((bodyEndAngle - startAngle + TWO_PI) % TWO_PI) / TWO_PI > 0.5 ? 1 : 0;

		const oS = angleToXY(startAngle, outerR, cx, cy);
		const oE = angleToXY(bodyEndAngle, outerR, cx, cy);
		const iS = angleToXY(startAngle, innerR, cx, cy);
		const iE = angleToXY(bodyEndAngle, innerR, cx, cy);
		const tip = angleToXY(endAngle, midR, cx, cy);

		return [
			`M ${oS.x} ${oS.y}`,
			`A ${outerR} ${outerR} 0 ${bodyLargeArc} 1 ${oE.x} ${oE.y}`,
			`L ${tip.x} ${tip.y}`,
			`L ${iE.x} ${iE.y}`,
			`A ${innerR} ${innerR} 0 ${bodyLargeArc} 0 ${iS.x} ${iS.y}`,
			'Z',
		].join(' ');
	} else {
		// Arrow tip at startBp — body runs full width from arrowhead junction to end
		const bodyStartAngle = startAngle + effectiveArrow;
		const bodyLargeArc = ((endAngle - bodyStartAngle + TWO_PI) % TWO_PI) / TWO_PI > 0.5 ? 1 : 0;

		const oS = angleToXY(bodyStartAngle, outerR, cx, cy);
		const oE = angleToXY(endAngle, outerR, cx, cy);
		const iS = angleToXY(bodyStartAngle, innerR, cx, cy);
		const iE = angleToXY(endAngle, innerR, cx, cy);
		const tip = angleToXY(startAngle, midR, cx, cy);

		return [
			`M ${oS.x} ${oS.y}`,
			`A ${outerR} ${outerR} 0 ${bodyLargeArc} 1 ${oE.x} ${oE.y}`,
			`L ${iE.x} ${iE.y}`,
			`A ${innerR} ${innerR} 0 ${bodyLargeArc} 0 ${iS.x} ${iS.y}`,
			`L ${tip.x} ${tip.y}`,
			'Z',
		].join(' ');
	}
}

/**
 * Compute annotation layer assignments using IntervalTree.
 * Returns a Map from interval index to layer (0-based).
 */
export function computeAnnotationLayers(
	intervals: { start: number; end: number }[],
	spaceBefore = 0,
	spaceAfter = 0,
): Map<number, number> {
	return IntervalTree.computeLayers(intervals, spaceBefore, spaceAfter);
}

/**
 * Compute annotation layers for circular sequences (handles wrapping).
 */
export function computeCircularAnnotationLayers(
	intervals: { start: number; end: number }[],
	totalSize: number,
	spaceBefore = 0,
	spaceAfter = 0,
): Map<number, number> {
	return IntervalTree.computeCircularLayers(intervals, totalSize, spaceBefore, spaceAfter);
}

/**
 * Relax label positions to avoid overlaps.
 * Uses force-directed relaxation with decay over multiple passes.
 * Considers approximate text width for better collision detection.
 */
export function relaxLabels(
	labels: LabelPosition[],
	maxRadius: number,
	spacing: number = 18,
): LabelPosition[] {
	if (labels.length === 0) return [];

	// Sort by angle
	const sorted = [...labels].sort((a, b) => a.angle - b.angle);

	const PASSES = 20;
	for (let pass = 0; pass < PASSES; pass++) {
		const decay = 1 - pass / PASSES; // force decays over iterations
		for (let i = 0; i < sorted.length; i++) {
			for (let j = i + 1; j < sorted.length; j++) {
				const dy = sorted[j].y - sorted[i].y;
				const dx = sorted[j].x - sorted[i].x;
				// Approximate text width: ~6px per character
				const widthI = sorted[i].text.length * 6;
				const widthJ = sorted[j].text.length * 6;
				const minDx = (widthI + widthJ) / 2 + 4;
				const minDy = spacing;
				// Check overlap using both dimensions
				const overlapX = Math.abs(dx) < minDx;
				const overlapY = Math.abs(dy) < minDy;
				if (overlapX && overlapY) {
					const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
					const push = (spacing - Math.abs(dy)) / 2 * decay;
					const angle = Math.atan2(dy || 0.1, dx || 0.1);
					sorted[j].x += Math.cos(angle) * push;
					sorted[j].y += Math.sin(angle) * push;
					sorted[i].x -= Math.cos(angle) * push;
					sorted[i].y -= Math.sin(angle) * push;
				}
			}
		}
	}

	return sorted;
}
