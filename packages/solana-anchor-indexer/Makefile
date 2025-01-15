lint:
	rm -rf dist
	pnpm run lint

build:
	make lint
	pnpm run build

publish:
	make build
	npm publish

.PHONY: lint build publish
