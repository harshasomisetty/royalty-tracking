import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { RoyaltyTracker } from "../target/types/royalty_tracker";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { mintNFTs } from "../utils/createNft";
import { APE_URIS, otherCreators, creator, users } from "../utils/constants";
import { keypairIdentity, Metaplex, Nft } from "@metaplex-foundation/js";

describe("royalty-tracker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  let user = users[0];

  const metaplex = Metaplex.make(connection).use(keypairIdentity(creator));
  const RoyaltyTracker = anchor.workspace
    .RoyaltyTracker as Program<RoyaltyTracker>;


  let nftMint, nftMetadata, receipt;
  let nftList: Nft[];

  const METADATA_PROGRAM_PUBKEY = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  let airdropVal = 20 * LAMPORTS_PER_SOL;

  before(async () => {
    console.log(new Date(), "requesting airdrop");

    let airdropees = [...users, creator, ...otherCreators];

    for (const dropee of airdropees) {
      await connection.confirmTransaction(
        await connection.requestAirdrop(dropee.publicKey, airdropVal),
        "confirmed"
      );
    }

    nftList = await mintNFTs(
      metaplex,
      connection,
      APE_URIS.splice(0, 1),
      otherCreators[0],
      [user.publicKey]
    );

    console.log("finished airdrops");

    nftMint = nftList[0].address;
    [nftMetadata] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_PUBKEY.toBuffer(),
        nftMint.toBuffer(),
      ],
      METADATA_PROGRAM_PUBKEY
    );

    [receipt] = await PublicKey.findProgramAddress(
      [Buffer.from("receipt"), user.publicKey.toBuffer(), nftMint.toBuffer()],
      RoyaltyTracker.programId
    );

  });

  it("Created Receipt", async () => {

    let transaction = new Transaction();
    console.log("In create receipt")
    // Add your test here.
    const create_receipt_tx = await RoyaltyTracker.methods
      .createReceipt()
      .accounts({
        receipt,
        nftMint,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    transaction.add(create_receipt_tx);

    try {
      connection.confirmTransaction(
        await sendAndConfirmTransaction(connection, transaction, [user]),
        "confirmed"
      );
    } catch (error) {
      console.log("", error);
      throw new Error("failed tx");
    }

  });

  it("Paid Royalty", async () => {


    console.log("In pay royalty")

    let transaction = new Transaction();

    let tradedPrice = new BN(100);
    let royaltyPaid = new BN(1);
    let listingSig = nftMint;
    let paymentSig = nftMint;


    console.log("receipt", receipt.toBase58())
    console.log("nftMint", nftMint.toBase58())
    console.log("nftMetadata", nftMetadata.toBase58())
    console.log("signer", user.publicKey.toBase58())


    const pay_royalty_tx = await RoyaltyTracker.methods
      .payRoyalty(tradedPrice, royaltyPaid, listingSig, paymentSig)
      .accounts({
        receipt,
        nftMint,
        nftMetadata,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        {
          pubkey: otherCreators[0].publicKey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: creator.publicKey,
          isSigner: false,
          isWritable: true,
        },
      ])
      .transaction();

    transaction.add(pay_royalty_tx);

    try {
      connection.confirmTransaction(
        await sendAndConfirmTransaction(connection, transaction, [user]),
        "confirmed"
      );
    } catch (error) {
      console.log("", error);
      throw new Error("failed tx");
    }

    let fetchedReceipt = await RoyaltyTracker.account.receipt.fetch(receipt);

    console.log("fetched receipt", fetchedReceipt);
  });
  RoyaltyTracker.provider.connection.onLogs("all", ({ logs }) => {
    console.log(logs);
  });
});
