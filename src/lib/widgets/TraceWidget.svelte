<script lang="ts">
	import type { TraceData } from '../types/index.js';
	import { TraceViewer } from '../components/trace/index.js';

	interface Props {
		data: TraceData;
		width?: number;
		height?: number;
	}

	let { data, width = 800, height = 300 }: Props = $props();
</script>

<TraceViewer
	baseCalls={data.baseCalls}
	qualityScores={data.qualityScores}
	channels={data.channels}
	peakPositions={data.peakPositions}
	alignment={data.alignment}
	{width}
	{height}
/>
