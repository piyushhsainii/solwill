
use anchor_lang::{Result, prelude::*};
use anchor_spl::{  token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked,CloseAccount, close_account}};
use crate::{error::Errors, states::{SPLTOKENS, Vault, WillAccount}};



#[derive(Accounts,)]
pub struct WithdrawSPL<'info> {
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
        associated_token::mint = vault_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    owner_ata:InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref() ],
        bump
    )]
    vault:Account<'info, Vault>,
    vault_mint:InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = vault_mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program,

    )]
    vault_ata: InterfaceAccount<'info, TokenAccount>,
    system_program:Program<'info, System>,
    token_program:Interface<'info, TokenInterface>

}

pub fn withdraw_spl(ctx:Context<WithdrawSPL>, amt:u64) -> Result<()> {

    require!(amt > 0, Errors::LowBalance);
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);
    require!(ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(), Errors::Unauthorised_Depositor);
    let exisiting_assets = ctx.accounts.will_account.assets.clone();

    // check if the passed mint is actually present in the will
    require!(exisiting_assets.iter().any(|data| data.mint == ctx.accounts.vault_mint.key()), Errors::VaultATAInvalid);
    
    // transfer the sol back to the will owner
    let will_key = ctx.accounts.will_account.key();
    let signer_seeds:&[&[&[u8]]] = &[&[b"vault", will_key.as_ref(), &[ctx.bumps.vault]]];

    // transfer the spl tokens back to the will owner
    let cpi_ctx= CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    TransferChecked {
            from:ctx.accounts.vault_ata.to_account_info(),
            to:ctx.accounts.owner_ata.to_account_info(),
            authority:ctx.accounts.vault.to_account_info(),
            mint:ctx.accounts.vault_mint.to_account_info()
        },
         signer_seeds
    );
    transfer_checked(cpi_ctx, amt , ctx.accounts.vault_mint.decimals)?;

    // update the total sol balance in the will account struct
    let asset = ctx.accounts.will_account.assets.iter_mut().find(|data| data.mint == ctx.accounts.vault_mint.key()).ok_or(Errors::VaultATAInvalid)?;
   
   let updated_balance = asset.balance.checked_sub(amt ).ok_or(Errors::Math_Error)?;
    asset.balance = updated_balance;

    if updated_balance == 0 {
        // remove it from the assets and close the spl token account
       ctx.accounts.will_account.assets =  ctx.accounts.will_account.assets.iter().filter(|data | data.mint != ctx.accounts.vault_mint.key()).map(|d| SPLTOKENS { balance:d.balance, mint:d.mint, decimals:d.decimals }).collect();

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account:ctx.accounts.vault_ata.to_account_info(),
                authority:ctx.accounts.vault.to_account_info(),
                destination:ctx.accounts.signer.to_account_info()
            },
            signer_seeds
        );
        close_account(cpi_ctx)?;
    }


    Ok(())
}