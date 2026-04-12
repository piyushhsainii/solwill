use anchor_lang::{prelude::*, system_program::{self, transfer}};
use anchor_spl::{ associated_token::{self, AssociatedToken}, token::Transfer, token_interface::{TokenAccount, TokenInterface}};

use crate::{accountdata::{Heir, HeirStatus, Vault, WillAccount}, error::Errors};

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
    token_program:Interface<'info, TokenInterface>,
    associated_token_program:Program<'info, AssociatedToken>
}


pub fn claim(ctx:Context<Claim>, assets:Vec<Pubkey>) -> Result<()> {
    // check if deadline has passed
    let current_time = Clock::get()?.unix_timestamp;
    require!(current_time > ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval, Errors::Will_Active);

    //check to ensure that will is not already Claimed
    require!(ctx.accounts.will_account.claimed != true, Errors::Will_Already_Claimed);
    require!(ctx.accounts.heir_account.status == HeirStatus::Active, Errors::Will_Already_Claimed);

    // check if given heir_account_address matches the one stored in config of heir account
    require!(ctx.accounts.heir_account.wallet_address == ctx.accounts.heir_account_address.key(), Errors::Heir_Not_Valid);

    let will_account =ctx.accounts.will_account.key();
    let seeds:&[&[&[u8]]] = &[&[b"vault", will_account.as_ref(), &[ctx.bumps.vault_account]]];
    let vault =  &ctx.accounts.vault_account;
    
    let sol_amount = vault.sol_balance.checked_mul(ctx.accounts.heir_account.bps as u64).ok_or(Errors::Math_Error)?.checked_div(10000).ok_or(Errors::Math_Error)?;

    let program = ctx.accounts.system_program.to_account_info();
    // transfer the sol amount to the heir

    let ix = CpiContext::new_with_signer(program,
    system_program::Transfer {
        from: vault.to_account_info(),
        to: ctx.accounts.heir_account_address.to_account_info()
    },
    seeds
    );
    system_program::transfer(ix, sol_amount)?;  

    ctx.accounts.heir_account.status = crate::accountdata::HeirStatus::Claimed;

    // handle spl tokens transfer
    let assets = &ctx.accounts.will_account.assets;
    let accounts = ctx.remaining_accounts;
    // ensures
    require!(assets.len() * 3 == accounts.len(), Errors::ClaimFundsAccountsNotValid);
    require!(accounts.len() % 3 == 0, Errors::ClaimFundsAccountsNotValid);
    let mut i = 0;
    let mut processed_mints: Vec<Pubkey> = Vec::new();

    while i < accounts.len() {
        let vault_ata = &accounts[i];
        let heir_ata = &accounts[i + 1];
        let vault_mint      = &accounts[i + 2];
        let vault_data = InterfaceAccount::<TokenAccount>::try_from(&vault_ata)?;

        // ensures mint is not passed twice
        require!(
            !processed_mints.contains(&vault_mint.key()),
            Errors::MintAccountNotValid
        );
        // ensure vault mint is present in assets
        require!(assets.iter().any(|data| data.mint == vault_data.mint), Errors::MintAccountNotValid);
        // ensure mint matches vault ata mint
        require!(vault_data.mint == vault_mint.key(), Errors::MintAccountNotValid);

        // check if heir ata is created or not
        require!(!vault_ata.data_is_empty(), Errors::VaultATAInvalid);

        // create heir ata if not already present
        if(heir_ata.data_is_empty()) {

            let cpi_context = ctx.accounts.associated_token_program.to_account_info();

            let cpi_accounts= associated_token::Create {
                associated_token: heir_ata.to_account_info(),
                authority:ctx.accounts.heir_account.to_account_info(),
                mint:vault_mint.to_account_info(),
                payer:ctx.accounts.signer.to_account_info(),
                system_program:ctx.accounts.system_program.to_account_info(),
                token_program:ctx.accounts.token_program.to_account_info()
            };
            let cpi_ctx = CpiContext::new(cpi_context,cpi_accounts);
            
            associated_token::create(cpi_ctx)?;

        }

        let signer_seeds:&[&[&[u8]]] = &[&[b"vault", ctx.accounts.will_account.key().as_ref(),&[ctx.bumps.vault_account]], ];

        let total_spl_balance = assets.iter().find(|data| data.mint == vault_data.mint).ok_or(Errors::MintAccountNotValid)?;
        // calcualting heir share balance
        let user_share = total_spl_balance.balance.checked_mul(ctx.accounts.heir_account.bps as u64)?.checked_div(10000).ok_or(Errors::Math_Error)?;;

        // transfer spl token from vault ata
           let spl_token_ix = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), 
           Transfer {
                from:vault_ata.to_account_info(),
                to:heir_ata.to_account_info(),
               authority:ctx.accounts.vault_account.to_account_info()
            },
            signer_seeds
        );

        anchor_spl::token::transfer(spl_token_ix, user_share)?;
        processed_mints.push(vault_mint.key());
        i+=3;
    }
    
    Ok(())
}