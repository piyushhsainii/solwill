use anchor_lang::{prelude::{ *},  system_program::{self, Transfer} };
use anchor_spl::{associated_token::{get_associated_token_address, spl_associated_token_account}, token::{TransferChecked, transfer_checked}, token_interface::{CloseAccount, Mint, TokenAccount, TokenInterface, Transfer as TokenTransfer}};

use crate::{Heir, error::Errors, states::{Vault, WillAccount}};


#[derive(Accounts)]
pub struct Dissolve<'info> {
    #[account(mut)]
    signer:Signer<'info>,
    #[account(
        mut,
        seeds=[b"will" , signer.key().as_ref()],
        bump,
        close=signer
    )]
    will_account:Account<'info, WillAccount>,
    #[account(
        mut,
        seeds=[b"vault" , will_account.key().as_ref()],
        bump,
        close=signer
    )]
    vault:Account<'info, Vault>,
    system_program:Program<'info,System>,
    token_program:Interface<'info, TokenInterface>
}


pub fn dissolve<'info>(ctx: Context<'_, '_, 'info, 'info, Dissolve<'info>>) -> Result<()> {
    // ensure that signer is the will account owner
    // ensure that will account is Active
    // ensure the passed accounts
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in + ctx.accounts.will_account.interval;
    require!(deadline > now, Errors::WillDeadlinePassed);

    // transfer back the sol to the will account owner
    let assets = ctx.accounts.will_account.assets.clone();
    let vault_info = ctx.accounts.vault.clone();
    let will_account = ctx.accounts.will_account.clone();
    let token_program = ctx.accounts.token_program.clone();
    let will_key = will_account.key().clone();
    let signer_seeds: &[&[&[u8]]] = &[&[b"vault", will_key.as_ref(), &[ctx.bumps.vault]]];
    let lamports = ctx.accounts.vault.get_lamports();
    let signer = ctx.accounts.signer.clone();
    let system_program = ctx.accounts.system_program.clone();
    let accounts = ctx.remaining_accounts;
    
    require!(signer.key() == will_account.owner, Errors::Owner_Not_Valid);
    require!(will_account.claimed == false, Errors::Will_Already_Claimed);
    require!(((will_account.assets.len() * 3 ) + will_account.heir_count as usize) == accounts.len(), Errors::DissolveFundsAccountsNotValid);
    
    let mut dissolved_accounts = vec![];
    let mut i  = 0;
    
    let heir_start = will_account.assets.len() * 3;

    while i < heir_start {
        
        let vault_ata = &accounts[i];
        let owner_ata = &accounts[i + 1];
        let vault_mint      = &accounts[i + 2];
        let vault_ata_data = InterfaceAccount::<TokenAccount>::try_from(vault_ata)?;
        let mint_data = InterfaceAccount::<Mint>::try_from(vault_mint)?;
        // checks if mint is present in assets
        require!(assets.iter().any(|data| data.mint == vault_mint.key()), Errors::DissolveFundsAccountsNotValid);
        // stops double mint passed
        require!(!dissolved_accounts.contains(&vault_mint.key()), Errors::MintAccountNotValid);
        require!(vault_ata_data.mint == vault_mint.key(),Errors::MintAccountNotValid);
        
        // Derive ATA manually with the correct token program
       let associated_token_program_id = anchor_spl::associated_token::ID;
       let expected = Pubkey::find_program_address(
            &[
                signer.key().as_ref(),
                vault_mint.owner.as_ref(),   // ← token program (works for both Token and Token-2022)
                vault_mint.key().as_ref(),
            ],
            &associated_token_program_id,
        ).0;

        require!(owner_ata.key() == expected, Errors::OwnerATANotCorrect);
        // transfer back from each vault_ata 
        let cpi_ctx = CpiContext::new_with_signer(
            token_program.to_account_info().clone(), 
            TransferChecked {
                from:vault_ata.to_account_info().clone(),
                to:owner_ata.to_account_info().clone(),
                authority:vault_info.to_account_info().clone(),
                mint:vault_mint.to_account_info().clone()

            },
            signer_seeds
        );

       transfer_checked(cpi_ctx,vault_ata_data.amount,mint_data.decimals)?;
        
        // close the vault ATA
        let close_ctx = CpiContext::new_with_signer(token_program.to_account_info().clone(),
        CloseAccount {
            account:vault_ata.to_account_info().clone(),
            authority:vault_info.to_account_info().clone(),
            destination:signer.to_account_info().clone()
        },
        signer_seeds);
        anchor_spl::token_interface::close_account(close_ctx)?;

       msg!("Transfered SPL Token back to Will Owner Account");
       dissolved_accounts.push(vault_mint.key());
       i +=3;
    }

    // Close all the heir accounts

   for i in heir_start..accounts.len() {
    let heir_account = &accounts[i];
    let heir_data = Account::<Heir>::try_from(heir_account)?;
    
    let (expected_pda, _) = Pubkey::find_program_address(
        &[b"heir", heir_data.wallet_address.as_ref(), will_key.as_ref()],
        ctx.program_id
    );
    
    require!(heir_account.key() == expected_pda, Errors::InvalidHeirAccount);

    let lamports = heir_account.lamports();
    **heir_account.try_borrow_mut_lamports()? -= lamports;
    **signer.to_account_info().try_borrow_mut_lamports()? += lamports;

    let mut data = heir_account.try_borrow_mut_data()?;
    data.fill(0);
}


    Ok(())
}