import * as anchor from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

export const COMMITMENT = 'confirmed';

/**
 * Creates and configures an Anchor provider with specified commitment levels.
 */
export function getProvider({
  payer,
  commitment = COMMITMENT,
}: {
  payer: anchor.web3.Keypair;
  commitment?: anchor.web3.Commitment;
}) {
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(process.env.RPC_URL!, commitment),
    new NodeWallet(payer),
    {
      commitment,
      preflightCommitment: commitment,
    }
  );
  anchor.setProvider(provider);
  return provider;
}
