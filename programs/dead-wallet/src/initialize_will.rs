
use anchor_lang::{prelude::*, Result};
use anchor_lang::Space;
use crate::states::{Vault, WillAccount};

#[derive(Accounts,)]
pub struct Initialize<'info> {
    #[account(mut)]
    signer:Signer<'info>,
    #[account(
        init,
        payer=signer,
        seeds=[b"will" , signer.key().as_ref() ],
        space= 8 + WillAccount::INIT_SPACE,
        bump

    )]
    will_account:Account<'info, WillAccount>,
    #[account(
        init,
        payer=signer,
        seeds=[b"vault" , will_account.key().as_ref() ],
        space= 8 + Vault::INIT_SPACE,
        bump

    )]
    master_vault:Account<'info, Vault>,
    system_program:Program<'info, System>

}

pub fn initialize_will(ctx:Context<Initialize>, interval:i64) -> Result<()> {

    // Initialized the Will
    ctx.accounts.will_account.set_inner( WillAccount {
        bump:ctx.bumps.will_account,
        interval:interval,
        last_check_in:Clock::get()?.unix_timestamp,
        owner:ctx.accounts.signer.key.key(),
        claimed:false,
        total_bps:0,
        has_sol:false,
        total_bal:0,
        assets:vec![],
        heir_count:0
    } );

    // Creating the Master Vault PDA
    ctx.accounts.master_vault.set_inner(
        Vault {
            bump:ctx.bumps
            .master_vault,
            sol_balance:0
        }
    );
    
    Ok(())
}