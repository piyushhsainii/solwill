use anchor_lang::{ prelude::*, system_program::{self, Transfer}};
use anchor_spl::{associated_token::AssociatedToken, token::{TransferChecked, transfer_checked}, token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{states::{SPLTOKENS, Vault, WillAccount}, error::Errors};
use crate::Errors::{LowBalance,Accounts_Not_Provided,Unauthorised_Depositor};


#[derive(Accounts)]
pub struct DepositSpl<'info> {
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
    mint:InterfaceAccount<'info, Mint>,
     #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program
    )]
    // owner's ata acc
    owner_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer=owner,
        associated_token::mint = mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    vault_ata:InterfaceAccount<'info, TokenAccount>,
    system_program:Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
    associated_token_program :Program<'info, AssociatedToken>

}

//deposit — owner transfers SOL or SPL tokens into vault. Status Draft → Active on first deposit. For SPL: creates ATA owned by vault PDA, transfers tokens in. 

pub fn depositSpl(ctx:Context<DepositSpl>, amount:u64) -> Result<()> {

    require!(amount > 0, Errors::LowBalance);
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);
    // ix to do spl transfer token
    let ix = CpiContext::new(ctx.accounts.token_program.to_account_info(), TransferChecked {
        from: ctx.accounts.owner_ata.to_account_info(),
        to:ctx.accounts.vault_ata.to_account_info(),
        authority:ctx.accounts.owner.to_account_info(),
        mint:ctx.accounts.mint.to_account_info()
    });
    
    transfer_checked(ix,amount,ctx.accounts.mint.decimals)?;
    
    let  mint_val =  ctx.accounts.will_account.assets.iter_mut().find(|data|  data.mint == ctx.accounts.mint.key());  
    
    match mint_val {
        Some(val) => { 
            val.balance = val.balance.checked_add(amount).ok_or(Errors::Math_Error)?;
        },
        None => { 
            require!(ctx.accounts.will_account.assets.len() < 5, Errors::TooManyAssets);
            ctx.accounts.will_account.assets.push(SPLTOKENS {  mint:ctx.accounts.mint.key(), balance: amount })
        }
    }
    Ok(())
}
