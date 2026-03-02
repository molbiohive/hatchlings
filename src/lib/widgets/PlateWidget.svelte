<script lang="ts">
	import type { PlateData } from '../types/index.js';
	import { PlateHeatmap } from '../components/charts/index.js';

	interface Props {
		data: PlateData;
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 350 }: Props = $props();
</script>

<PlateHeatmap
	format={data.format}
	wells={data.wells}
	zFactor={data.zFactor}
	title={data.title}
	{width}
	{height}
/>
