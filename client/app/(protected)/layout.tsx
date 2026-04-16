'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWillStore } from '@/app/store/useWillStore'
import { useAnchorProvider, type UseAnchorProviderReturn } from '@/lib/hooks/useAnchorProvider'
import Sidebar from '@/components/ui/sidebar'
import FullScreenSpinner from '@/components/ui/full-screen-spinner'

/* ─── Refresh context — lets any child page call refresh() after a tx ─── */
const AnchorCtx = createContext<Pick<UseAnchorProviderReturn, 'refresh' | 'program' | 'pdas'>>({
    refresh: async () => { },
    program: null,
    pdas: { willPda: null, vaultPda: null },
})

export const useAnchor = () => useContext(AnchorCtx)

/* ─── Root layout guard ──────────────────────────────────────────────── */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { ready, authenticated } = usePrivy()

    useEffect(() => {
        if (ready && !authenticated) router.replace('/connect')
    }, [ready, authenticated, router])

    if (!ready) return <FullScreenSpinner label="Initialising…" />
    if (!authenticated) return null

    // Only mount HydratedLayout once Privy confirms auth so
    // useAnchorProvider sees a populated wallets[] array on first render
    return <HydratedLayout>{children}</HydratedLayout>
}

/* ─── Inner layout — runs after auth confirmed ───────────────────────── */
function HydratedLayout({ children }: { children: React.ReactNode }) {
    const { loading, error, program, pdas, refresh, } = useAnchorProvider()

    // Both slices start as null in the store (no seed data).
    // firstLoad = true only on the very first fetch before chain data arrives.
    const willAccount = useWillStore(s => s.willAccount)
    const vaultAccount = useWillStore(s => s.vaultAccount)
    const connected = useWillStore(s => s.connected)

    // We are in first-load state when:
    //   - a fetch is in flight AND
    //   - neither slice has been populated yet
    const firstLoad = loading && willAccount === null && vaultAccount === null

    if (firstLoad) return <FullScreenSpinner label="Loading your will…" />

    // connected is set synchronously by useAnchorProvider as soon as the
    // wallet address is known — before the async chain fetch completes.
    // If it's still false here something is wrong with Privy wallet resolution.
    // console.log(first)
    console.log(connected)
    if (!connected) return <FullScreenSpinner label="Connecting wallet…" />

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
                    fontFamily: '"DM Sans", sans-serif',
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


