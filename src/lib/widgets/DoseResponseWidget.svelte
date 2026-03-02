<script lang="ts">
	import type { DoseResponseData } from '../types/index.js';
	import { DoseResponseCurve } from '../components/charts/index.js';

	interface Props {
		data: DoseResponseData;
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 350 }: Props = $props();
</script>

<DoseResponseCurve
	curves={data.curves}
	xLabel={data.xLabel}
	yLabel={data.yLabel}
	{width}
	{height}
/>
