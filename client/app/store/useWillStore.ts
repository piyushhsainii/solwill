import { create } from "zustand";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type Heir = {
  id: string;
  walletAddress: string;
  shareBps: number;
};

export type Asset = {
  symbol: string;
  mint?: string;
  amount: number;
  usdPrice: number;
  usdValue: number;
  icon?: string;
};

type WillStatus = "Active" | "Grace Period" | "Triggered" | "Paused";

type WillAccount = {
  lastCheckin: number;
  interval: number;
  status: WillStatus;
  createdAt: number;
  nextCheckin: number;
};

export type VaultAccount = {
  sol: number;
  usdc: number;
  totalUsdValue: number;
  assets: Asset[];
};

type State = {
  /* wallet */
  connected: boolean;
  publicKey: string | null;
  walletAddress: string | null;

  /* accounts — null until hydrated from chain */
  willAccount: WillAccount | null;
  vaultAccount: VaultAccount | null;
  heirs: Heir[];

  /* ui */
  txPending: boolean;

  /* actions */
  setWallet: (key: string | null) => void;
  setTxPending: (v: boolean) => void;

  createWill: (intervalDays: number) => void;
  performCheckin: () => void;
  hydrateDashboard: () => void;

  addHeir: (heir: Omit<Heir, "id">) => void;
  updateHeir: (id: string, updates: Partial<Omit<Heir, "id">>) => void;
  removeHeir: (id: string) => void;

  depositAsset: (asset: {
    symbol: string;
    amount: number;
    usdPrice: number;
    mint?: string;
    icon?: string;
  }) => void;

  withdrawAsset: (symbol: string, amount: number) => void;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const now = () => Math.floor(Date.now() / 1000);

const calcVaultTotals = (assets: Asset[]): VaultAccount => ({
  sol: assets.find((a) => a.symbol === "SOL")?.amount ?? 0,
  usdc: assets.find((a) => a.symbol === "USDC")?.amount ?? 0,
  totalUsdValue: assets.reduce((sum, a) => sum + a.usdValue, 0),
  assets,
});

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

export const useWillStore = create<State>((set, get) => ({
  // ── Wallet ───────────────────────────────────────────────────────────────
  connected: false,
  publicKey: null,
  walletAddress: null,

  // ── Accounts — start null so the dashboard waits for chain data ──────────
  // (The layout's `firstLoad` guard depends on both being null pre-hydration.
  //  Do NOT seed these with fake data here.)
  willAccount: null,
  vaultAccount: null,
  heirs: [],

  txPending: false,

  // ── Wallet ───────────────────────────────────────────────────────────────
  setWallet: (key) =>
    set({ publicKey: key, walletAddress: key, connected: !!key }),

  setTxPending: (v) => set({ txPending: v }),

  // ── Will ─────────────────────────────────────────────────────────────────
  createWill: (intervalDays) =>
    set(() => {
      const ts = now();
      const interval = intervalDays * 24 * 60 * 60;
      return {
        willAccount: {
          createdAt: ts,
          lastCheckin: ts,
          interval,
          nextCheckin: ts + interval,
          status: "Active",
        },
      };
    }),

  performCheckin: () =>
    set((state) => {
      if (!state.willAccount) return state;
      const ts = now();
      return {
        willAccount: {
          ...state.willAccount,
          lastCheckin: ts,
          nextCheckin: ts + state.willAccount.interval,
          status: "Active",
        },
      };
    }),

  hydrateDashboard: () =>
    set((state) => {
      if (!state.willAccount) return state;
      const ts = now();
      const lateBy = ts - state.willAccount.nextCheckin;
      let status: WillStatus = "Active";
      if (lateBy > 0 && lateBy <= 3 * 24 * 60 * 60) status = "Grace Period";
      if (lateBy > 3 * 24 * 60 * 60) status = "Triggered";
      return { willAccount: { ...state.willAccount, status } };
    }),

  // ── Heirs ────────────────────────────────────────────────────────────────
  addHeir: (heir) =>
    set((state) => {
      if (state.heirs.length >= 5) return state;
      return {
        heirs: [...state.heirs, { ...heir, id: crypto.randomUUID() }],
      };
    }),

  updateHeir: (id, updates) =>
    set((state) => ({
      heirs: state.heirs.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  removeHeir: (id) =>
    set((state) => ({
      heirs: state.heirs.filter((h) => h.id !== id),
    })),

  // ── Assets ───────────────────────────────────────────────────────────────
  depositAsset: ({ symbol, amount, usdPrice, mint, icon }) =>
    set((state) => {
      const current = state.vaultAccount?.assets ?? [];
      const existing = current.find((a) => a.symbol === symbol);
      const next: Asset[] = existing
        ? current.map((a) =>
            a.symbol === symbol
              ? {
                  ...a,
                  amount: a.amount + amount,
                  usdPrice,
                  usdValue: (a.amount + amount) * usdPrice,
                }
              : a,
          )
        : [
            ...current,
            {
              symbol,
              mint,
              icon,
              amount,
              usdPrice,
              usdValue: amount * usdPrice,
            },
          ];
      return { vaultAccount: calcVaultTotals(next) };
    }),

  withdrawAsset: (symbol, amount) =>
    set((state) => {
      const current = state.vaultAccount?.assets ?? [];
      const next = current
        .map((a) =>
          a.symbol === symbol
            ? {
                ...a,
                amount: Math.max(0, a.amount - amount),
                usdValue: Math.max(0, a.amount - amount) * a.usdPrice,
              }
            : a,
        )
        .filter((a) => a.amount > 0);
      return { vaultAccount: calcVaultTotals(next) };
    }),
}));
