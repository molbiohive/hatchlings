<script lang="ts">
	interface LegendItem {
		label: string;
		color: string;
	}

	interface Props {
		items: LegendItem[];
		title?: string;
		direction?: 'horizontal' | 'vertical';
	}

	let { items, title = '', direction = 'vertical' }: Props = $props();
</script>

<div class="hatch-legend" class:horizontal={direction === 'horizontal'}>
	{#if title}
		<div class="legend-title">{title}</div>
	{/if}
	<div class="legend-items" class:horizontal={direction === 'horizontal'}>
		{#each items as item}
			<div class="legend-item">
				<span class="legend-swatch" style:background={item.color}></span>
				<span class="legend-label">{item.label}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.hatch-legend {
		font-family: var(--hatch-font, sans-serif);
		font-size: 11px;
		color: var(--hatch-legend-color, #95a3b3);
	}

	.legend-title {
		font-weight: 600;
		margin-bottom: 4px;
		font-size: 12px;
	}

	.legend-items {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.legend-items.horizontal {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.legend-swatch {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.legend-label {
		white-space: nowrap;
	}
</style>
