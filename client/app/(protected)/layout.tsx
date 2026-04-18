'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWillStore } from '@/app/store/useWillStore'
import { useAnchorProvider, type UseAnchorProviderReturn } from '@/lib/hooks/useAnchorProvider'
import { useSollWillWallet } from '@/lib/hooks/useSolWillWallet'
import Sidebar from '@/components/ui/sidebar'
import FullScreenSpinner from '@/components/ui/full-screen-spinner'
import { useWallets } from '@privy-io/react-auth/solana'

const AnchorCtx = createContext<Pick<UseAnchorProviderReturn, 'refresh' | 'program' | 'pdas'>>({
    refresh: async () => { },
    program: null,
    pdas: { willPda: null, vaultPda: null },
})

export const useAnchor = () => useContext(AnchorCtx)

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { ready, authenticated } = usePrivy()

    useEffect(() => {
        if (ready && !authenticated) router.replace('/connect')
    }, [ready, authenticated, router])

    if (!ready) return <FullScreenSpinner label="Initialising" />
    if (!authenticated) return null

    return <HydratedLayout>{children}</HydratedLayout>
}

// How many renders to wait before giving up on wallet population.
// Wallet typically populates within 1–2 renders, 5 is a safe ceiling.
const WALLET_SETTLE_RENDERS = 5

function HydratedLayout({ children }: { children: React.ReactNode }) {
    const { loading, error, program, pdas, refresh } = useAnchorProvider()
    const { authenticated, user } = usePrivy()
    const willAccount = useWillStore(s => s.willAccount)
    const vaultAccount = useWillStore(s => s.vaultAccount)
    const { setConnected } = useWillStore()


    const [renderCount, setRenderCount] = useState(0)

    useEffect(() => {
        if (!authenticated || !user?.wallet?.address) {
            setRenderCount(prev => prev + 1)
        }
    })

    const walletSettled =
        (authenticated && !!user?.wallet?.address) ||  // wallet is ready
        renderCount >= WALLET_SETTLE_RENDERS          // or we've waited long enough

    const firstLoad = loading && willAccount === null && vaultAccount === null

    // Without this, wallet.connected is false on render 1 even if it's about to be true.
    if (!walletSettled) {
        return <FullScreenSpinner label="Connecting wallet…" />
    }

    // After settling, if still not connected, the wallet is genuinely absent
    if (!authenticated || !user?.wallet?.address) {
        // You could redirect to /connect here, or show an error state
        return <FullScreenSpinner label="No wallet found — reconnecting…" />
    }
    useEffect(() => {
        if (authenticated) setConnected(true)
    }, [authenticated])
    if (firstLoad) return <FullScreenSpinner label="Loading your will…" />

    return (
        <AnchorCtx.Provider value={{ refresh, program, pdas }}>
            {error && !loading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    zIndex: 50,
                    background: '#fef3c7',
                    borderBottom: '1px solid #fde68a',
                    padding: '10px 20px',
                    fontSize: 13,
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <span>⚠</span>
                    Could not sync with the network — showing cached data.
                    <span
                        style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => refresh()}
                    >
                        Retry
                    </span>
                </div>
            )}
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, minWidth: 0 }}>
                    {children}
                </main>
            </div>
        </AnchorCtx.Provider>
    )
}