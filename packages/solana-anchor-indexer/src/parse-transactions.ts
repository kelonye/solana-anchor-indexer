import * as anchor from '@coral-xyz/anchor';
import isNil from 'lodash.isnil';
import { and, eq } from 'drizzle-orm';

import { BaseIndexer } from './base-indexer';
import {
  TxnProcessState,
  DecodedProgramEvent,
  DecodedProgramParsedIx,
  DecodedProgramPartiallyDecodedIx,
  InputProgramEvents,
  InputProgramParsedIxs,
  InputProgramPartiallyDecodedIxs,
} from './types';
import { DB_BATCH_SIZE } from './constants';

type Tx = {
  id: number;
  signature: string;
  blockTime: number;
  slot: number;
  events: string;
  parsedIxs: string;
  partiallyDecodedIxs: string;
  data: string;
};

export class ProcessTransactions extends BaseIndexer {
  async exec(): Promise<boolean> {
    const { txs } = await this.getParsableTransactions();
    if (!txs.length) {
      this.logger.log('No txns to parse');
      return false;
    }

    await this.processAndUpdateTransactionsInDb({
      txs,
    });

    return true;
  }

  async getParsableTransactions() {
    this.logger.log('Init parsing txns');

    const txs = await this.db
      .select()
      .from(this.txnsTable)
      .where(
        and(
          eq(this.txnsTable.processState, TxnProcessState.ReadyForParsing),
          eq(this.txnsTable.pubKey, this.pubKey.toString())
        )
      )
      .limit(DB_BATCH_SIZE);

    return {
      txs,
    };
  }

  async processAndUpdateTransactionsInDb({ txs }: { txs: Tx[] }) {
    this.logger.log(`Parsing ${txs.length} txns`);
    for (const tx of txs) {
      await this.procressTx({
        tx,
      });
    }
    this.logger.log(`Finished parsing txns`);
  }

  async procressTx({ tx }: { tx: Tx }) {
    this.logger.log(`Processing tx ${tx.signature}`);
    // this.logger.log(JSON.stringify(tx, null, 2));
    const { blockTime, slot, signature } = tx;

    for (const ix of this.decodeTxParsedIxs(
      JSON.parse(tx.parsedIxs) as InputProgramParsedIxs
    )) {
      await this.execParsedIx({
        ix,
        blockTime,
        slot,
        signature,
      });
    }

    for (const ix of this.decodeTxPartiallyDecodedIxs(
      JSON.parse(tx.partiallyDecodedIxs) as InputProgramPartiallyDecodedIxs
    )) {
      await this.execPartiallyDecodedIx({
        ix,
        blockTime,
        slot,
        signature,
      });
    }

    for (const event of this.decodeTxEvents(
      JSON.parse(tx.events) as InputProgramEvents
    )) {
      await this.execEvent({
        event,
        blockTime,
        slot,
        signature,
      });
    }

    await this.db
      .update(this.txnsTable)
      .set({
        processState: TxnProcessState.Parsed,
      })
      .where(
        and(
          eq(this.txnsTable.pubKey, this.pubKey.toBase58()),
          eq(this.txnsTable.signature, signature)
        )
      );

    this.logger.log(`Processed tx ${tx.signature}`);
  }

  *decodeTxParsedIxs(
    ixs: InputProgramParsedIxs
  ): Generator<DecodedProgramParsedIx> {
    for (const ix of ixs) {
      yield ix;
    }
  }

  *decodeTxPartiallyDecodedIxs(
    ixs: InputProgramPartiallyDecodedIxs
  ): Generator<DecodedProgramPartiallyDecodedIx> {
    for (const ix of ixs) {
      const program = this.programs.get(ix.programId);
      if (!program) {
        // throw new Error(`Program not found: ${ix.programId}`);
        continue;
      }
      const coder = program.coder.instruction as anchor.BorshInstructionCoder;
      const decodedIx = coder.decode(ix.data, 'base58');
      if (decodedIx) {
        const c = coder.format(
          decodedIx,
          ix.accounts.map((o) => ({
            pubkey: new anchor.web3.PublicKey(o),
            isSigner: false,
            isWritable: false,
          }))
        );
        if (c) {
          const { accounts } = c;
          const namedAccounts: DecodedProgramPartiallyDecodedIx['namedAccounts'] =
            {};
          const remainingAccounts: anchor.web3.PublicKey[] = [];
          for (const account of accounts) {
            if (account.name) {
              namedAccounts[account.name] = new anchor.web3.PublicKey(
                account.pubkey.toString()
              );
            } else {
              remainingAccounts.push(
                new anchor.web3.PublicKey(account.pubkey.toString())
              );
            }
          }

          yield {
            name: decodedIx.name,
            data: decodedIx.data,
            namedAccounts,
            remainingAccounts,
            programId: ix.programId,
          };
        }
      }
    }
  }

  *decodeTxEvents(events: InputProgramEvents): Generator<DecodedProgramEvent> {
    for (const { programId, logs } of events) {
      const program = this.programs.get(programId);
      if (!program) {
        // throw new Error(`Program not found: ${ix.programId}`);
        continue;
      }
      if (program.idl.events?.length) {
        const eventParser = new anchor.EventParser(
          program.programId,
          program.coder
        );
        if (logs.length) {
          for (const e of eventParser.parseLogs(logs)) {
            const { name, data }: { name: string; data: Record<string, any> } =
              e;
            yield {
              name,
              data: Object.entries(data).reduce(
                (data, [key, value]) => {
                  data[key] = isNil(value) ? null : value.toString();
                  return data;
                },
                {} as Record<string, string>
              ),
              programId,
            };
          }
        }
      }
    }
  }
}
