use anchor_lang::prelude::*;

pub mod error;
pub mod ixs;
pub mod state;
use crate::ixs::*;

declare_id!("6mSByxsNqCRHXHuPmJdsgArE9uESE98YR6fREFomvJrv");

#[program]
pub mod example {
    use super::*;

    pub fn reset_store(ctx: Context<ResetStore>) -> Result<()> {
        ixs::reset_store(ctx)
    }

    pub fn set_store(ctx: Context<SetStore>, timestamp: i64) -> Result<()> {
        ixs::set_store(ctx, timestamp)
    }
}
