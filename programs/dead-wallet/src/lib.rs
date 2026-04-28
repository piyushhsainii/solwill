use anchor_lang::prelude::*;

pub mod states;
pub use states::*;

pub mod initialize_will;
pub use initialize_will::*;

pub mod deposit_sol;
pub use deposit_sol::*;

pub mod deposit_spl;
pub use deposit_spl::*;

pub mod add_heir;
pub use add_heir::*;

pub mod update_heir;
pub use update_heir::*;

pub mod checkin;
pub use checkin::*;

pub mod claim_funds;
pub use claim_funds::*;

pub mod dissolve;
pub use dissolve::*;

pub mod update_will;
pub use update_will::*;

pub mod error;
pub use error::*;

pub mod removeheir;
pub use removeheir::*;

pub mod withdraw_sol;
pub use withdraw_sol::*;

pub mod withdraw_spl;
pub use withdraw_spl::*;

pub use error::*;


declare_id!("ApK5v1ibJDetC9xiHywNGiWPN2hMu7zm4RQxGaiFsMvr");

#[program]
pub mod dead_wallet {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, interval:i64) -> Result<()> {
     initialize_will::initialize_will(ctx, interval)?;
        Ok(())
    }
    pub fn add_heirs_to_will(ctx: Context<AddHeir>, bps:u32) -> Result<()> {
        add_heir::add_heir(ctx, bps)?;
        Ok(())
    }
    pub fn update_heir_from_will(ctx: Context<UpdateHeir>, updated_bps:u32) -> Result<()> {
        update_heir::update_heir(ctx, updated_bps)?;
        Ok(())
    }
    pub fn remove_heir_from_will(ctx: Context<RemoveHeir>, bps:u32) -> Result<()> {
        removeheir::remove_heir(ctx)?;
        Ok(())
    }
    pub fn checkin_will(ctx: Context<CheckIn>,) -> Result<()> {
        checkin::check_in(ctx)?;
        Ok(())
    }
    pub fn claim_ll<'info>(
        ctx: Context<'_, '_, 'info, 'info, Claim<'info>>,
    ) -> Result<()> {
        claim_funds::claim(ctx)
    }

    pub fn dissolve_will<'info>(
        ctx: Context<'_, '_, 'info, 'info, Dissolve<'info>>,
    ) -> Result<()> {
        dissolve::dissolve(ctx)
    }
    pub fn deposit_sol(ctx: Context<DepositSol>, amt:u64) -> Result<()> {
        deposit_sol::deposit(ctx, amt)?;
        Ok(())
    }
    pub fn deposit_spl_tokens(ctx: Context<DepositSpl>, amt:u64) -> Result<()> {
        deposit_spl::deposit_spl(ctx, amt)?;
        Ok(())
    }
    pub fn update_will_fun(ctx: Context<UpdateWill>, interval:i64) -> Result<()> {
        update_will::update_will(ctx, interval)?;
        Ok(())
    }
    pub fn withdraw_sol_token(ctx: Context<WithdrawSol>, amt:u32) -> Result<()> {
        withdraw_sol::withdraw_sol(ctx, amt)?;
        Ok(())
    }
    pub fn withdraw_spl_token(ctx: Context<WithdrawSPL>, amt:u64) -> Result<()> {
        withdraw_spl::withdraw_spl(ctx, amt)?;
        Ok(())
    }


}

