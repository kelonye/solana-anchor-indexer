import { db } from '@/db';

import { store, txns } from './schema';

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Done ✅');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function main() {
  await db.delete(store);
  await db.delete(txns);
}
