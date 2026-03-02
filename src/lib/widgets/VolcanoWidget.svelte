<script lang="ts">
	import type { DataPoint, Thresholds } from '../types/index.js';
	import { VolcanoPlot } from '../components/charts/index.js';

	interface Props {
		data: { points: DataPoint[]; thresholds?: Thresholds };
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 400 }: Props = $props();
</script>

<VolcanoPlot
	points={data.points}
	thresholds={data.thresholds}
	{width}
	{height}
/>
