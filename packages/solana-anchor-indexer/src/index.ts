import * as anchor from '@coral-xyz/anchor';

import { InsertNewSignatures } from './insert-new-signatures';
import { PopulateTransactions } from './populate-transactions';
import { ProcessTransactions } from './parse-transactions';
import { noopLogger } from './utils';
import { type BaseIndexerOptions } from './base-indexer';
export * from './types';
export { createTxnsTableSchema } from './db';
export type { BaseIndexerOptions } from './base-indexer';

export async function indexAccount({
  programs,
  debug,
  ...mOpts
}: Omit<BaseIndexerOptions, 'logger' | 'programs'> & {
  programs: Map<string, anchor.Idl>;
  debug?: boolean;
}) {
  const opts = {
    ...mOpts,
    logger: !debug ? noopLogger : console,
    programs: new Map(
      [...programs].map(([programId, idl]) => {
        return [programId, new anchor.Program(idl)];
      })
    ),
  };

  const insertNewSignatures = new InsertNewSignatures(opts);
  await insertNewSignatures.exec();

  const populateTransactions = new PopulateTransactions(opts);
  await populateTransactions.exec();

  const processTransactions = new ProcessTransactions(opts);
  await processTransactions.exec();
}
