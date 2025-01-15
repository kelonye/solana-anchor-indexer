import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client });

export async function disconnect() {
  await db.$client.end();
}
