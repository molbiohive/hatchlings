/**
 * Minimal Svelte 5 Vite plugin for VitePress.
 *
 * VitePress bundles Vite 5, but @sveltejs/vite-plugin-svelte v6 requires Vite 7.
 * This plugin compiles .svelte files directly using the Svelte 5 compiler,
 * avoiding the version mismatch entirely.
 *
 * It also resolves .js imports to .ts files (TypeScript convention used by the
 * library's relative imports like `../../util/colors.js` → `colors.ts`).
 */
import { compile } from 'svelte/compiler';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Plugin } from 'vite';

export function svelteDocs(): Plugin[] {
	return [
		{
			name: 'svelte-docs-resolve',
			enforce: 'pre',
			resolveId(source, importer) {
				// Resolve .js → .ts for imports from src/lib files
				if (source.endsWith('.js') && importer && !source.includes('node_modules')) {
					const dir = dirname(importer);
					const tsPath = resolve(dir, source.replace(/\.js$/, '.ts'));
					if (existsSync(tsPath)) {
						return tsPath;
					}
					// Also try .svelte.ts
					const svelteTsPath = resolve(dir, source.replace(/\.js$/, '.svelte.ts'));
					if (existsSync(svelteTsPath)) {
						return svelteTsPath;
					}
				}
				return null;
			},
		},
		{
			name: 'svelte-docs-compile',
			transform(code, id) {
				if (!id.endsWith('.svelte')) return;

				const result = compile(code, {
					filename: id,
					generate: 'client',
					css: 'injected',
					dev: false,
				});

				return {
					code: result.js.code,
					map: result.js.map,
				};
			},
		},
	];
}
