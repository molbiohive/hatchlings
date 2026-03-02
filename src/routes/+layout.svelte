<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="app">
	<nav>
		<a href="/" class="brand">hatchlings</a>
		<div class="links">
			<a href="/plasmid">Plasmid</a>
			<a href="/sequence">Sequence</a>
			<a href="/gel">Gel</a>
			<a href="/trace">Trace</a>
			<a href="/charts">Charts</a>
		</div>
	</nav>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #0d0d1a;
		color: #e0e0e0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.app {
		min-height: 100vh;
	}

	nav {
		display: flex;
		align-items: center;
		padding: 12px 24px;
		background: #151528;
		border-bottom: 1px solid #2a2a4a;
		gap: 24px;
	}

	.brand {
		font-size: 18px;
		font-weight: 700;
		color: #7dd3fc;
		text-decoration: none;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.links {
		display: flex;
		gap: 16px;
	}

	.links a {
		color: #999;
		text-decoration: none;
		font-size: 14px;
		transition: color 0.15s;
	}

	.links a:hover {
		color: #ddd;
	}

	main {
		padding: 24px;
		max-width: 1200px;
		margin: 0 auto;
	}
</style>
