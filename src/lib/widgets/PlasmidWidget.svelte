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
	topology={data.topology}
	features={data.features}
	primers={data.primers}
	cutSites={data.cutSites}
	{width}
	{height}
/>
