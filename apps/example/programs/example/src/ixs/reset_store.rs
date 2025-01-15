use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct ResetStore<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<ExampleStore>(),
        seeds = [ExampleStore::SEED.as_bytes()],
        bump,
    )]
    pub store: Box<Account<'info, ExampleStore>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn reset_store(ctx: Context<ResetStore>) -> Result<()> {
    let store = &mut ctx.accounts.store;
    store.timestamp = Clock::get()?.unix_timestamp;

    emit!(StoreReset {
        timestamp: store.timestamp,
    });

    Ok(())
}

#[event]
pub struct StoreReset {
    pub timestamp: i64,
}
