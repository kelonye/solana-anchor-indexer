import * as anchor from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

import { Indexer } from '@/lib/indexer';
import { sleep } from '@/lib/promise';
import { Example } from '@/assets/example-types';
import { getProvider } from '@/lib/provider';

const JOB_DELAY = 1000 * 1;

main()
  .then(() => {
    console.log('done ✅');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

export async function main() {
  const program = anchor.workspace.Example as anchor.Program<Example>;
  const payer = NodeWallet.local().payer;
  const provider = getProvider({
    payer,
  });

  const index = await Indexer.new({
    provider,
    program,
  });

  await index();

  const queue: number[] = [];
  provider.connection.onLogs(program.programId, async (logs, ctx) => {
    console.log({
      logs,
      ctx,
    });
    queue.push(0);
  });

  setInterval(() => {
    queue.push(0);
  }, 10_000);

  while (true) {
    if (queue.length > 0) {
      try {
        await index();
      } catch (err) {
        console.error(err);
      }
      queue.shift();
    } else {
      console.log('no logs to process');
    }
    await sleep(JOB_DELAY);
  }
}
