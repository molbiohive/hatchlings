<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
	component: { type: [Object, Function], required: true },
	props: { type: Object, default: () => ({}) },
});

const el = ref(null);
let instance = null;

onMounted(async () => {
	const { mount } = await import('svelte');
	instance = mount(props.component, {
		target: el.value,
		props: props.props,
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
</template>
