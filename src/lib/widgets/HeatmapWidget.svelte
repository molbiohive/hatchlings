<script lang="ts">
	import type { HeatmapData } from '../types/index.js';
	import { HeatmapViewer } from '../components/charts/index.js';

	interface Props {
		data: HeatmapData;
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 400 }: Props = $props();
</script>

<HeatmapViewer
	rows={data.rows}
	cols={data.cols}
	values={data.values}
	colorScale={data.colorScale}
	{width}
	{height}
/>
