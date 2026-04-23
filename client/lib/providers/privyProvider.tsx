"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { motion, AnimatePresence } from 'framer-motion'

export default function PrivvyProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PrivyProvider
            children={children}
            appId="cmobc3kxo006h0dlkjha2uwow"
            config={{
                appearance: {
                    accentColor: "#000000",
                    theme: "#000000",
                    showWalletLoginFirst: false,
                    logo: "https://solwill.vercel.app/solwill-whitebg.png",
                    walletChainType: "solana-only",
                    walletList: [
                        "detected_solana_wallets",
                        "phantom",
                        "solflare",
                        "backpack",
                        "okx_wallet",
                    ],
                },
                solana: {
                    rpcs: {
                        "solana:mainnet": {
                            rpc: createSolanaRpc("https://api.devnet.solana.com"),
                            rpcSubscriptions: createSolanaRpcSubscriptions(
                                "wss://api.devnet.solana.com"
                            ),
                        },
                        "solana:devnet": {
                            rpc: createSolanaRpc("https://api.devnet.solana.com"),
                            rpcSubscriptions: createSolanaRpcSubscriptions(
                                "wss://api.devnet.solana.com"
                            ),
                        },
                    },
                },
                externalWallets: {
                    solana: {
                        connectors: toSolanaWalletConnectors(),
                    },
                },
                mfa: {
                    noPromptOnMfaRequired: false,
                },
                embeddedWallets: {
                    showWalletUIs: true,
                    ethereum: {
                        createOnLogin: "off",
                    },
                    solana: {
                        createOnLogin: "off",
                    },
                },
            }}
        />
    );
}