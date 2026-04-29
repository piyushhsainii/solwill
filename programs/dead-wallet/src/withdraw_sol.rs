use anchor_lang::{Result, prelude::*};
use crate::{error::Errors, states::{Vault, WillAccount}};

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"will", signer.key().as_ref()],
        bump
    )]
    will_account: Account<'info, WillAccount>,
    #[account(
        mut,
        seeds = [b"vault", will_account.key().as_ref()],
        bump
    )]
    vault: Account<'info, Vault>,
}

pub fn withdraw_sol(ctx: Context<WithdrawSol>, amt: u64) -> Result<()> {

    // ── Basic guards ──────────────────────────────────────────────────────────
    require!(amt > 0, Errors::LowBalance);
    require!(!ctx.accounts.will_account.claimed, Errors::Will_Already_Claimed);
    require!(
        ctx.accounts.signer.key() == ctx.accounts.will_account.owner.key(),
        Errors::Unauthorised_Depositor
    );

    // ── Deadline check ────────────────────────────────────────────────────────
    let now = Clock::get()?.unix_timestamp;
    let deadline = ctx.accounts.will_account.last_check_in
        .checked_add(ctx.accounts.will_account.interval)
        .ok_or(Errors::Math_Error)?;
    require!(deadline > now, Errors::WillDeadlinePassed);

    // ── Rent-exemption guard ──────────────────────────────────────────────────
    // Derive how many lamports are withdrawable without breaking rent-exemption.
    // The vault must always keep `rent_minimum` lamports or the runtime will
    // garbage-collect the account and wipe all its data.
    let vault_info    = ctx.accounts.vault.to_account_info();
    let vault_lamports = vault_info.lamports();
    let rent_minimum  = Rent::get()?.minimum_balance(vault_info.data_len());
    let withdrawable  = vault_lamports
        .checked_sub(rent_minimum)
        .ok_or(Errors::LowBalance)?; // vault is already below rent floor

    require!(amt <= withdrawable, Errors::LowBalance);

    // ── Direct lamport transfer ───────────────────────────────────────────────
    // System Program CPI rejects transfers from accounts that carry data
    // ("from must not carry data"), so we manipulate lamports directly instead.
    // The rent guard above ensures the vault stays rent-exempt after this.
    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amt;
    **ctx.accounts.signer.to_account_info().try_borrow_mut_lamports()? += amt;

    // ── Update tracked balance ────────────────────────────────────────────────
    ctx.accounts.will_account.total_bal = ctx.accounts.will_account.total_bal
        .checked_sub(amt as u32)
        .ok_or(Errors::Math_Error)?;

    Ok(())
}