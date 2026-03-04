/** Native event listeners for SVG hover — bypasses Svelte 5's broken event delegation on SVG elements. */

export interface HoverParams {
	over?: (e: MouseEvent) => void;
	out?: (e: MouseEvent) => void;
	move?: (e: MouseEvent) => void;
}

export function hover(node: Element, params: HoverParams) {
	let current = params;

	function handleOver(e: Event) { current.over?.(e as MouseEvent); }
	function handleOut(e: Event) {
		const me = e as MouseEvent;
		if (node.contains(me.relatedTarget as Node)) return;
		current.out?.(me);
	}
	function handleMove(e: Event) { current.move?.(e as MouseEvent); }

	node.addEventListener('mouseover', handleOver);
	node.addEventListener('mouseout', handleOut);
	node.addEventListener('mousemove', handleMove);

	return {
		update(p: HoverParams) { current = p; },
		destroy() {
			node.removeEventListener('mouseover', handleOver);
			node.removeEventListener('mouseout', handleOut);
			node.removeEventListener('mousemove', handleMove);
		}
	};
}
