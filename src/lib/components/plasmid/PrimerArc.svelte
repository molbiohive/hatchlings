<script lang="ts">
	import type { Primer } from '../../types/index.js';
	import { bpToAngle, angleToXY } from '../../util/coordinates.js';

	interface Props {
		primer: Primer;
		totalSize: number;
		radius: number;
		cx: number;
		cy: number;
	}

	let { primer, totalSize, radius, cx, cy }: Props = $props();

	let color = $derived(primer.color ?? '#bcbd22');

	let startAngle = $derived(bpToAngle(primer.start, totalSize));
	let endAngle = $derived(bpToAngle(primer.end, totalSize));

	let startPt = $derived(angleToXY(startAngle, radius, cx, cy));
	let endPt = $derived(angleToXY(endAngle, radius, cx, cy));

	let arcLength = $derived.by(() => {
		let len = primer.end - primer.start;
		if (len < 0) len += totalSize;
		return len;
	});

	let largeArc = $derived(arcLength / totalSize > 0.5 ? 1 : 0);

	let pathD = $derived(
		`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`
	);

	/** Small arrowhead at the appropriate end based on strand */
	let arrowTip = $derived.by(() => {
		const tipAngle = primer.strand === 1 ? endAngle : startAngle;
		const arrowAngleOffset = primer.strand === 1 ? -0.04 : 0.04;
		const basePt = angleToXY(tipAngle, radius, cx, cy);
		const outerPt = angleToXY(tipAngle + arrowAngleOffset, radius + 4, cx, cy);
		const innerPt = angleToXY(tipAngle + arrowAngleOffset, radius - 4, cx, cy);
		return `M ${basePt.x} ${basePt.y} L ${outerPt.x} ${outerPt.y} M ${basePt.x} ${basePt.y} L ${innerPt.x} ${innerPt.y}`;
	});
</script>

<g class="primer-arc">
	<path
		d={pathD}
		fill="none"
		stroke={color}
		stroke-width="2"
		stroke-dasharray="4 3"
		stroke-linecap="round"
	/>
	<path
		d={arrowTip}
		fill="none"
		stroke={color}
		stroke-width="2"
		stroke-linecap="round"
	/>
</g>

<style>
	.primer-arc {
		opacity: 0.9;
	}

	.primer-arc:hover {
		opacity: 1;
	}
</style>
