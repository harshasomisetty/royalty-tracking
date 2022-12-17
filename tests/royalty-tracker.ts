import { keypairIdentity, Metaplex, Nft } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import {
  LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction
} from "@solana/web3.js";
import { RoyaltyTracker } from "../target/types/royalty_tracker";
import { APE_URIS, creator, otherCreators, users } from "../utils/constants";
import { mintNFTs } from "../utils/createNft";

const assert = require("assert");

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


    let otherCreatorSol = await connection.getBalance(otherCreators[0].publicKey);
    let creatorSol = await connection.getBalance(creator.publicKey);
    let userSol = await connection.getBalance(user.publicKey);

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

    let otherCreatorSol1 = await connection.getBalance(otherCreators[0].publicKey);
    let creatorSol1 = await connection.getBalance(creator.publicKey);
    let userSol1 = await connection.getBalance(user.publicKey);


    assert.ok(userSol1 < userSol);
    assert.ok(otherCreatorSol1 > otherCreatorSol)
    assert.ok(creatorSol1 - creatorSol);

    let fetchedReceipt = await RoyaltyTracker.account.receipt.fetch(receipt);

    assert.ok(fetchedReceipt.royaltyPaid.eq(royaltyPaid));
    assert.ok(fetchedReceipt.tradedPrice.eq(tradedPrice));
    assert.ok(fetchedReceipt.listingSig.equals(listingSig));
    assert.ok(fetchedReceipt.paymentSig.equals(paymentSig));

    console.log("fetched receipt", fetchedReceipt);
  });

  RoyaltyTracker.provider.connection.onLogs("all", ({ logs }) => {
    console.log(logs);
  });
});