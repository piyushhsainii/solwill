import { Program } from "@coral-xyz/anchor";
import { DeadWallet } from "../idl/idl";
import { PublicKey } from "@solana/web3.js";

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
