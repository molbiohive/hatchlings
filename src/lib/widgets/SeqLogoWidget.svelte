<script lang="ts">
	import type { SeqLogoData } from '../types/index.js';
	import { SeqLogo } from '../components/charts/index.js';

	interface Props {
		data: SeqLogoData;
		width?: number;
		height?: number;
	}

	let { data, width = 500, height = 200 }: Props = $props();
</script>

<SeqLogo
	positions={data.positions}
	alphabet={data.alphabet}
	{width}
	{height}
/>
