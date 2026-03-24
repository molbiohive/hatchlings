<script lang="ts">
	interface LegendEntry {
		name: string;
		color: string;
	}

	interface Props {
		items: LegendEntry[];
		x?: number;
		y?: number;
		rowHeight?: number;
		fontSize?: number;
	}

	let { items, x = 0, y = 0, rowHeight = 16, fontSize = 10 }: Props = $props();
</script>

<g transform="translate({x}, {y})">
	{#each items as item, idx}
		<g transform="translate(0, {idx * rowHeight})">
			<line x1="0" y1="0" x2="16" y2="0" stroke={item.color} stroke-width="2" />
			<text x="22" y="4" fill="var(--hatch-legend-color, #95a3b3)" font-size={fontSize}>{item.name}</text>
		</g>
	{/each}
</g>
