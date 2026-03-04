<script lang="ts">
	import type { SequenceData } from '../types/index.js';
	import { SequenceViewer } from '../components/sequence/index.js';

	interface Props {
		data: SequenceData;
		width?: number;
		height?: number;
	}

	let { data, width = 800, height = 600 }: Props = $props();
</script>

<SequenceViewer
	seq={data.seq}
	parts={data.parts}
	cutSites={data.cutSites}
	translations={data.translations}
	{width}
	{height}
/>
