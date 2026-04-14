use anchor_lang::prelude::*;

mod states;
mod initialize;
mod deposit_sol;
mod deposit_spl;
mod add_heir;
mod update_heir;
mod checkin;
mod claim_funds;
mod dissolve;
mod update_will;
mod error;
mod removeheir;
mod withdraw_sol;
mod withdraw_spl;

use states::*;
use initialize::*;
use deposit_sol::*;
use deposit_spl::*;
use add_heir::*;
use update_heir::*;
use checkin::*;
use claim_funds::*;
use dissolve::*;
use update_will::*;
use removeheir::*;
use withdraw_sol::*;
use withdraw_spl::*;

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

