# Solana Anchor Indexer

A lightweight indexer for [Solana](https://solana.com) programs built with [Anchor](https://www.anchor-lang.com). Easily process transactions and events with custom business logic.

## Features

- Index transactions and events from any Anchor program
- Process parsed and partially decoded instructions
- Handle program-emitted events
- Built on Drizzle ORM for type-safe database operations
- Simple API for custom processing logic

## Prerequisites

- Node.js 20+
- PostgreSQL database
- [Drizzle ORM](https://orm.drizzle.team)

## Installation

```bash
npm install solana-anchor-indexer
```

## Quick Start

### 1. Set up Database Schema

First, [set up Drizzle ORM with your PostgreSQL database](https://orm.drizzle.team/docs/get-started-postgresql).

Create your schema file (`schema.ts`):

```ts
import { pgTable, serial, varchar, bigint } from 'drizzle-orm/pg-core';
import { createTxnsTableSchema } from 'solana-anchor-indexer';

// Create the indexer transactions table
export const txns = createTxnsTableSchema('indexer_txns');

// Create your custom tables as needed
export const customTable = pgTable('custom_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fee: varchar('fee', { length: 255 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
});
```

### 2. Create the Indexer

```ts
import { indexAccount } from 'solana-anchor-indexer';
import * as anchor from '@coral-xyz/anchor';
import * as db from './db';
import * as schema from './db/schema';

async function main() {
  await indexAccount({
    db,
    debug: true,
    provider,
    pubKey: new anchor.web3.PublicKey('your-account-to-index'),
    // Map program IDs to their IDLs
    programs: new Map([
      [program1Id, IDL_1],
      [program2Id, IDL_2],
    ]),
    txnsTable: schema.txns,

    // Handle parsed instructions (e.g., system program instructions)
    execParsedIx: async (opts) => {
      const { ix } = opts;
      switch (ix.programId) {
        case programId:
          await processParsedIx(opts);
          break;
        default:
          throw new Error(`Unsupported program: ${ix.programId}`);
      }
    },

    // Handle program instructions
    execPartiallyDecodedIx: async (opts) => {
      const { ix } = opts;
      switch (ix.programId) {
        case programId:
          await processPartiallyDecodedIx(opts);
          break;
        default:
          throw new Error(`Unsupported program: ${ix.programId}`);
      }
    },

    // Handle program events
    execEvent: async (opts) => {
      const { event } = opts;
      switch (event.programId) {
        case programId:
          await processEvent(opts);
          break;
        default:
          throw new Error(`Unsupported program: ${event.programId}`);
      }
    },
  });
}

// Example processing functions
async function processParsedIx(opts) {
  const { name } = opts.ix.parsed.data;

  await db
    .insert(schema.customTable)
    .values({ name })
    .onConflictDoUpdate({
      target: [schema.customTable.id],
      set: { name },
    });
}

async function processPartiallyDecodedIx(opts) {
  const { name, fee } = opts.ix.data;

  await db
    .insert(schema.customTable)
    .values({
      name,
      fee: fee.toString(),
    })
    .onConflictDoUpdate({
      target: [schema.customTable.id],
      set: {
        name,
        fee: fee.toString(),
      },
    });
}

async function processEvent(opts) {
  const { name, timestamp } = opts.event.data;

  await db
    .update(schema.customTable)
    .set({ timestamp: parseInt(timestamp) })
    .where(eq(schema.customTable.name, name));
}

main();
```

## Event Handling

The indexer can process events emitted by your Anchor program. For example:

```rust
// In your Anchor program
emit!(MyEvent {
    name: "event_name",
    data: "event_data",
});
```

These events will be passed to your `execEvent` handler for processing.

## API Reference

### indexAccount Options

| Option                   | Type               | Description                                   |
| ------------------------ | ------------------ | --------------------------------------------- |
| `db`                     | `DrizzleDB`        | Drizzle database instance                     |
| `debug`                  | `boolean`          | Enable debug logging                          |
| `provider`               | `AnchorProvider`   | Anchor provider instance                      |
| `pubKey`                 | `PublicKey`        | Account public key to index                   |
| `programs`               | `Map<string, Idl>` | Map of program IDs to their IDLs              |
| `txnsTable`              | `PgTableSchema`    | Drizzle table schema for storing transactions |
| `execParsedIx`           | `Function`         | Handler for parsed instructions               |
| `execPartiallyDecodedIx` | `Function`         | Handler for program instructions              |
| `execEvent`              | `Function`         | Handler for program events                    |

## License

MIT
