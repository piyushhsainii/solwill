use anchor_lang::error_code;


#[error_code]
pub enum Errors {
    #[msg("Insuffiecient Balance")]
    LowBalance,
    #[msg("Owner is unauthorized")]
    Unauthorised_Depositor,
    #[msg("Required Accounts are not provided")]
    Accounts_Not_Provided,
    #[msg("BPS cannot exceeded 10,000")]
    BPS_NOT_INVALID,
    #[msg("BPS Overflowing")]
    BPS_OVERFLOW,
    #[msg("Owner Will is Different")]
    Owner_Not_Valid,
    #[msg("Heirs Account does not match")]
    Heir_Not_Valid,
    #[msg("Will already Claimed")]
    Will_Already_Claimed,
    #[msg("Will is still Active")]
    Will_Active,
    #[msg("Could not Calculate BPS Share while claiming")]
    Math_Error,
    #[msg("Cannot add more than 5 assets")]
    TooManyAssets,
    #[msg("Required Accounts to claim funds are not valid")]
    ClaimFundsAccountsNotValid,
    #[msg("Required Accounts to dissolved accounts are not valid")]
    DissolveFundsAccountsNotValid,
    #[msg("Vault ATA does not exist")]
    VaultATAInvalid,
    #[msg("Provided Mint Account does not exist in Will")]
    MintAccountNotValid,
    #[msg("Owner ATA ")]
    OwnerATANotCorrect,
    #[msg("Max Limit Reached to add heirs")]
    HeirMaxLimitReached,
    #[msg("DeadlineAlreadyPassed")]
    WillDeadlinePassed


}