use anchor_lang::{prelude::*, system_program::{self}};
use anchor_spl::{ associated_token::{self, AssociatedToken}, token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked }};

use crate::{error::Errors, states::{Heir, HeirStatus, Vault, WillAccount}};


#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    signer:Signer<'info>,
    will_account_address:SystemAccount<'info>,
    #[account(
    mut,
    seeds=[b"will" , will_account_address.key().as_ref() ],
    bump
    )]
    will_account:Account<'info, WillAccount>,
    #[account(
        mut,
        seeds=[b"heir", heir_account_address.key().as_ref(), will_account.key().as_ref() ],
        bump
    )]
    heir_account:Account<'info, Heir>,
    #[account(mut)]
    heir_account_address:SystemAccount<'info>,
    #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref()],
        bump
    )]
    vault_account:Account<'info, Vault>,
    system_program:Program<'info, System>,
    associated_token_program:Program<'info, AssociatedToken>
}


pub fn claim<'info>(ctx:Context<'_, '_, 'info, 'info, Claim<'info>>) -> Result<()> {
    // check if deadline has passed
    let current_time = Clock::get()?.unix_timestamp;
    let will_account = ctx.accounts.will_account.clone();
    let heir_account = ctx.accounts.heir_account.clone();
    let assets = ctx.accounts.will_account.assets.clone();
    let program = ctx.accounts.system_program.to_account_info().clone();
    let accounts = ctx.remaining_accounts;
    require!(current_time > will_account.last_check_in + will_account.interval, Errors::Will_Active);

    //check to ensure that will is not already Claimed
    require!(will_account.claimed != true, Errors::Will_Already_Claimed);
    require!(heir_account.status == HeirStatus::Active, Errors::Will_Already_Claimed);

    // check if given heir_account_address matches the one stored in config of heir account
    require!(heir_account.wallet_address == ctx.accounts.heir_account_address.key(), Errors::Heir_Not_Valid);

    let will_account_key = will_account.key();
    let seeds:&[&[&[u8]]] = &[&[b"vault", will_account_key.as_ref(), &[ctx.bumps.vault_account]]];
    let vault =  &ctx.accounts.vault_account;
    
    let sol_amount = vault.sol_balance.checked_mul(heir_account.bps as u64).ok_or(Errors::Math_Error)?.checked_div(10000).ok_or(Errors::Math_Error)?;
    require!(sol_amount > 0, Errors::Math_Error);
    // transfer the sol amount to the heir

    let ix = CpiContext::new_with_signer(program,
    system_program::Transfer {
        from: vault.to_account_info(),
        to: ctx.accounts.heir_account_address.to_account_info()
    },
    seeds
    );
    system_program::transfer(ix, sol_amount)?;  

    ctx.accounts.heir_account.status = HeirStatus::Claimed;

    // handle spl tokens transfer
    // ensures
   require!(assets.len() * 4 == accounts.len(), Errors::ClaimFundsAccountsNotValid);
require!(accounts.len() % 4 == 0, Errors::ClaimFundsAccountsNotValid);

let mut i = 0;
let mut processed_mints: Vec<Pubkey> = Vec::new();
let wallet_key = will_account.key();
let signer_seeds: &[&[&[u8]]] = &[&[b"vault", wallet_key.as_ref(), &[ctx.bumps.vault_account]]];

while i < accounts.len() {
    let vault_ata  = &accounts[i];
    let heir_ata   = &accounts[i + 1];
    let vault_mint = &accounts[i + 2];
    let token_prog = &accounts[i + 3]; // 

    require!(
        token_prog.key() == anchor_spl::token::ID
            || token_prog.key() == anchor_spl::token_2022::ID,
        Errors::InvalidTokenProgram
    );
    require!(vault_ata.owner == &token_prog.key(), Errors::InvalidTokenProgram);

    let vault_data      = InterfaceAccount::<TokenAccount>::try_from(vault_ata)?;
    let vault_mint_info = InterfaceAccount::<Mint>::try_from(vault_mint)?;

    require!(!processed_mints.contains(&vault_mint.key()), Errors::MintAccountNotValid);
    require!(assets.iter().any(|data| data.mint == vault_data.mint), Errors::MintAccountNotValid);
    require!(vault_data.mint == vault_mint.key(), Errors::MintAccountNotValid);
    require!(!vault_ata.data_is_empty(), Errors::VaultATAInvalid);

    if heir_ata.data_is_empty() {
        let cpi_accounts = associated_token::Create {
            associated_token: heir_ata.to_account_info(),
            authority: ctx.accounts.heir_account_address.to_account_info(),
            mint: vault_mint.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: token_prog.to_account_info(), // ✅
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            cpi_accounts
        );
        associated_token::create(cpi_ctx)?;
    }

    let total_spl_balance = assets.iter().find(|data| data.mint == vault_data.mint).ok_or(Errors::MintAccountNotValid)?;
    let user_share = total_spl_balance.balance
        .checked_mul(ctx.accounts.heir_account.bps as u64).ok_or(Errors::Math_Error)?
        .checked_div(10000).ok_or(Errors::Math_Error)?;
    require!(user_share > 0, Errors::Math_Error);

    let spl_token_ix = CpiContext::new_with_signer(
        token_prog.to_account_info(), // ✅
        TransferChecked {
            from:      vault_ata.to_account_info(),
            to:        heir_ata.to_account_info(),
            authority: ctx.accounts.vault_account.to_account_info(),
            mint:      vault_mint.to_account_info(),
        },
        signer_seeds,
    );
    transfer_checked(spl_token_ix, user_share, vault_mint_info.decimals)?;
    processed_mints.push(vault_mint.key());
    i += 4; // ✅
} 
    Ok(())
}