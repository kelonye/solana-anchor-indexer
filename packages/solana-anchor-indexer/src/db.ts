import { pgTable, integer, text, serial } from 'drizzle-orm/pg-core';

export function createTxnsTableSchema(tableName: string) {
  return pgTable(tableName, {
    id: serial('id').primaryKey(),
    pubKey: text('pub_key').notNull(),
    signature: text('signature').notNull(),
    blockTime: integer('block_time').notNull(),
    slot: integer('slot').notNull(),
    processState: integer('process_state').default(0),
    events: text('events').notNull(),
    parsedIxs: text('parsed_ixs').notNull(),
    partiallyDecodedIxs: text('partially_decoded_ixs').notNull(),
    data: text('data').notNull(),
  });
}
