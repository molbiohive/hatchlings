<script lang="ts">
	import type { Snippet } from 'svelte';
	import { darkTheme, lightTheme, applyTheme } from '../../util/themes.js';

	interface Props {
		theme?: 'dark' | 'light';
		children: Snippet;
	}

	let { theme = 'dark', children }: Props = $props();

	const themeVars = $derived(theme === 'light' ? lightTheme : darkTheme);

	const styleStr = $derived(
		Object.entries(themeVars)
			.map(([k, v]) => `${k}:${v}`)
			.join(';')
	);

	// Also apply theme vars to <html> so that body and page-level styles
	// (which are ancestors, not descendants of this component) can use them.
	$effect(() => {
		if (typeof document !== 'undefined') {
			applyTheme(document.documentElement, themeVars);
		}
	});
</script>

<div class="hatch-theme" style={styleStr}>
	{@render children()}
</div>

<style>
	.hatch-theme {
		display: contents;
	}
</style>
