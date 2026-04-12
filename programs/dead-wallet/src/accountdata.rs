use anchor_lang::{prelude::*, solana_program::clock::UnixTimestamp};

#[derive(AnchorSerialize, AnchorDeserialize, Clone,InitSpace, PartialEq)]
pub enum HeirStatus {
    Active,
    Claimed
}

#[account]
#[derive(InitSpace)] 
pub struct WillAccount {
    pub owner:Pubkey,
    pub interval:i64,
    pub last_check_in:i64,
    pub bump:u8,
    pub claimed:bool,
    pub total_bps:u32,
    pub total_bal:u32,
    pub has_sol:bool,
    pub heir_count:u32,
    #[max_len(5)]
    pub assets:Vec<SPLTOKENS>
}

#[derive(Clone,InitSpace,AnchorSerialize, AnchorDeserialize,)]
pub struct SPLTOKENS{
   pub mint:Pubkey,
   pub balance:u64
}

#[account]
#[derive(InitSpace)] 
pub struct Heir {
    pub bps:u32,
    pub owner:Pubkey,
    pub status:HeirStatus,
    pub wallet_address:Pubkey,
    pub bump:u8
}

#[account]
#[derive(InitSpace)] 
pub struct Vault {
    pub bump:u8,
    pub sol_balance:u64
}