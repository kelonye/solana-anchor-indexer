test:
	env-cmd -f .env.test tsx src/db/init-db.ts
	env-cmd -f .env.test npx drizzle-kit push --force
	env-cmd -f .env.test tsx src/db/reset-db.ts
	env-cmd -f .env.test anchor test --skip-lint

jest:
	jest tests/example.spec.ts 

copy-files:
	cp -f target/idl/example.json src/assets/example-idl.json
	cp -f target/types/example.ts src/assets/example-types.ts

build:	
	anchor build

db-push:
	env-cmd -f .env.local tsx src/db/init-db.ts
	env-cmd -f .env.local npx drizzle-kit push --force
	env-cmd -f .env.local tsx src/db/reset-db.ts

indexer:
	env-cmd -f .env.local tsx src/scripts/indexer.ts

.PHONY: test jest copy-files build db-push indexer
