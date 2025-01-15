lint:
	make lint -C packages/solana-anchor-indexer
	make lint -C apps/example

.PHONY: lint
