<script lang="ts">
	import type { ChromData } from '../types/index.js';
	import { ChromatogramViewer } from '../components/charts/index.js';

	interface Props {
		data: ChromData;
		width?: number;
		height?: number;
	}

	let { data, width = 600, height = 350 }: Props = $props();
</script>

<ChromatogramViewer
	traces={data.traces}
	peaks={data.peaks}
	fractions={data.fractions}
	xLabel={data.xLabel}
	{width}
	{height}
/>
