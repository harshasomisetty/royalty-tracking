use crate::state::metaplex_anchor::TokenMetadata;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use solana_program::{
    account_info::AccountInfo, program::invoke, program::invoke_signed, system_instruction,
};

pub mod state;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// https://solscan.io/token/3qd8kUJEJvztBeRQaa8dYtMRkPHQUS3qmsdqdKVauPUp#metadata

// TODO add in listing and payment sigs as transaction or some type? idk

#[program]
pub mod royalty_tracker {
    use super::*;

    /* Initializes the receipt in seperate transaction to allow for future updates and payments. */
    pub fn create_receipt(ctx: Context<CreateReceipt>) -> Result<()> {
        Ok(())
    }

    /* Writes the latest royalty payment details to the receipt */
    pub fn update_receipt(
        ctx: Context<UpdateReceipt>,
        listing_sig: Pubkey,
        payment_sig: Pubkey,
    ) -> Result<()> {
        ctx.accounts.receipt.listing_sig = listing_sig;
        ctx.accounts.receipt.payment_sig = payment_sig;
        Ok(())
    }

    // TODO change the pubkey type to signature
    pub fn pay_royalty(
        ctx: Context<PayRoyalty>,
        traded_price: u64,
        royalty_paid: u64,
    ) -> Result<()> {
        let bps = ctx.accounts.nft_metadata.data.seller_fee_basis_points;

        let total_royalty = traded_price
            .checked_mul(bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();

        let royalty_to_pay = total_royalty - royalty_paid;

        let mut creators = vec![
            &mut ctx.accounts.creator_1,
            &mut ctx.accounts.creator_2,
            &mut ctx.accounts.creator_3,
            &mut ctx.accounts.creator_4,
            &mut ctx.accounts.creator_5,
        ];

        // msg!("seller bps: {}", &bps);
        // msg!("creator vector? {:?}", &creators);

        let mut i = 0;

        for creator in ctx
            .accounts
            .nft_metadata
            .data
            .creators
            .as_ref()
            .expect("no creators")
        {
            let share = creator.share;

            assert_eq!(creator.address, creators[i].to_account_info().key());
            i += 1;

            let share_to_pay = royalty_to_pay
                .checked_mul(share as u64)
                .unwrap()
                .checked_div(100)
                .unwrap();

            invoke(
                &system_instruction::transfer(
                    ctx.accounts.signer.to_account_info().key,
                    creators[i].to_account_info().key,
                    share_to_pay,
                ),
                &[
                    ctx.accounts.signer.to_account_info(),
                    creators[i].to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        Ok(())
    }
}

// TODO Check if seeds are okay because previous receipt will be overwritten
#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(init,
              payer = signer,
              space = std::mem::size_of::<Receipt>(),
              seeds = [b"receipt", signer.key().as_ref(), nft_mint.key().as_ref()], bump,
)]
    pub receipt: Account<'info, Receipt>,

    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(listing_sig: Pubkey, payment_sig: Pubkey)]
pub struct UpdateReceipt<'info> {
    #[account(mut,
              seeds = [b"receipt", signer.key().as_ref(), nft_mint.key().as_ref()], bump,
)]
    pub receipt: Account<'info, Receipt>,

    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(traded_price: u64, royalty_percent_paid: u64)]
pub struct PayRoyalty<'info> {
    #[account(mut,
              seeds = [b"receipt", signer.key().as_ref(), nft_mint.key().as_ref()], bump,
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

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Receipt {
    pub listing_sig: Pubkey,
    pub payment_sig: Pubkey, //nft tx where the royalties were not paid
    pub amount_paid: u64,
}
