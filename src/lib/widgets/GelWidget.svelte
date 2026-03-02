<script lang="ts">
	import type { GelData } from '../types/index.js';
	import { GelViewer } from '../components/gel/index.js';

	interface Props {
		data: GelData;
		width?: number;
		height?: number;
	}

	let { data, width = 400, height = 500 }: Props = $props();
</script>

<GelViewer
	lanes={data.lanes}
	gelType={data.gelType}
	stain={data.stain}
	{width}
	{height}
/>
