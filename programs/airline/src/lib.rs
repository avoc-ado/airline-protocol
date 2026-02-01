use anchor_lang::prelude::*;

declare_id!("C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK");

#[program]
pub mod airline {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
