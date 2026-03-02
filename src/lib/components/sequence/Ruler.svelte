<script lang="ts">
	interface Props {
		/** Start bp position */
		start: number;
		/** End bp position */
		end: number;
		/** Characters per row */
		charsPerRow?: number;
		/** X offset */
		x?: number;
		/** Y offset */
		y?: number;
	}

	let { start, end, charsPerRow = 60, x = 0, y = 0 }: Props = $props();

	const tickInterval = $derived.by(() => {
		const range = end - start;
		if (range <= 60) return 10;
		if (range <= 300) return 50;
		if (range <= 1000) return 100;
		return 500;
	});

	const minorTickInterval = $derived(tickInterval / 5);

	const ticks = $derived.by(() => {
		const result: { pos: number; major: boolean; label: string }[] = [];
		const firstMajor = Math.ceil(start / tickInterval) * tickInterval;
		const firstMinor = Math.ceil(start / minorTickInterval) * minorTickInterval;

		for (let pos = firstMinor; pos <= end; pos += minorTickInterval) {
			const isMajor = pos % tickInterval === 0;
			result.push({
				pos,
				major: isMajor,
				label: isMajor ? String(pos + 1) : '',
			});
		}
		return result;
	});

	function bpToX(bp: number): number {
		return x + ((bp - start) / charsPerRow) * charsPerRow * 1;
	}
</script>

<g class="hatch-ruler">
	<!-- Baseline -->
	<line
		x1={x}
		y1={y}
		x2={x + (end - start)}
		y2={y}
		stroke="var(--hatch-ruler-color, #555)"
		stroke-width="1"
	/>

	{#each ticks as tick}
		{@const tx = x + (tick.pos - start)}
		<!-- Tick mark -->
		<line
			x1={tx}
			y1={y}
			x2={tx}
			y2={tick.major ? y - 8 : y - 4}
			stroke="var(--hatch-ruler-color, #555)"
			stroke-width={tick.major ? 1 : 0.5}
		/>
		<!-- Label -->
		{#if tick.label}
			<text
				x={tx}
				y={y - 10}
				text-anchor="middle"
				fill="var(--hatch-ruler-text, #888)"
				font-size="9"
				font-family="var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace)"
			>{tick.label}</text>
		{/if}
	{/each}
</g>
