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
import { APE_URIS, otherCreators, users } from "../utils/constants";
import { keypairIdentity, Metaplex, Nft } from "@metaplex-foundation/js";

describe("royalty-tracker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  let user = Keypair.generate();
  let creator = Keypair.generate();

  const metaplex = Metaplex.make(connection).use(keypairIdentity(creator));
  const RoyaltyTracker = anchor.workspace
    .RoyaltyTracker as Program<RoyaltyTracker>;

  let transaction = new Transaction();

  let nftMint = new PublicKey("3qd8kUJEJvztBeRQaa8dYtMRkPHQUS3qmsdqdKVauPUp");

  const METADATA_PROGRAM_PUBKEY = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const [nftMetadata] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_PUBKEY.toBuffer(),
      nftMint.toBuffer(),
    ],
    METADATA_PROGRAM_PUBKEY
  );

  let [receipt] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), nftMint.toBuffer()],
    RoyaltyTracker.programId
  );

  console.log("receipt add", receipt.toString());

  let airdropVal = 20 * LAMPORTS_PER_SOL;

  let nftList: Nft[];
  before(async () => {
    console.log(new Date(), "requesting airdrop");

    let airdropees = [user, ...users, creator, ...otherCreators];

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
      [users[0].publicKey, users[1].publicKey]
    );

    console.log("finished airdrops");
  });

  it("Created Receipt", async () => {
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
    let pricePaid = new BN(100);
    let royaltyPercent = 5;
    // let listingSig = nftMint.
    const pay_royalty_tx = await RoyaltyTracker.methods
      .payRoyalty(pricePaid, royaltyPercent)
      .accounts({
        receipt,
        nftMint,
        nftMetadata,
      })
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
    RoyaltyTracker.provider.connection.onLogs("all", ({ logs }) => {
      console.log(logs);
    });
  });
});
