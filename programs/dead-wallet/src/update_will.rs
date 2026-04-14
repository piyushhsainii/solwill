
use anchor_lang::{prelude::*, Result};
use crate::{error::Errors, states::{Vault, WillAccount}};


#[derive(Accounts,)]
pub struct UpdateWill<'info> {
    #[account(mut)]
    signer:Signer<'info>,
    #[account(
        mut,
        seeds=[b"will" , signer.key().as_ref() ],
        bump

    )]
    will_account:Account<'info, WillAccount>,
    #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref() ],
        bump

    )]
    master_vault:Account<'info, Vault>,
    system_program:Program<'info, System>

}

pub fn update_will(ctx:Context<UpdateWill>, interval:i64) -> Result<()> {

    // Check if new interval does not actually expire the will
    let deadline = ctx.accounts.will_account.interval + ctx.accounts.will_account.last_check_in;
    let current_time = Clock::get()?.unix_timestamp; 

    require!(ctx.accounts.will_account.owner == ctx.accounts.signer.key(), Errors::Owner_Not_Valid);
    // check if deadline has not passed
    require!( deadline > current_time , Errors::WillDeadlinePassed);

    // if new interval does not trigger the will
    let remaining_elapsed_time = current_time -  ctx.accounts.will_account.last_check_in;
    require!(interval > remaining_elapsed_time ,Errors::WillDeadlinePassed);

    // set the new interval safely.
    ctx.accounts.will_account.interval = interval;

    
    Ok(())
}