import { Program } from "@coral-xyz/anchor";
import { DeadWallet } from "../idl/idl";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
  },
};

export const STEPS = [
  { label: "Create Will" },
  { label: "Add Heirs" },
  { label: "Fund Vault" },
];

export type Heir = {
  id: string;
  walletAddress: string;
  shareBps: number;
  onChain: boolean;
};

export type Phase = 0 | 1 | 2 | "dashboard";

export interface UseAnchorProviderReturn {
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  program: Program<DeadWallet> | null;
  pdas: { willPda: PublicKey | null; vaultPda: PublicKey | null };
  Heirs: Heir[];
}

export async function buildAndSend(
  raw: any,
  connection: Connection,
  ix: any,
  ownerPk: PublicKey,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  // Build transaction
  const tx = new Transaction({
    feePayer: ownerPk,
    blockhash,
    lastValidBlockHeight,
  }).add(ix);

  // Serialize
  let serializedTx: Uint8Array;
  try {
    serializedTx = new Uint8Array(
      tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
    );
    console.log(
      "[checkinWill] serialized tx byteLength:",
      serializedTx.byteLength,
    );
  } catch (serErr) {
    console.error("[checkinWill] serialization failed:", serErr);
    throw serErr;
  }

  // Send to Phantom
  console.log("[checkinWill] sending to Phantom for signing...");
  let signature: string;
  try {
    const result = await raw.signAndSendTransaction({
      transaction: serializedTx,
      chain: "solana:devnet",
    });
    signature = bs58.encode(result.signature);
    console.log("[checkinWill] Phantom returned signature:", signature);
  } catch (signErr) {
    console.error("[checkinWill] Phantom rejected or errored:", signErr);
    console.error("[checkinWill] signErr name:", (signErr as any)?.name);
    console.error("[checkinWill] signErr message:", (signErr as any)?.message);
    console.error("[checkinWill] signErr code:", (signErr as any)?.code);
    throw signErr;
  }

  // Confirm
  console.log("[checkinWill] confirming transaction...");
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  console.log("[checkinWill] confirmed!");

  return signature;
}

/* ─── Token registry ─────────────────────────────────────────────── */
export type Token = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logo: string;
};

export const SOL_LOGO = "/sol-logo.png";

export const TOKENS: Token[] = [
  {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    logo: SOL_LOGO,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    logo: "/usdc-logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    logo: "/USDT_LOGO.png",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    logo: "/bonk-logo.png",
  },
];

export const SPL_TOKENS = TOKENS.filter((t) => t.symbol !== "SOL");

export const TOKEN_LOGO_MAP: Record<string, string> = {
  SOL: SOL_LOGO,
  USDC: "/usdc-logo.png",
  USDT: "/USDT_LOGO.png",
  BONK: "/bonk-logo.png",
};

export async function getTokenProgramForMint(
  connection: Connection,
  mint: PublicKey,
): Promise<PublicKey> {
  const accountInfo = await connection.getAccountInfo(mint);
  if (!accountInfo) throw new Error("Mint not found");

  if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return TOKEN_2022_PROGRAM_ID;
  }
  return TOKEN_PROGRAM_ID;
}
