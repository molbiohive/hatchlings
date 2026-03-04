<script lang="ts">
	import { onMount } from 'svelte';

	export interface ContextMenuItem {
		label: string;
		action: () => void;
		shortcut?: string;
		disabled?: boolean;
		divider?: boolean;
	}

	interface Props {
		x: number;
		y: number;
		visible: boolean;
		items: ContextMenuItem[];
		onclose?: () => void;
	}

	let { x, y, visible, items, onclose }: Props = $props();

	let menuEl: HTMLDivElement | undefined = $state(undefined);

	function handleClickOutside(e: MouseEvent) {
		if (menuEl && !menuEl.contains(e.target as Node)) {
			onclose?.();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose?.();
		}
	}

	function handleItemClick(item: ContextMenuItem) {
		if (item.disabled) return;
		item.action();
		onclose?.();
	}

	$effect(() => {
		if (visible) {
			document.addEventListener('click', handleClickOutside, true);
			document.addEventListener('keydown', handleKeydown);
			return () => {
				document.removeEventListener('click', handleClickOutside, true);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>

{#if visible}
	<div
		class="context-menu"
		bind:this={menuEl}
		style:left="{x}px"
		style:top="{y}px"
		role="menu"
	>
		{#each items as item}
			{#if item.divider}
				<div class="divider"></div>
			{/if}
			<button
				class="menu-item"
				class:disabled={item.disabled}
				role="menuitem"
				disabled={item.disabled}
				onclick={() => handleItemClick(item)}
			>
				<span class="label">{item.label}</span>
				{#if item.shortcut}
					<span class="shortcut">{item.shortcut}</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	.context-menu {
		position: absolute;
		z-index: 100;
		min-width: 180px;
		background: var(--hatch-context-menu-bg, #1e2a38);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		padding: 4px 0;
		font-family: var(--hatch-font, -apple-system, sans-serif);
		font-size: 13px;
	}

	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 6px 12px;
		border: none;
		background: none;
		color: var(--hatch-text, #d4dce6);
		cursor: pointer;
		text-align: left;
	}

	.menu-item:hover:not(.disabled) {
		background: var(--hatch-context-menu-hover, #2a3848);
	}

	.menu-item.disabled {
		color: var(--hatch-text-dim, #566070);
		cursor: default;
	}

	.shortcut {
		color: var(--hatch-text-dim, #566070);
		font-size: 11px;
		margin-left: 16px;
	}

	.divider {
		height: 1px;
		background: var(--hatch-border, #2a3848);
		margin: 4px 0;
	}
</style>
