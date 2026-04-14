use anchor_lang::{Accounts, Result, prelude::{*}};

use crate::{states::{ Heir, WillAccount}, error::Errors};


#[derive(Accounts)]
pub struct AddHeir<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        init,
        payer=signer,
        seeds=[b"heir", heir_original_address.key().as_ref(), will_account.key().as_ref() ],
        space= 8 + Heir::INIT_SPACE,
        bump
    )]
    heir_account:Account<'info,Heir>,
     #[account(
        mut,
        seeds=[b"will" , signer.key().as_ref() ],
        bump
    )]
    will_account:Account<'info, WillAccount>,
    heir_original_address:SystemAccount<'info>,
    system_program:Program<'info, System>

}


pub fn add_heir(ctx:Context<AddHeir>, bps:u32,) -> Result<()> {
    
    require!(ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(), Errors::Owner_Not_Valid);
    require!(ctx.accounts.will_account.claimed != true,  Errors::Will_Already_Claimed);
    require!(bps > 0, Errors::BPS_NOT_INVALID);
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);

    let new_total = ctx.accounts.will_account
    .total_bps
    .checked_add(bps)
    .ok_or(Errors::BPS_OVERFLOW)?;

    require!(new_total <= 10000, Errors::BPS_NOT_INVALID);

    // set heir acc details 
    ctx.accounts.heir_account.set_inner(Heir { 
        bps: bps, 
        owner: ctx.accounts.signer.key(),
        status: crate::states::HeirStatus::Active,
        wallet_address: ctx.accounts.heir_original_address.key(),
        bump: ctx.bumps.heir_account 
    });
    // update total bps in will account
    ctx.accounts.will_account.total_bps = new_total; 
    ctx.accounts.will_account.heir_count = ctx.accounts.will_account.heir_count + 1;

    Ok(())
}