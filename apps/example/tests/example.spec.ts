import { expect } from '@jest/globals';
import * as anchor from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

import { Example } from '@/assets/example-types';
import { Indexer } from '@/lib/indexer';
import { db, disconnect } from '@/db';
import * as schema from '@/db/schema';
import { COMMITMENT, getProvider } from '@/lib/provider';

describe('example', () => {
  const program = anchor.workspace.Example as anchor.Program<Example>;
  const payer = NodeWallet.local().payer;
  const provider = getProvider({
    payer,
  });
  let index: () => Promise<void>;
  const storePubKey = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('store')],
    program.programId
  )[0];

  beforeAll(async () => {
    index = await Indexer.new({
      provider,
      program,
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  it('resets the store', async () => {
    const tx = await program.methods
      .resetStore()
      .accountsStrict({
        store: storePubKey,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .transaction();

    await completeAndSendTx({
      provider,
      tx,
      payer,
    });

    await index();

    const stores = await db.select().from(schema.store).execute();
    expect(stores.length).toBe(1);
    const store = stores[0];
    expect(store.timestamp).toBe(0);

    expect(store.publicKey).toBe(storePubKey.toBase58());
  });

  it('sets the store', async () => {
    const timestamp = 1234567890;

    const tx = await program.methods
      .setStore(new anchor.BN(timestamp))
      .accountsStrict({
        store: storePubKey,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    await completeAndSendTx({
      provider,
      tx,
      payer,
    });

    await index();

    const stores = await db.select().from(schema.store).execute();
    expect(stores.length).toBe(1);
    const store = stores[0];
    expect(store.timestamp).toBe(timestamp);

    expect(store.publicKey).toBe(storePubKey.toBase58());
  });
});

/**
 * Completes and sends a transaction with 'confirmed' commitment level.
 * Required when calling getSignaturesForAddress which only accepts 'confirmed' or 'finalized'.
 */
async function completeAndSendTx({
  provider,
  tx,
  payer,
}: {
  provider: anchor.AnchorProvider;
  tx: anchor.web3.Transaction;
  payer: anchor.web3.Keypair;
}) {
  // add the latest blockhash to the transaction
  const latestBlockhash =
    await provider.connection.getLatestBlockhash(COMMITMENT);
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

  // sign the transaction
  tx.sign(payer);

  // send the transaction
  const signature = await provider.connection.sendRawTransaction(
    tx.serialize()
  );

  // confirm the transaction
  await provider.connection.confirmTransaction(
    {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature,
    },
    COMMITMENT
  );
}
