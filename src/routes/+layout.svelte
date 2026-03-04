<script lang="ts">
	import type { Snippet } from 'svelte';
	import { base } from '$app/paths';
	import ThemeProvider from '$lib/components/shared/ThemeProvider.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let theme: 'dark' | 'light' = $state('dark');

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}
</script>

<ThemeProvider {theme}>
	<div class="app">
		<nav>
			<a href="{base}/" class="brand">hatchlings</a>
			<span class="tagline">Svelte 5 molecular biology components</span>
			<button class="theme-toggle" onclick={toggleTheme} title="Toggle dark/light theme">
				{theme === 'dark' ? 'Light' : 'Dark'}
			</button>
		</nav>
		<main>
			{@render children()}
		</main>
	</div>
</ThemeProvider>

<style>
	:global(*:focus) {
		outline: none;
	}

	:global(body) {
		margin: 0;
		background: var(--hatch-bg, #0c1018);
		color: var(--hatch-text, #d4dce6);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: background 0.25s, color 0.25s;
	}

	.app {
		min-height: 100vh;
	}

	nav {
		display: flex;
		align-items: center;
		padding: 10px 24px;
		background: var(--hatch-plot-bg, #141c26);
		border-bottom: 1px solid var(--hatch-border, #2a3848);
		gap: 16px;
	}

	.brand {
		font-size: 18px;
		font-weight: 700;
		color: var(--hatch-highlight, #6ab8e0);
		text-decoration: none;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.tagline {
		color: var(--hatch-text-dim, #566070);
		font-size: 13px;
		flex: 1;
	}

	.theme-toggle {
		background: var(--hatch-grid-color, #1e2a38);
		border: 1px solid var(--hatch-border, #2a3848);
		color: var(--hatch-text-muted, #8a95a5);
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.theme-toggle:hover {
		color: var(--hatch-text, #d4dce6);
		background: var(--hatch-border, #2a3848);
	}

	main {
		padding: 0;
	}
</style>
