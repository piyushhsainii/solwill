'use client'

import { useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'

type SupportedWalletType =
    | 'phantom'
    | 'solflare'
    | 'backpack'
    | 'privy'
    | 'unknown'

type UnifiedWallet = {
    ready: boolean
    loading: boolean
    connected: boolean
    walletType: SupportedWalletType
    address: string | null
    publicKey: PublicKey | null
    signTransaction?: (
        tx: Transaction | VersionedTransaction
    ) => Promise<any>
    signAllTransactions?: (
        txs: (Transaction | VersionedTransaction)[]
    ) => Promise<any>
    source: 'wallet-adapter' | 'privy' | null
    raw: any
}

export function useSollWillWallet(): UnifiedWallet {
    const { ready, authenticated, user } = usePrivy()
    const { wallets } = useWallets()
    const adapter = useWallet()

    return useMemo<UnifiedWallet>(() => {
        const primary = user?.wallet
        const type =
            primary?.walletClientType?.toLowerCase?.() ?? ''

        const resolvedAddress =
            primary?.address ??
            wallets?.[0]?.address ??
            adapter.publicKey?.toBase58() ??
            null

        const resolvedPublicKey =
            adapter.publicKey ??
            (resolvedAddress
                ? new PublicKey(resolvedAddress)
                : null)

        const isExternal =
            type.includes('phantom') ||
            type.includes('solflare') ||
            type.includes('backpack')

        if (isExternal) {
            return {
                ready,
                loading: !ready,
                connected: !!resolvedAddress,
                walletType: 'phantom',
                address: resolvedAddress,
                publicKey: resolvedPublicKey,
                signTransaction: adapter.signTransaction,
                signAllTransactions:
                    adapter.signAllTransactions,
                source: 'wallet-adapter',
                raw: adapter,
            }
        }

        const privyWallet = wallets?.[0]

        if (type.includes('privy') && privyWallet) {
            return {
                ready,
                loading: !ready,
                connected: !!resolvedAddress,
                walletType: 'privy',
                address: resolvedAddress,
                publicKey: resolvedPublicKey,
                signTransaction: async (tx) =>
                    await privyWallet.sign(tx as any),
                signAllTransactions: async (txs) =>
                    await Promise.all(
                        txs.map((tx) =>
                            privyWallet.sign(tx as any)
                        )
                    ),
                source: 'privy',
                raw: privyWallet,
            }
        }

        return {
            ready,
            loading: !ready,
            connected: authenticated && !!resolvedAddress,
            walletType: 'unknown',
            address: resolvedAddress,
            publicKey: resolvedPublicKey,
            source: null,
            raw: null,
        }
    }, [ready, authenticated, user, wallets, adapter])
}