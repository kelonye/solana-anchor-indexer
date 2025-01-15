import * as anchor from '@coral-xyz/anchor';

import {
  ExecEventFn,
  ExecParsedIxFn,
  ExecPartiallyDecodedIxFn,
  Db,
  TxnsTable,
  Logger,
} from './types';

export type BaseIndexerOptions = {
  provider: anchor.Provider;
  pubKey: anchor.web3.PublicKey;
  programs: Map<string, anchor.Program>;
  execParsedIx: ExecParsedIxFn;
  execPartiallyDecodedIx: ExecPartiallyDecodedIxFn;
  execEvent: ExecEventFn;
  txnsTable: TxnsTable;
  db: Db;
  logger: Logger;
};

export class BaseIndexer {
  provider: anchor.Provider;
  pubKey: anchor.web3.PublicKey;
  programs: Map<string, anchor.Program>;
  execParsedIx: ExecParsedIxFn;
  execPartiallyDecodedIx: ExecPartiallyDecodedIxFn;
  execEvent: ExecEventFn;
  txnsTable: TxnsTable;
  db: Db;
  logger: Logger;

  constructor({
    provider,
    pubKey,
    programs,
    execParsedIx,
    execPartiallyDecodedIx,
    execEvent,
    txnsTable,
    db,
    logger,
  }: BaseIndexerOptions) {
    this.provider = provider;
    this.pubKey = pubKey;
    this.programs = programs;
    this.execParsedIx = execParsedIx;
    this.execPartiallyDecodedIx = execPartiallyDecodedIx;
    this.execEvent = execEvent;
    this.txnsTable = txnsTable;
    this.db = db;
    this.logger = logger;
  }
}
