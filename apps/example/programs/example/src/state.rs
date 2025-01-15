use anchor_lang::prelude::*;

#[account]
pub struct ExampleStore {
    pub timestamp: i64,
}

impl ExampleStore {
    pub const SEED: &'static str = "store";
}
