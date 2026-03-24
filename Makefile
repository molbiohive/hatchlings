.PHONY: setup dev build test test-all lint fmt clean

setup:
	bun install

dev:
	bun run dev

build:
	bun run build

test:
	bun run check

test-all:
	bun run check

lint:
	bun run check

fmt:
	@echo "No formatter configured"

clean:
	rm -rf dist/ build/ .svelte-kit/ node_modules/.vite/
