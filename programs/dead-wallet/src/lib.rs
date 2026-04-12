use anchor_lang::prelude::*;

mod accountdata;
use accountdata::*;

mod initialize;
use initialize::*;

mod deposit_sol;
use deposit_sol::*;

mod deposit_spl;
use deposit_spl::*;

mod add_heir;
use add_heir::*;

mod update_heir;
use update_heir::*;

mod checkin;
use checkin::*;

mod claim_funds;
use claim_funds::*;

mod dissolve;
use dissolve::*;

pub mod error;
use error::*;

declare_id!("Mxa8zNFzuZdNAcoRuJDXMD5XccdmJrarcAyrW24DuQa");

#[program]
pub mod dead_wallet {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

