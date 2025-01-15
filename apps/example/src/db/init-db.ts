import { sql } from 'drizzle-orm';

import { db } from '@/db';

const CREATE_SCHEMAS_SQL = sql`
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA IF NOT EXISTS public;
`;

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
  await db.execute(CREATE_SCHEMAS_SQL);
}
