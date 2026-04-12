use anchor_lang::{Result, prelude::*, system_program};
use anchor_spl::{associated_token::AssociatedToken, token::Transfer, token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{accountdata::{ Vault, WillAccount}, error::Errors};


#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    owner:Signer<'info>,
    #[account(
        mut,
        seeds=[b"will", owner.key.as_ref()],
        bump
    )]
    will_account:Account<'info, WillAccount>,
    #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref() ],
        bump
    )]
    vault:Account<'info, Vault>,
    token_program: Interface<'info, TokenInterface>,
    system_program:Program<'info, System>

}

//deposit — owner transfers SOL or SPL tokens into vault. Status Draft → Active on first deposit. For SPL: creates ATA owned by vault PDA, transfers tokens in. 

pub fn deposit(ctx:Context<DepositSol>, amt:u64) -> Result<()> {

    // check if amount is > than 0.
    require!(amt > 0, Errors::LowBalance);
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);
    // owner has to same as will owner.
    require!(ctx.accounts.owner.key() == ctx.accounts.will_account.owner.key(), Errors::Unauthorised_Depositor);

    let vault = ctx.accounts.vault.to_account_info();
    let sender = ctx.accounts.owner.to_account_info();

    let ix = CpiContext::new(   ctx.accounts.system_program.to_account_info(),    system_program::Transfer { from:sender, to:vault });

    system_program::transfer(ix, amt)?;
    ctx.accounts.will_account.total_bal = ctx.accounts.will_account.total_bal.checked_add(amt as u32).ok_or(Errors::Math_Error)?;
    if ctx.accounts.will_account.has_sol == false {
        ctx.accounts.will_account.has_sol = true;
    }


    Ok(())
}



















