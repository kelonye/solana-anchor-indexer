import * as anchor from '@coral-xyz/anchor';
import chunk from 'lodash.chunk';
import { and, eq } from 'drizzle-orm';

import { BaseIndexer } from './base-indexer';
import {
  TxnProcessState,
  InputProgramEvents,
  InputProgramParsedIx,
  InputProgramPartiallyDecodedIx,
} from './types';
import { DB_BATCH_SIZE } from './constants';
import { sleep } from './utils';

const SOL_PARALLEL_TXNS_LIMIT = 90; // quicknode plan limit is 100 req/s
const SLEEP_DURATION = 600;

export class PopulateTransactions extends BaseIndexer {
  async exec(): Promise<void> {
    const signatures = await this.getUnpopulatedSignatures();
    if (signatures.length === 0) {
      this.logger.debug('No unpopulated signatures found');
      return;
    }

    const transactions = await this.parseTransactions(signatures);
    if (transactions.length === 0) {
      this.logger.debug('No transactions parsed');
      return;
    }

    await this.populateTransactionsInDb(transactions);
  }

  async getUnpopulatedSignatures(): Promise<string[]> {
    this.logger.debug('Fetching unpopulated transaction signatures');

    const txns = await this.db
      .select({ signature: this.txnsTable.signature })
      .from(this.txnsTable)
      .where(
        and(
          eq(this.txnsTable.processState, TxnProcessState.Unprocessed),
          eq(this.txnsTable.pubKey, this.pubKey.toString())
        )
      )
      .limit(DB_BATCH_SIZE);

    return txns.map(({ signature }) => signature);
  }

  async parseTransactions(
    signatures: string[]
  ): Promise<
    { signature: string; transaction: anchor.web3.ParsedTransactionWithMeta }[]
  > {
    this.logger.debug('Parsing transactions');

    const parsedTransactions: {
      signature: string;
      transaction: anchor.web3.ParsedTransactionWithMeta;
    }[] = [];
    const batches = chunk(signatures, SOL_PARALLEL_TXNS_LIMIT);

    let j = 0;
    for (const batch of batches) {
      this.logger.debug('Parsing transactions batch', j++);
      const batchTransactions =
        await this.provider.connection.getParsedTransactions(batch, {
          maxSupportedTransactionVersion: 0,
        });

      for (let i = 0; i < batch.length; i++) {
        const parsedTransaction = batchTransactions[i];
        if (!parsedTransaction) {
          this.logger.error(
            `Failed to parse transaction for signature ${batch[i]}`
          );
          continue;
        }
        parsedTransactions.push({
          signature: batch[i],
          transaction: parsedTransaction,
        });
      }

      await sleep(SLEEP_DURATION);
    }

    return parsedTransactions;
  }

  async populateTransactionsInDb(
    transactions: {
      signature: string;
      transaction: anchor.web3.ParsedTransactionWithMeta;
    }[]
  ): Promise<void> {
    this.logger.debug(
      'Updating transactions with instructions and events in db'
    );

    const updates = [
      ...new Map(
        transactions.map(({ signature, transaction }) => [
          signature,
          {
            processState: TxnProcessState.ReadyForParsing,
            events: JSON.stringify(this.getTxEvents(transaction)),
            parsedIxs: JSON.stringify([...this.getTxParsedIxs(transaction)]),
            partiallyDecodedIxs: JSON.stringify([
              ...this.getTxPartiallyDecodedIxs(transaction),
            ]),
            data: JSON.stringify(transaction),
          },
        ])
      ),
    ];

    const batches: (typeof updates)[] = [];
    for (let i = 0; i < updates.length; i += DB_BATCH_SIZE) {
      batches.push(updates.slice(i, i + DB_BATCH_SIZE));
    }

    for (const batch of batches) {
      await this.db.transaction(async (tx) => {
        for (const [signature, update] of batch) {
          await tx
            .update(this.txnsTable)
            .set(update)
            .where(eq(this.txnsTable.signature, signature));
        }
      });
    }
  }

  *getTxParsedIxs(
    tx: anchor.web3.ParsedTransactionWithMeta
  ): Generator<InputProgramParsedIx> {
    for (const ix of tx.transaction.message.instructions) {
      if ('parsed' in ix) {
        yield {
          programId: ix.programId.toString(),
          parsed: JSON.stringify(ix.parsed),
        };
      }
    }
  }

  *getTxPartiallyDecodedIxs(
    tx: anchor.web3.ParsedTransactionWithMeta
  ): Generator<InputProgramPartiallyDecodedIx> {
    for (const ix of tx.transaction.message.instructions) {
      if ('data' in ix) {
        yield {
          programId: ix.programId.toString(),
          accounts: ix.accounts.map((a) => a.toString()),
          data: ix.data,
        };
      }
    }
  }

  getTxEvents(tx: anchor.web3.ParsedTransactionWithMeta): InputProgramEvents {
    return [...analyzeProgramLogs(tx)].map(([programId, logs]) => ({
      programId,
      logs,
    }));
  }
}

function analyzeProgramLogs(parsedTx: anchor.web3.ParsedTransactionWithMeta) {
  const logs = parsedTx.meta?.logMessages || [];
  const mappedLogs = mapLogsToPrograms(logs);

  // Group logs by program
  const logsByProgram = mappedLogs.reduce((acc, { message, programId }) => {
    if (!acc.has(programId)) {
      acc.set(programId, []);
    }
    acc.get(programId)?.push(message);
    return acc;
  }, new Map<string, string[]>());

  // Print logs grouped by program
  // Array.from(logsByProgram).forEach(([programId, programLogs]) => {
  //   this.logger.log(`\nLogs from program ${programId}:`);
  //   programLogs.forEach((log) => this.logger.log(`  ${log}`));
  // });

  return logsByProgram;
}

function mapLogsToPrograms(logs: string[]) {
  const programStack: string[] = [];
  const mappedLogs: Array<{ message: string; programId: string }> = [];

  logs.forEach((log) => {
    // Match program invoke
    const invokeMatch = log.match(/Program (.*) invoke \[(\d+)\]/);
    if (invokeMatch) {
      programStack.push(invokeMatch[1]);
      mappedLogs.push({
        message: log,
        programId: invokeMatch[1],
      });
      return;
    }

    // Match program completion
    const completionMatch = log.match(/Program (.*) success|failed/);
    if (completionMatch) {
      programStack.pop();
      mappedLogs.push({
        message: log,
        programId: completionMatch[1],
      });
      return;
    }

    // All other logs belong to the current program on top of the stack
    if (programStack.length > 0) {
      mappedLogs.push({
        message: log,
        programId: programStack[programStack.length - 1],
      });
    }
  });

  return mappedLogs;
}
