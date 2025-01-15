import * as anchor from '@coral-xyz/anchor';
import { drizzle } from 'drizzle-orm/postgres-js';

import { createTxnsTableSchema } from './db';
import { noopLogger } from './utils';

export type Db = ReturnType<typeof drizzle>;
export type TxnsTable = ReturnType<typeof createTxnsTableSchema>;
export type Logger = typeof noopLogger;

export type InputProgramParsedIx = {
  parsed: string;
  programId: string;
};

export type InputProgramParsedIxs = InputProgramParsedIx[];

export type InputProgramPartiallyDecodedIx = {
  data: string;
  accounts: string[];
  programId: string;
};

export type InputProgramPartiallyDecodedIxs = InputProgramPartiallyDecodedIx[];

export type InputProgramEvent = {
  programId: string;
  logs: string[];
};

export type InputProgramEvents = InputProgramEvent[];

export type DecodedProgramParsedIx = InputProgramParsedIx;

export type DecodedProgramParsedIxs = DecodedProgramPartiallyDecodedIx[];

export type DecodedProgramPartiallyDecodedIx = anchor.Instruction & {
  namedAccounts: Record<string, anchor.web3.PublicKey>;
  remainingAccounts: anchor.web3.PublicKey[];
  programId: string;
};

export type DecodedProgramPartiallyDecodedIxs =
  DecodedProgramPartiallyDecodedIx[];

export type DecodedProgramEvent = {
  data: Record<string, any>;
  name: string;
  programId: string;
};

export type DecodedProgramEvents = DecodedProgramEvent[];

export enum TxnProcessState {
  Unprocessed = 0,
  ReadyForParsing,
  Unparseable,
  Parsed,
}

export type ExecParsedIxFn = (opts: ExecParsedIxFnOpts) => Promise<void>;

export type ExecParsedIxFnOpts = {
  ix: DecodedProgramParsedIx;
  blockTime: number;
  slot: number;
  signature: string;
};

export type ExecPartiallyDecodedIxFn = (
  opts: ExecPartiallyDecodedIxFnOpts
) => Promise<void>;

export type ExecPartiallyDecodedIxFnOpts = {
  ix: DecodedProgramPartiallyDecodedIx;
  blockTime: number;
  slot: number;
  signature: string;
};

export type ExecEventFn = (opts: ExecEventFnOpts) => Promise<void>;

export type ExecEventFnOpts = {
  event: DecodedProgramEvent;
  blockTime: number;
  slot: number;
  signature: string;
};
