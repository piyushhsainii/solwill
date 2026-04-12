use anchor_lang::{prelude::*};
use crate::Errors::Owner_Not_Valid;
use crate::accountdata::{ WillAccount};
use crate::error::Errors;


#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    owner:Signer<'info>,
    #[account(
        mut,
        seeds=[b"will" , owner.key().as_ref() ],
        bump
    )]
    will_account:Account<'info, WillAccount>,
}

pub fn check_in(ctx:Context<CheckIn>) -> Result<()> {
    
    require!(ctx.accounts.owner.key() == ctx.accounts.will_account.owner.key(), Errors::Owner_Not_Valid);
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);

    ctx.accounts.will_account.last_check_in = Clock::get()?.unix_timestamp;

    Ok(())
}