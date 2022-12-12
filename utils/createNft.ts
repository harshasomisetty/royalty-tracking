import {
  bundlrStorage,
  BundlrStorageDriver,
  keypairIdentity,
  Metaplex,
  findMetadataPda,
  Nft,
  UploadMetadataInput,
  TokenMetadataProgram,
} from "@metaplex-foundation/js";
import {
  createSignMetadataInstruction,
  DataV2,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import {
  ABC_SYMBOL,
  ABC_URLS,
  APE_SYMBOL,
  APE_URIS,
  APE_URLS,
  BEAR_SYMBOL,
  BEAR_URIS,
  BEAR_URLS,
  GOD_SYMBOL,
  GOD_URLS,
} from "./constants";

import { creator, otherCreators, users } from "./constants";

export function nftJsonFormat(
  image: string,
  symbol: string,
  ind: number,
  creator: Keypair,
  otherCreator: Keypair
): UploadMetadataInput {
  return {
    symbol: symbol,
    name: symbol + ind.toString(),
    image: image,
    description: symbol + " nft " + ind.toString(),
    creators: [
      {
        address: otherCreator.publicKey,
        share: 50,
        verified: true,
      },
      {
        address: creator.publicKey,
        share: 50,
        verified: false,
      },
    ],
    sellerFeeBasisPoints: 500,
    collection: null,
    uses: null,
  };
}

export function getNftJsonDataArray(
  images: string[],
  symbol: string,
  creator: Keypair,
  otherCreator: Keypair
) {
  let jsonData: UploadMetadataInput[] = [];

  images.forEach((image, ind) => {
    jsonData.push(nftJsonFormat(image, symbol, ind, creator, otherCreator));
  });

  console.log("got nft json data", images.length);
  return jsonData;
}

export async function uploadNfts(
  images: string[],
  symbol: string,
  creator: Keypair,
  otherCreator: Keypair
) {
  const connection = new Connection("https://api.devnet.solana.com");

  const metaplex = Metaplex.make(connection).use(keypairIdentity(creator));

  metaplex.use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: "https://api.devnet.solana.com",
      timeout: 60000,
    })
  );

  console.log("airdropping devnet");
  await connection.confirmTransaction(
    await connection.requestAirdrop(
      metaplex.identity().publicKey,
      1 * LAMPORTS_PER_SOL
    ),
    "confirmed"
  );
  let bundlrDriver = metaplex.storage().driver() as BundlrStorageDriver;
  (await bundlrDriver.bundlr()).fund(1000000);

  console.log("funded bundler");
  let jsonData = getNftJsonDataArray(images, symbol, creator, otherCreator);
  let newJsonData = [];

  for (let i = 0; i < images.length; i++) {
    console.log("uploading", i);
    let { uri } = await metaplex.nfts().uploadMetadata(jsonData[i]);
    newJsonData.push(uri);
    console.log(uri);
  }

  console.log('["' + newJsonData.join('","'), '"]');
}

const uploadAllNfts = async () => {
  // await uploadNfts(APE_URLS, APE_SYMBOL, otherCreators[0], creator);
  // await uploadNfts(BEAR_URLS, BEAR_SYMBOL, otherCreators[1], creator);
  // await uploadNfts(GOD_URLS, GOD_SYMBOL, otherCreators[0], creator);
  // await uploadNfts(ABC_URLS, ABC_SYMBOL, otherCreators[1], creator);
};

// uploadAllNfts();

export async function mintNFTs(
  metaplex: Metaplex,
  connection: Connection,
  uriData: string[],
  otherCreator: Keypair,
  owners: PublicKey[]
): Promise<Nft[]> {
  async function mintSingleNft(uri: string, ownerKey: PublicKey): Promise<Nft> {
    // const { nft } = await metaplex.nfts().create({
    //   uri: "https://arweave.net/123",
    //   name: "My NF",
    //   sellerFeeBasisPoints: 500, // Represents 5.00%.
    // });
    //

    console.log("uri", uri);

    fetch(uri)
      .then((response) => response.json())
      .then((data) => {
        console.log("Arweave network height is: " + data.height);
      })
      .catch((error) => {
        console.error(error);
      });
    let { nft } = await metaplex.nfts().create({
      uri: uri,
      name: "My NF",
      sellerFeeBasisPoints: 500, // Represents 5.00%.
      // mintAuthority: otherCreator, // other creator[i] created all of collection i
      // updateAuthority: otherCreator,
      // owner: ownerKey, // users alternate ownership of nfts,
      // payer: otherCreator,
      creators: [
        {
          address: otherCreator.publicKey,
          share: 50,
          verified: true,
        },
        {
          address: creator.publicKey,
          share: 50,
          verified: false,
        },
      ],
    });

    const METADATA_PROGRAM_PUBKEY = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_PUBKEY.toBuffer(),
        nft.mint.address.toBuffer(),
      ],
      METADATA_PROGRAM_PUBKEY
    );

    let tx2 = new Transaction().add(
      createSignMetadataInstruction({
        metadata: metadata,
        creator: otherCreator.publicKey,
      })
    );

    await connection.sendTransaction(tx2, [otherCreator]);

    return nft;
  }

  console.log("in function before promises");

  let nftPromises: Promise<Nft>[] = [];
  for (let i = 0; i < uriData.length; i++) {
    let uri = uriData[i];
    console.log("before ", i);
    nftPromises.push(mintSingleNft(uri, owners[i % owners.length]));
    console.log("after ", i);
  }

  console.log("after loop");

  let nftResults = await Promise.all(nftPromises);

  console.log("Finished Minting nfts");

  return nftResults;
}
