import * as anchor from '@coral-xyz/anchor';
import { sql } from 'drizzle-orm';

import { TxnProcessState } from './types';
import { DB_BATCH_SIZE, TX_QUERY_LIMIT } from './constants';
import { BaseIndexer } from './base-indexer';

export class InsertNewSignatures extends BaseIndexer {
  async exec(): Promise<void> {
    this.logger.debug('Initializing new signature insertion');

    const maxSlot = await this.getMaxSlot();
    this.logger.debug(`Latest slot: ${maxSlot}`);

    const newSignatures = await this.getNewSignatures(maxSlot);

    if (newSignatures.length === 0) {
      this.logger.debug('No new signatures found');
      return;
    }

    const numInserts = await this.insertSignatures(newSignatures);

    this.logger.debug(`Inserted ${numInserts} signatures`);
  }

  async getMaxSlot(): Promise<number> {
    const [result] = await this.db.execute(
      sql`SELECT MAX(slot) AS slot FROM ${this.txnsTable} WHERE pub_key = ${this.pubKey.toString()}`
    );
    return result ? Number(result.slot) : 0;
  }

  async getNewSignatures(
    afterSlot: number
  ): Promise<anchor.web3.ConfirmedSignatureInfo[]> {
    const allSignaturesInfo: anchor.web3.ConfirmedSignatureInfo[] = [];
    let before: string | undefined;

    while (true) {
      const options: anchor.web3.SignaturesForAddressOptions = {
        limit: TX_QUERY_LIMIT,
        before,
      };
      this.logger.debug('Fetching signatures', options);

      const signaturesInfo =
        await this.provider.connection.getSignaturesForAddress(
          this.pubKey,
          options,
          'confirmed'
        );
      if (signaturesInfo.length === 0) break;

      const newSignatures = signaturesInfo.filter(
        (sig) => sig.slot > afterSlot
      );
      allSignaturesInfo.push(...newSignatures);

      if (
        signaturesInfo.some((sig) => sig.slot <= afterSlot) ||
        signaturesInfo.length < TX_QUERY_LIMIT
      ) {
        break;
      }

      before = signaturesInfo[signaturesInfo.length - 1].signature;
    }

    return allSignaturesInfo.reverse();
  }

  async insertSignatures(
    signatures: anchor.web3.ConfirmedSignatureInfo[]
  ): Promise<number> {
    const seen = new Set<string>();

    const uniqueInserts = signatures
      .map(({ signature, blockTime, slot, err }) => ({
        pubKey: this.pubKey.toBase58(),
        signature,
        blockTime: blockTime ?? 0,
        slot,
        processState: err
          ? TxnProcessState.Unparseable
          : TxnProcessState.Unprocessed,
        parsedIxs: JSON.stringify([]),
        partiallyDecodedIxs: JSON.stringify([]),
        events: JSON.stringify([]),
        data: JSON.stringify({}),
      }))
      .filter((insert) => {
        if (seen.has(insert.signature)) return false;
        seen.add(insert.signature);
        return true;
      });

    await this.db.transaction(async (tx) => {
      const batches: (typeof uniqueInserts)[] = [];
      for (let i = 0; i < uniqueInserts.length; i += DB_BATCH_SIZE) {
        batches.push(uniqueInserts.slice(i, i + DB_BATCH_SIZE));
      }
      for (const batch of batches) {
        await tx.insert(this.txnsTable).values(batch);
      }
    });

    return uniqueInserts.length;
  }
}
