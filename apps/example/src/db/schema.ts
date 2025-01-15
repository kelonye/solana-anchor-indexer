import { bigint, pgTable, varchar } from 'drizzle-orm/pg-core';
import { createTxnsTableSchema } from 'solana-anchor-indexer/src';

export const store = pgTable('store', {
  publicKey: varchar('public_key', { length: 44 }).primaryKey(),
  timestamp: bigint('timestamp', { mode: 'number' }),
});

export const txns = createTxnsTableSchema('txns');
