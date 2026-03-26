<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

const props = defineProps({
	component: { type: [Object, Function], required: true },
	props: { type: Object, default: () => ({}) },
});

const el = ref(null);
let instance = null;

// Tooltip state
const hoverInfo = ref(null);

function handleHover(info) {
	hoverInfo.value = info ?? null;
}

const tooltipStyle = computed(() => {
	if (!hoverInfo.value) return '';
	const { x, y } = hoverInfo.value.position;
	const pad = 12;
	const boxW = 280;
	const boxH = 200;
	let left = x + pad;
	let top = y + pad;
	if (typeof window !== 'undefined') {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		if (left + boxW > vw - pad) left = x - boxW - pad;
		if (top + boxH > vh - pad) top = y - boxH - pad;
		if (left < pad) left = pad;
		if (top < pad) top = pad;
	}
	return `left:${left}px;top:${top}px`;
});

onMounted(async () => {
	const { mount } = await import('svelte');
	const mergedProps = { ...props.props, onhoverinfo: handleHover };
	instance = mount(props.component, {
		target: el.value,
		props: mergedProps,
	});
});

onBeforeUnmount(async () => {
	if (instance) {
		const { unmount } = await import('svelte');
		unmount(instance);
	}
});
</script>

<template>
	<div ref="el" />
	<Teleport to="body">
		<div v-if="hoverInfo" class="demo-tooltip" :style="tooltipStyle">
			<div v-if="hoverInfo.title" class="demo-tooltip-title">{{ hoverInfo.title }}</div>
			<div v-for="item in hoverInfo.items" :key="item.label" class="demo-tooltip-row">
				<span class="demo-tooltip-label">{{ item.label }}</span>
				<span class="demo-tooltip-value" :style="item.color ? { color: item.color } : {}">
					{{ item.value }}<template v-if="item.unit">&nbsp;{{ item.unit }}</template>
				</span>
			</div>
		</div>
	</Teleport>
</template>

<style>
.demo-tooltip {
	position: fixed;
	z-index: 9999;
	min-width: 180px;
	max-width: 280px;
	padding: 10px 14px;
	background: var(--hatch-tooltip-bg, #fafaf8);
	border: 1px solid var(--hatch-tooltip-border, #d8d6d2);
	border-radius: 6px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	pointer-events: none;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}

.demo-tooltip-title {
	font-size: 12px;
	font-weight: 700;
	color: var(--hatch-tooltip-text, #2a2e34);
	margin-bottom: 6px;
	padding-bottom: 4px;
	border-bottom: 1px solid var(--hatch-tooltip-border, #d8d6d2);
}

.demo-tooltip-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 12px;
}

.demo-tooltip-label {
	font-size: 10px;
	color: var(--hatch-tooltip-label, #6a7080);
	white-space: nowrap;
}

.demo-tooltip-value {
	font-size: 11px;
	font-weight: 600;
	color: var(--hatch-tooltip-text, #2a2e34);
	text-align: right;
}
</style>
