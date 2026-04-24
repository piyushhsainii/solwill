'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWillStore } from '@/app/store/useWillStore'
import { useAnchorProvider } from '@/lib/hooks/useAnchorProvider'
import Sidebar from '@/components/ui/sidebar'
import { UseAnchorProviderReturn } from '@/lib/utils/helper'

// ─── Anchor context ────────────────────────────────────────────────────────────
// Context exists purely to share ONE useAnchorProvider instance across the tree.
// Without it, every consumer would call the hook independently and get separate
// program/pda instances. If NO child currently needs program/pdas/refresh,
// you can delete the context entirely and call useAnchorProvider in the
// component that needs it.
type AnchorCtxValue = Pick<UseAnchorProviderReturn, 'refresh' | 'program' | 'pdas' | 'loading'>

const AnchorCtx = createContext<AnchorCtxValue>({
    refresh: async () => { },
    program: null,
    pdas: { willPda: null, vaultPda: null },
    loading: true,
})

export const useAnchor = () => useContext(AnchorCtx)

// ─── Root gate: auth only ──────────────────────────────────────────────────────
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { ready, authenticated } = usePrivy()

    useEffect(() => {
        if (ready && !authenticated) router.replace('/connect')
    }, [ready, authenticated, router])

    // One simple spinner until Privy is ready
    if (!ready || !authenticated) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                color: 'var(--color-text-secondary)',
                fontSize: 14,
                gap: 10,
            }}>
                <Spinner />
                {!ready ? 'Initialising…' : 'Redirecting…'}
            </div>
        )
    }

    return <HydratedLayout>{children}</HydratedLayout>
}

// ─── Inner layout: chain data + sidebar ───────────────────────────────────────
function HydratedLayout({ children }: { children: React.ReactNode }) {
    const { user } = usePrivy()
    const { program, pdas, refresh, loading, error, Heirs } = useAnchorProvider()

    const willAccount = useWillStore(s => s.willAccount)
    const vaultAccount = useWillStore(s => s.vaultAccount)

    // Sync heirs into store whenever they arrive
    useEffect(() => {
        if (Heirs !== undefined) useWillStore.getState().setHeirs(Heirs)
    }, [Heirs])

    // Mark wallet connected once
    useEffect(() => {
        useWillStore.getState().setConnected(true)
    }, []) // runs once on mount; `authenticated` is guaranteed true here

    const firstLoad = loading && willAccount === null && vaultAccount === null

    // Single loading state — wallet hydration or first chain fetch
    if (!user?.wallet?.address || firstLoad) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                color: 'var(--color-text-secondary)',
                fontSize: 14,
                gap: 10,
            }}>
                <Spinner />
                {!user?.wallet?.address ? 'Connecting wallet…' : 'Loading your will…'}
            </div>
        )
    }

    return (
        <AnchorCtx.Provider value={{ refresh, program, pdas, loading }}>
            {/* Error banner — only shown after load completes */}
            {error && !loading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    zIndex: 50,
                    background: 'var(--color-background-warning)',
                    borderBottom: '1px solid var(--color-border-warning)',
                    padding: '8px 20px',
                    fontSize: 13,
                    color: 'var(--color-text-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <span style={{ fontSize: 14 }}>⚠</span>
                    Could not sync with the network — showing cached data.
                    <button
                        onClick={() => refresh()}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: 'inherit',
                            fontSize: 'inherit',
                            padding: 0,
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, minWidth: 0 }} className="mt-20">
                    {children}
                </main>
            </div>
        </AnchorCtx.Provider>
    )
}

// ─── Minimal inline spinner ────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg
            width="16" height="16"
            viewBox="0 0 16 16"
            style={{ animation: 'spin 0.8s linear infinite' }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}