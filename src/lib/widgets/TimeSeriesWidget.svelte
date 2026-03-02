<script lang="ts">
	import type { TimeSeriesData } from '../types/index.js';
	import { TimeSeriesPlot } from '../components/charts/index.js';

	interface Props {
		data: TimeSeriesData;
		width?: number;
		height?: number;
	}

	let { data, width = 600, height = 350 }: Props = $props();
</script>

<TimeSeriesPlot
	series={data.series}
	events={data.events}
	xLabel={data.xLabel}
	{width}
	{height}
/>
