
use anchor_lang::{Result, prelude::*, system_program::{Transfer, transfer}};
use crate::{error::Errors, states::{Vault, WillAccount}};



#[derive(Accounts,)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    signer:Signer<'info>,
    #[account(
        mut,
        seeds=[b"will", signer.key().as_ref() ],
        bump
    )]
    will_account:Account<'info,WillAccount>,
   #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref() ],
        bump
    )]
    vault:Account<'info, Vault>,
    system_program:Program<'info, System>

}

pub fn withdraw_sol(ctx:Context<WithdrawSol>, amt:u32) -> Result<()> {

    require!(amt > 0, Errors::LowBalance);
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);
    require!(ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(), Errors::Unauthorised_Depositor);


    require!(ctx.accounts.vault.get_lamports() >= amt as u64, Errors::Math_Error);
    // transfer the sol back to the will owner
    let will_key = ctx.accounts.will_account.key();
    let signer_seeds:&[&[&[u8]]] = &[&[b"vault", will_key.as_ref(), &[ctx.bumps.vault]]];

    let cpi_ctx= CpiContext::new_with_signer(
    ctx.accounts.system_program.to_account_info(),
    Transfer {
            from:ctx.accounts.vault.to_account_info(),
            to:ctx.accounts.signer.to_account_info()
        },
         signer_seeds
    );
    transfer(cpi_ctx, amt as u64)?;
    // update the total sol balance in the will account struct
    ctx.accounts.will_account.total_bal =  ctx.accounts.will_account.total_bal.checked_sub(amt).ok_or(Errors::Math_Error)?;

    Ok(())
}