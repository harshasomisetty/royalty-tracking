import { Keypair, PublicKey } from "@solana/web3.js";

export const creator = Keypair.fromSecretKey(
  Uint8Array.from([
    136, 236, 33, 18, 182, 95, 247, 68, 222, 24, 52, 82, 89, 43, 240, 149, 74,
    92, 60, 33, 209, 255, 221, 207, 10, 208, 149, 207, 161, 126, 142, 84, 30,
    186, 237, 17, 250, 81, 77, 108, 248, 193, 71, 38, 37, 47, 235, 232, 78, 5,
    99, 29, 96, 144, 16, 122, 12, 2, 99, 12, 168, 193, 78, 156,
  ])
);

export const otherCreators = [
  Keypair.fromSecretKey(
    Uint8Array.from([
      31, 52, 115, 252, 12, 13, 62, 55, 133, 131, 81, 61, 38, 175, 253, 204, 23,
      243, 180, 180, 178, 226, 104, 78, 159, 148, 142, 175, 196, 235, 36, 126,
      152, 221, 121, 167, 51, 182, 58, 234, 217, 94, 189, 11, 99, 3, 16, 247,
      158, 79, 107, 219, 232, 168, 90, 107, 250, 151, 54, 211, 93, 147, 42, 115,
    ])
  ),
  Keypair.fromSecretKey(
    Uint8Array.from([
      245, 26, 149, 17, 60, 172, 218, 154, 22, 153, 234, 38, 117, 77, 135, 114,
      180, 180, 99, 108, 124, 53, 138, 68, 214, 24, 10, 177, 230, 82, 179, 180,
      199, 61, 211, 236, 239, 118, 196, 83, 37, 232, 5, 136, 162, 106, 58, 0,
      58, 111, 99, 165, 124, 118, 227, 215, 69, 169, 194, 248, 101, 52, 206,
      148,
    ])
  ),
];

export const users = [
  Keypair.fromSecretKey(
    Uint8Array.from([
      243, 175, 79, 103, 190, 63, 200, 29, 117, 225, 114, 71, 25, 77, 208, 231,
      64, 95, 33, 108, 135, 1, 92, 86, 133, 198, 34, 155, 45, 157, 162, 101,
      151, 33, 127, 187, 68, 123, 53, 59, 87, 215, 205, 73, 203, 219, 55, 161,
      59, 117, 211, 172, 16, 107, 235, 189, 241, 189, 222, 70, 35, 117, 194,
      222,
    ])
  ),
  Keypair.fromSecretKey(
    Uint8Array.from([
      37, 243, 162, 101, 33, 131, 154, 96, 184, 2, 212, 88, 50, 65, 196, 227,
      247, 29, 181, 93, 178, 186, 166, 255, 239, 12, 105, 13, 19, 67, 220, 106,
      64, 145, 44, 208, 19, 98, 99, 212, 57, 116, 184, 197, 170, 65, 108, 231,
      172, 220, 56, 37, 114, 221, 52, 162, 221, 177, 250, 148, 159, 86, 173, 41,
    ])
  ),
];

export let APE_URLS: string[] = [
  "https://arweave.net/cDIEJDoklWxqjgGxpO0_usU6EYl3ZhFhS9lr2LRJz3I",
  "https://arweave.net/yqsiQlGL8p5TZu8hUI370TMMBtjBjgnGArH1SqkLfXo",
  "https://arweave.net/BESvWeqSSlfNUm9eXMn-fJft1mUNkCorNXfINk6DR7s",
  "https://arweave.net/3zyXys6kyKorZELCOMRCHkoSyauT0hDc9VH_HnFB4nI",
  "https://arweave.net/6Z-u2HqPkNbdYUJ9nL4WdkYlHD1zTSFXo9x4NbjyuSM",
  "https://arweave.net/UPLsr51N17JZYhxPx0Shjbx3OpdHkIKD9r0z6PAwVP8",
  "https://arweave.net/YofRxhUy4lZ6X-vNBguhf5eOPd5Ht0WaoUDG0S1fzfs",
  "https://arweave.net/3cwTxy19ftOQRuObrrnooJvlg1DfNkKqeQDEnT-B1q8",
  "https://arweave.net/f8kFL2XhIjXvfc4dJtXwjQviUm8nqtykkhhz9YN0FeY",
  "https://arweave.net/gGccMi95oe5Hd6s0iJngQArJIySRjpRGLz8S8ji2VQc",
];

export const APE_URIS: string[] = [
  "https://arweave.net/ayuE7xBDdvfqkT9j-V-FzrcBBC7aTHUNct9wsfnV8jE",
  "https://arweave.net/5-aZJP-LItDbqnqM59dkzL4J0LIfdyIrVW-uoTt2PHo",
  "https://arweave.net/Cp5guEvGUTZajzKy32qumidCv3WzlN6LxIufbDPTT38",
  "https://arweave.net/9phOwlHi5vqF57Xi6H_A6dF37kZjqBU3HvF6ABM9gyU",
  "https://arweave.net/40OcvYXM4FJ_5Jizjl1OMMUIVwvzEObr1s76Lprb7F4",
  "https://arweave.net/swewDCM4wbAATwQk_PssqfrWoeNUOMpeMmJzxV2s6s0",
  "https://arweave.net/9H6Hjvvm5IkYvnCS3Yp4APYhZsjreXQCJlBkrC72f5o",
  "https://arweave.net/0OgNDfMijqJZd41A7HtaqReaHhbBBEfm7NV10LPbyoE",
  "https://arweave.net/aMZnmYNOpevS5HdAMqxfJBfRclaKUMyBh2N7biZUfYo",
  "https://arweave.net/epAJHgBgQLeeKdcpO7pFmbjyNyI5cItWeixCoAjry40",
];
export let APE_SYMBOL: string = "APE";
