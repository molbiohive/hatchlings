<script lang="ts">
	interface Props {
		x: number;
		y: number;
		visible: boolean;
		children?: import('svelte').Snippet;
	}

	let { x, y, visible, children }: Props = $props();
</script>

{#if visible}
	<div
		class="hatch-tooltip"
		style:left="{x + 12}px"
		style:top="{y - 8}px"
	>
		{@render children?.()}
	</div>
{/if}

<style>
	.hatch-tooltip {
		position: absolute;
		pointer-events: none;
		background: var(--hatch-tooltip-bg, #1a1a2e);
		color: var(--hatch-tooltip-color, #e8e8e8);
		border: 1px solid var(--hatch-tooltip-border, #333);
		border-radius: 4px;
		padding: 6px 10px;
		font-size: 12px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		white-space: nowrap;
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}
</style>
