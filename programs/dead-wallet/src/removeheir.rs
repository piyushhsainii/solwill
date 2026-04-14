use anchor_lang::{Accounts, Result, prelude::{*}};
use crate::{error::Errors::{self, Owner_Not_Valid}, states::{ Heir, WillAccount}};

#[derive(Accounts)]
pub struct RemoveHeir<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    heir_original_address:SystemAccount<'info>,
    #[account(
        mut,
        seeds=[b"heir", heir_original_address.key().as_ref(), will_account.key().as_ref() ],
        bump,
        close = signer
    )]
    heir_account:Account<'info,Heir>,
     #[account(
        mut,
        seeds=[b"will" , signer.key().as_ref() ],
        bump
    )]
    will_account:Account<'info, WillAccount>,
    #[account(mut)]
    new_heir_address:SystemAccount<'info>,
    system_program:Program<'info, System>
}


pub fn remove_heir(ctx:Context<RemoveHeir>) -> Result<()> {

    // ensure only will account can remove that
    require!(ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(), Errors::Owner_Not_Valid);
    require!(ctx.accounts.will_account.claimed == false, Errors::Will_Already_Claimed);
      // Check will is still active by time
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);

    // heir_account
    ctx.accounts.will_account.heir_count = ctx.accounts.will_account.heir_count - 1;
    // update total bps after removing heirs
    ctx.accounts.will_account.total_bps = ctx.accounts.will_account.total_bps.checked_sub(ctx.accounts.heir_account.bps).ok_or(Errors::Math_Error)?;


    Ok(())
}