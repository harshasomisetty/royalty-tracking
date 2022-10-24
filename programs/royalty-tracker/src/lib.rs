use crate::state::metaplex_anchor::TokenMetadata;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

pub mod state;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// https://solscan.io/token/3qd8kUJEJvztBeRQaa8dYtMRkPHQUS3qmsdqdKVauPUp#metadata

// TODO add in listing and payment sigs as transaction or some type? idk

#[program]
pub mod royalty_tracker {
    use super::*;

    pub fn create_receipt(ctx: Context<CreateReceipt>) -> Result<()> {
        Ok(())
    }

    pub fn pay_royalty(
        ctx: Context<PayRoyalty>,
        traded_price: u64,
        royalty_percent_paid: u16,
        // listing_sig: Pubkey,
        // payment_sig: Pubkey,
    ) -> Result<()> {
        let bps = ctx.accounts.nft_metadata.data.seller_fee_basis_points;

        msg!("seller bps: {}", bps);

        let bps_left_to_pay = bps - royalty_percent_paid;

        let mut creators = vec![
            &mut ctx.accounts.creator_1,
            &mut ctx.accounts.creator_2,
            &mut ctx.accounts.creator_3,
            &mut ctx.accounts.creator_4,
            &mut ctx.accounts.creator_5,
        ];

        msg!("creator vector? {:?}", &creators);

        for creator in &mut creators {
            let cpi_accounts = Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: creator.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_context, bps_left_to_pay as u64)?;
        }

        // ctx.accounts.receipt.listing_sig = listing_sig;
        // ctx.accounts.receipt.payment_sig = payment_sig;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(init,
              payer = signer,
              space = std::mem::size_of::<Receipt>(),
              seeds = [b"receipt", nft_mint.key().as_ref()], bump,
)]
    pub receipt: Account<'info, Receipt>,

    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(traded_price: u64, royalty_percent_paid: u16)]
// , listing_sig: Pubkey, payment_sig: Pubkey
pub struct PayRoyalty<'info> {
    #[account(mut,
              seeds = [b"seeds", nft_mint.key().as_ref()], bump,
    )]
    pub receipt: Account<'info, Receipt>,

    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub nft_metadata: Box<Account<'info, TokenMetadata>>,

    #[account(mut)]
    pub creator_1: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub creator_2: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub creator_3: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub creator_4: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub creator_5: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct Receipt {
    pub listing_sig: Pubkey,
    pub payment_sig: Pubkey,
}
