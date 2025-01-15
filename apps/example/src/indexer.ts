import * as anchor from '@coral-xyz/anchor';
import {
  type ExecEventFnOpts,
  type ExecParsedIxFnOpts,
  type ExecPartiallyDecodedIxFnOpts,
  indexAccount,
} from 'solana-anchor-indexer/src';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { Example } from '@/assets/example-types';
import IDL from '@/assets/example-idl.json';

export class Indexer {
  static async new({
    provider,
    program,
  }: {
    provider: anchor.AnchorProvider;
    program: anchor.Program<Example>;
  }) {
    const programId = program.programId.toBase58();
    const indexer = new Indexer();

    return async () => {
      await indexAccount({
        db,
        debug: true,
        provider,
        pubKey: new anchor.web3.PublicKey(program.programId),
        programs: new Map([[programId, IDL as anchor.Idl]]),
        txnsTable: schema.txns,
        execParsedIx: async (opts: ExecParsedIxFnOpts) => {
          console.log('execParsedIx');
          console.log(JSON.stringify(opts.ix, null, 2));
        },
        execPartiallyDecodedIx: async (opts: ExecPartiallyDecodedIxFnOpts) => {
          console.log('execPartiallyDecodedIx');
          console.log(JSON.stringify(opts.ix, null, 2));
          switch (opts.ix.programId) {
            case programId:
              await indexer.processIx(opts);
              break;
            default:
            // throw new Error(`unsupported program: ${opts.ix.programId}`);
          }
        },
        execEvent: async (opts: ExecEventFnOpts) => {
          console.log('execEvent');
          console.log(JSON.stringify(opts, null, 2));
          switch (opts.event.programId) {
            case programId:
              await indexer.processEvent(opts);
              break;
            default:
            // throw new Error(`unsupported program: ${opts.event.programId}`);
          }
        },
      });
    };
  }

  async processIx(opts: ExecPartiallyDecodedIxFnOpts) {
    switch (opts.ix.name) {
      case 'resetStore': {
        await this.handleResetStoreIx(opts);
        break;
      }

      case 'setStore': {
        await this.handleSetStoreIx(opts);
        break;
      }

      default:
        throw new Error(`unknown instruction: ${opts.ix.name}`);
    }
  }

  async processEvent(opts: ExecEventFnOpts) {
    switch (opts.event.name) {
      case 'storeReset': {
        await this.handleStoreResetEvent(opts);
        break;
      }
      default:
        throw new Error(`unknown event: ${opts.event.name}`);
    }
  }

  async handleResetStoreIx(opts: ExecPartiallyDecodedIxFnOpts) {
    const publicKey = opts.ix.namedAccounts.Store.toString();

    await db
      .insert(schema.store)
      .values({
        publicKey,
        timestamp: 0,
      })
      .onConflictDoNothing();
  }

  async handleSetStoreIx(opts: ExecPartiallyDecodedIxFnOpts) {
    const { timestamp } = opts.ix.data as {
      timestamp: anchor.BN;
    };

    await db.update(schema.store).set({
      timestamp: timestamp.toNumber(),
    });
  }

  async handleStoreResetEvent({ event: { data } }: ExecEventFnOpts) {
    const { timestamp: timestampString } = data as {
      timestamp: string;
    };
    const timestamp = parseInt(timestampString);

    await db.transaction(async (tx) => {
      await tx.update(schema.store).set({
        timestamp,
      });
    });
  }
}
