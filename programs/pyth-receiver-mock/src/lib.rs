use anchor_lang::prelude::*;

declare_id!("rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ");

#[program]
pub mod pyth_receiver_mock {
    use super::*;

    pub fn write(ctx: Context<Write>, offset: u64, data: Vec<u8>) -> Result<()> {
        let start = offset as usize;
        let end = start
            .checked_add(data.len())
            .ok_or(PythReceiverError::WriteOutOfBounds)?;
        let mut target_data = ctx.accounts.target.data.borrow_mut();

        require!(end <= target_data.len(), PythReceiverError::WriteOutOfBounds);
        target_data[start..end].copy_from_slice(&data);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Write<'info> {
    /// CHECK: Localnet-only writer for oracle mocks.
    #[account(mut)]
    pub target: AccountInfo<'info>,
}

#[error_code]
pub enum PythReceiverError {
    #[msg("write exceeds account data length")]
    WriteOutOfBounds,
}
