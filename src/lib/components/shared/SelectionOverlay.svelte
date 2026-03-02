<script lang="ts">
	interface Props {
		x: number;
		y: number;
		width: number;
		height: number;
		active?: boolean;
	}

	let { x, y, width, height, active = true }: Props = $props();
</script>

{#if active && width > 0 && height > 0}
	<rect
		{x}
		{y}
		{width}
		{height}
		class="hatch-selection"
		fill="var(--hatch-selection-fill, rgba(59, 130, 246, 0.15))"
		stroke="var(--hatch-selection-stroke, rgba(59, 130, 246, 0.6))"
		stroke-width="1"
		stroke-dasharray="4 2"
	/>
{/if}

<style>
	.hatch-selection {
		pointer-events: none;
	}
</style>
