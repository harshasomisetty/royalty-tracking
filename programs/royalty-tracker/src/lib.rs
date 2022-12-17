use crate::state::metaplex_anchor::TokenMetadata;
use crate::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use solana_program::{
    account_info::AccountInfo, program::invoke, program::invoke_signed, system_instruction,
};

pub mod state;

declare_id!("BUogHxercuTuXzYbieLjyqC9gRtp4riJqiFuWNViYsuT");

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
    pub fn pay_royalty<'info>(
        ctx: Context<'_, '_, '_, 'info, PayRoyalty<'info>>,
        traded_price: u64,
        royalty_paid: u64,
        listing_sig: Pubkey, // Actually a signature
        payment_sig: Pubkey, // Actually a signature
    ) -> Result<()> {
        let metadata = &ctx.accounts.nft_metadata;

        let bps = metadata.data.seller_fee_basis_points;

        let total_royalty = traded_price
            .checked_mul(bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();

        let royalty_to_pay = total_royalty - royalty_paid;
        let mut remaining_royalty = royalty_to_pay;

        let remaining_accounts = &mut ctx.remaining_accounts.iter();

        match &metadata.data.creators {
            Some(creators) => {
                for creator in creators {
                    let pct = creator.share as u128;
                    let creator_fee = pct
                        .checked_mul(royalty_to_pay as u128)
                        .unwrap()
                        .checked_div(100)
                        .unwrap() as u64;
                    // .ok_or(ErrorCode::NumericalOverflow)?
                    // TOOD add in proper error checking instead of unwraps
                    remaining_royalty = remaining_royalty.checked_sub(creator_fee).unwrap();

                    let current_creator_info = next_account_info(remaining_accounts)?;
                    assert_eq!(creator.address, *current_creator_info.key);

                    if creator_fee > 0 {
                        invoke(
                            &system_instruction::transfer(
                                ctx.accounts.signer.to_account_info().key,
                                current_creator_info.key,
                                creator_fee,
                            ),
                            &[
                                ctx.accounts.signer.to_account_info(),
                                current_creator_info.to_account_info(),
                                ctx.accounts.system_program.to_account_info(),
                            ],
                        )?;
                    }
                }
            }
            None => {
                msg!("No creators found in metadata");
            }
        }

        ctx.accounts.receipt.listing_sig = listing_sig;
        ctx.accounts.receipt.payment_sig = payment_sig;
        ctx.accounts.receipt.traded_price = traded_price;
        ctx.accounts.receipt.royalty_paid = royalty_paid;

        Ok(())
    }
}

// TODO Check if seeds are okay because previous receipt will be overwritten
#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(init,
                  payer = signer,
                  space = std::mem::size_of::<Receipt>()+10,
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
#[instruction(traded_price: u64, royalty_paid: u64, listing_sig: Pubkey, payment_sig: Pubkey)]
pub struct PayRoyalty<'info> {
    #[account(mut)]
    pub receipt: Account<'info, Receipt>,
    #[account(mut)]
    pub nft_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub nft_metadata: Box<Account<'info, TokenMetadata>>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Receipt {
    pub listing_sig: Pubkey,
    pub payment_sig: Pubkey, //nft tx where the royalties were not paid
    pub royalty_paid: u64,
    pub traded_price: u64,
}
