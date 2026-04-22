'use client'

import { useMemo, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { PublicKey } from '@solana/web3.js'
import { ConnectedStandardSolanaWallet, useWallets } from '@privy-io/react-auth/solana'

type UnifiedWallet = {
    ready: boolean
    loading: boolean
    connected: boolean
    address: string | null
    publicKey: PublicKey | null
    source: 'wallet-adapter' | 'privy' | null
    raw: ConnectedStandardSolanaWallet | null
}

export function useSollWillWallet(): UnifiedWallet {
    const { ready, authenticated } = usePrivy()
    const { wallets } = useWallets()

    // Cache the PublicKey instance so it only changes when the address string changes.
    // Without this, `new PublicKey(address)` creates a new object every render,
    // making the wallet object look "new" to downstream effects even when nothing changed.
    const publicKeyRef = useRef<{ address: string; key: PublicKey } | null>(null)

    // Stable first wallet address — useWallets returns a new array reference every render
    // even when the contents haven't changed, so derive a primitive to use as the memo dep.
    const address = wallets?.[0]?.address ?? null
    const wallet = wallets?.[0] ?? null

    return useMemo(() => {
        // Privy still booting
        if (!ready) {
            return {
                ready: false,
                loading: true,
                connected: false,
                address: null,
                publicKey: null,
                source: null,
                raw: null,
            }
        }

        // User logged in but wallets still being hydrated
        if (authenticated && !wallet) {
            return {
                ready: true,
                loading: true,
                connected: false,
                address: null,
                publicKey: null,
                source: null,
                raw: null,
            }
        }

        // Wallet exists
        if (address) {
            // Only construct a new PublicKey when the address string actually changes
            if (publicKeyRef.current?.address !== address) {
                publicKeyRef.current = { address, key: new PublicKey(address) }
            }

            return {
                ready: true,
                loading: false,
                connected: true,
                address,
                publicKey: publicKeyRef.current.key, // stable reference
                source: 'wallet-adapter',
                raw: wallet,
            }
        }

        // No wallet connected
        return {
            ready: true,
            loading: false,
            connected: false,
            address: null,
            publicKey: null,
            source: null,
            raw: null,
        }
        // Use primitive `address` instead of `wallets` array — wallets is a new reference
        // every render from Privy even when the wallet hasn't changed
    }, [ready, authenticated, address, wallet])
}