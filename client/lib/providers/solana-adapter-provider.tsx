'use client'

import { ReactNode, useMemo } from 'react'
import {
    ConnectionProvider,
    WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Required styles for wallet modal
import '@solana/wallet-adapter-react-ui/styles.css'

type Props = {
    children: ReactNode
}

export default function SolanaProviderWrapper({ children }: Props) {
    const endpoint =
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    )

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}