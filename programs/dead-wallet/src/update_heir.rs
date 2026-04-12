use anchor_lang::{Accounts, Result, prelude::{*}};

use crate::{accountdata::{ Heir, WillAccount}, error::Errors};


#[derive(Accounts)]
pub struct UpdateHeir<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds=[b"heir", heir_original_address.key().as_ref(), will_account.key().as_ref() ],
        bump
    )]
    heir_account:Account<'info,Heir>,
     #[account(
        mut,
        seeds=[b"will" , signer.key().as_ref() ],
        bump
    )]
    will_account:Account<'info, WillAccount>,
    #[account(mut)]
    heir_original_address:SystemAccount<'info>,
    #[account(mut)]
    new_heir_address:SystemAccount<'info>,
    system_program:Program<'info, System>

}


pub fn update_heir(ctx:Context<UpdateHeir>, updated_bps:u32,) -> Result<()> {

    let new_bps = ctx.accounts.will_account
    .total_bps.checked_sub(ctx.accounts.heir_account.bps).ok_or(Errors::BPS_OVERFLOW)?.checked_add(updated_bps).ok_or(Errors::BPS_OVERFLOW)?;

    require!(10000 >= new_bps, Errors::BPS_NOT_INVALID);
    require!(ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(), Errors::Owner_Not_Valid);
    require!(ctx.accounts.will_account.claimed  != true,  Errors::Will_Already_Claimed);
    require!(ctx.accounts.will_account.heir_count < 4, Errors::HeirMaxLimitReached);    

    // update total bps in will account
    ctx.accounts.will_account.total_bps = new_bps; 

    // set heir acc details 
    ctx.accounts.heir_account.bps = updated_bps;
    ctx.accounts.heir_account.wallet_address = ctx.accounts.new_heir_address.key();

    Ok(())
}