<script lang="ts">
	import type { PlasmidData } from '../types/index.js';
	import { PlasmidViewer } from '../components/plasmid/index.js';

	interface Props {
		data: PlasmidData;
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 500 }: Props = $props();
</script>

<PlasmidViewer
	name={data.name}
	size={data.size}
	parts={data.parts}
	cutSites={data.cutSites}
	{width}
	{height}
/>
