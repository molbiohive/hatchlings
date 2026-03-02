<script lang="ts">
	import type { KineticsData } from '../types/index.js';
	import { BindingKineticsViewer } from '../components/charts/index.js';

	interface Props {
		data: KineticsData;
		width?: number;
		height?: number;
	}

	let { data, width = 600, height = 350 }: Props = $props();
</script>

<BindingKineticsViewer
	curves={data.curves}
	fit={data.fit}
	steps={data.steps}
	params={data.params}
	{width}
	{height}
/>
