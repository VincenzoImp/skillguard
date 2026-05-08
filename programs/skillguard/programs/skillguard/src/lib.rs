use anchor_lang::prelude::*;

declare_id!("HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam");

#[program]
pub mod skillguard {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
