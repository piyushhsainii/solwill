'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWillStore } from '@/app/store/useWillStore'
import { useAnchorProvider } from '@/lib/hooks/useAnchorProvider'
import Sidebar from '@/components/ui/sidebar'
import { UseAnchorProviderReturn } from '@/lib/utils/helper'
import FullScreenLoader from '@/components/ui/MasterSpinner'

type AnchorCtxValue = Pick<UseAnchorProviderReturn, 'refresh' | 'program' | 'pdas' | 'loading' | 'loadingStep'>

const AnchorCtx = createContext<AnchorCtxValue>({
    refresh: async () => { },
    program: null,
    pdas: { willPda: null, vaultPda: null },
    loading: true,
    loadingStep: 'wallet',
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
            <FullScreenLoader />
        )
    }

    return <HydratedLayout>{children}</HydratedLayout>
}

// ─── Inner layout: chain data + sidebar ───────────────────────────────────────
function HydratedLayout({ children }: { children: React.ReactNode }) {
    const { program, pdas, refresh, loading, loadingStep, initializing, error } = useAnchorProvider()

    useEffect(() => {
        useWillStore.getState().setConnected(true)
    }, [])

    return (
        <AnchorCtx.Provider value={{ refresh, program, pdas, loading, loadingStep }}>
            {initializing && <FullScreenLoader step={loadingStep} />}  {/* ← was `loading` */}

            {!initializing && (
                <>
                    {/* error banner */}
                    <div style={{ display: 'flex', minHeight: '100vh' }}>
                        <Sidebar />
                        <main style={{ flex: 1, minWidth: 0 }} className="mt-20">
                            {children}
                        </main>
                    </div>
                </>
            )}
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