'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWillStore } from '@/app/store/useWillStore'
import { useAnchorProvider } from '@/lib/hooks/useAnchorProvider'
import Sidebar from '@/components/ui/sidebar'
import FullScreenSpinner from '@/components/ui/full-screen-spinner'
import { UseAnchorProviderReturn } from '@/lib/utils/helper'

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

function HydratedLayout({ children }: { children: React.ReactNode }) {
    const { loading, error, program, pdas, refresh, Heirs } = useAnchorProvider()
    const { authenticated, user } = usePrivy()
    const willAccount = useWillStore(s => s.willAccount)
    const vaultAccount = useWillStore(s => s.vaultAccount)
    const heirs = useWillStore(s => s.setHeirs)
    heirs(Heirs);

    // Set connected once on mount — use getState() to avoid selector instability
    useEffect(() => {
        if (authenticated) {
            useWillStore.getState().setConnected(true)
        }
    }, [authenticated])

    // Still loading chain data for the first time
    const firstLoad = loading && willAccount === null && vaultAccount === null

    if (!user?.wallet?.address) return <FullScreenSpinner label="Connecting wallet…" />
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