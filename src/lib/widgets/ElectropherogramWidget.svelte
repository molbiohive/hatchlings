<script lang="ts">
	import type { ElectropherogramData } from '../types/index.js';
	import { ElectropherogramViewer } from '../components/charts/index.js';

	interface Props {
		data: ElectropherogramData;
		width?: number;
		height?: number;
	}

	let { data, width = 600, height = 300 }: Props = $props();
</script>

<ElectropherogramViewer
	x={data.x}
	y={data.y}
	peaks={data.peaks}
	ladder={data.ladder}
	xLabel={data.xLabel}
	yLabel={data.yLabel}
	{width}
	{height}
/>
