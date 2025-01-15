use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::*;

#[derive(Accounts)]
pub struct SetStore<'info> {
    #[account(
        mut,
        seeds = [ExampleStore::SEED.as_bytes()],
        bump,
    )]
    pub store: Account<'info, ExampleStore>,

    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn set_store(ctx: Context<SetStore>, timestamp: i64) -> Result<()> {
    require!(timestamp > 0, ErrorCode::InvalidTimestamp);

    let store = &mut ctx.accounts.store;
    store.timestamp = timestamp;
    Ok(())
}
