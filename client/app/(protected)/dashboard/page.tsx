'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWillStore, WillAccount } from '../../store/useWillStore'
import { mockTx } from '@/lib/utils'
import CreateWillStep from "@/components/Dashboard/createWillStep"
import DepositFundsStep from '@/components/Dashboard/depositFundsStep'
import AddHeirsStep from '@/components/Dashboard/addHeirStep'
import { Phase } from '@/lib/utils/helper'
import { OnboardingProgress } from '@/components/Dashboard/onboarding-progress'
import { useCreateWill } from '@/lib/hooks/useCreateWill'
import { useAnchorProvider } from '@/lib/hooks/useAnchorProvider'
import { useAddHeir } from '@/lib/hooks/useAddHeir'
import PulsingDot from '@/components/ui/pulsing-dot'
import Dashboard from '@/components/Dashboard/dashboard'

export type Heir = {
    id: string;
    walletAddress: string;
    shareBps: number;
    onChain: boolean; // true = already on-chain, false = local only
};
/* ─── Main Dashboard Page ────────────────────────────────────────────── */
export default function DashboardPage() {
    const {
        willAccount,
        vaultAccount,
        heirs: storeHeirs,
        setTxPending,
        performCheckin,
        removeHeir,
        updateHeir
    } = useWillStore()
    const {
        pdas,
        loading,
        refresh
    } = useAnchorProvider()

    const [simWill, setSimWill] = useState<WillAccount | null>(willAccount ?? null)
    const [simHeirs, setSimHeirs] = useState<Heir[]>(storeHeirs ?? [])
    const [loadingStep, setLoadingStep] = useState(false)

    const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward')

    const activeWill = simWill ?? willAccount
    const activeHeirs: Heir[] = simHeirs.length > 0 ? simHeirs : (storeHeirs ?? [])
    console.log('active heir shares', activeHeirs)
    const totalHeirShare = activeHeirs.reduce((s: number, h: Heir) => s + h.shareBps, 0)

    // ── Determine current phase ─────────────────────────────────────────

    const getAutoPhase = (): Phase => {
        if (!activeWill) return 0                                          // no will → must create
        if (activeHeirs.length === 0 || totalHeirShare !== 100) return 1 // no heirs → must add  (note: shareBps is basis points so 100% = 10000)
        if (!vaultAccount || vaultAccount.totalUsdValue <= 0) return 2     // no funds → can skip
        return 'dashboard'
    }

    const [phase, setPhase] = useState<Phase>(getAutoPhase())
    const { createWill } = useCreateWill()
    const { addHeir, error: addHeirError, loading: addHeirLoading } = useAddHeir()

    const completedSteps = [
        !!activeWill,
        activeHeirs.length > 0 && totalHeirShare === 100,
        !!(vaultAccount && vaultAccount.totalUsdValue > 0),
    ]


    const handleCreateWill = async (days: number) => {
        try {
            setLoadingStep(true)
            const success = await createWill(days)
            if (!success) return

            await refresh()  // ← wait for store to update with the new willAccount

            setStepDir('forward')
            setPhase(1)      // ← now activeWill is populated, phase moves forward
        } finally {
            setLoadingStep(false)
        }
    }

    const handleAddHeir = (heirAddress: string, share: number) => {
        setSimHeirs(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                walletAddress: heirAddress,
                shareBps: share,
                onChain: false,  // ← local only, needs to be submitted
            }
        ])
    }

    const handleConfirmHeirs = async (
        onHeirStatus: (id: string, status: 'idle' | 'pending' | 'success' | 'error') => void
    ) => {
        const pendingHeirs = simHeirs.filter(h => !h.onChain)  // ← only submit new ones

        if (pendingHeirs.length === 0) {
            // All already on-chain, just advance
            setStepDir('forward')
            setPhase(2)
            return
        }

        for (const heir of pendingHeirs) {
            onHeirStatus(heir.id, 'pending')
            const success = await addHeir(heir.walletAddress, heir.shareBps * 100)
            onHeirStatus(heir.id, success ? 'success' : 'error')
            if (!success) return
            await new Promise(res => setTimeout(res, 1500))
        }

        // await refresh()
        setStepDir('forward')
        setPhase(2)
    }

    // Fix remove to use local state
    const handleRemoveHeir = (id: string) => {
        setSimHeirs(prev => prev.filter(h => h.id !== id))
    }

    // Fix update to use local state
    const handleUpdateHeir = (id: string, address: string, share: number) => {
        setSimHeirs(prev => prev.map(h =>
            h.id === id ? { ...h, walletAddress: address, shareBps: share } : h
        ))
    }

    const canGoNext = (): boolean => {
        if (phase === 0) return !!activeWill        // must have created will on-chain
        if (phase === 1) return activeHeirs.length > 0 && totalHeirShare === 10000
        if (phase === 2) return true               // fund vault is always skippable
        return false
    }

    const goNext = () => {
        console.log('[goNext] canGoNext:', canGoNext(), {
            phase,
            activeWill: !!activeWill,
            heirsLength: activeHeirs.length,
            totalHeirShare,
            vaultUsd: vaultAccount?.totalUsdValue,
        })

        if (!canGoNext()) return
        // ...
    }

    const goBack = () => {
        setStepDir('back')

        setPhase((prev) => {
            if (prev === 2) return 1
            if (prev === 1) {
                // if will already exists, can't go back to step 0 — it's done
                if (activeWill) return 1
                return 0
            }
            return prev
        })
    }
    // if (!connected) return null

    useEffect(() => {
        if (loading) return
        if (activeWill && activeHeirs.length > 0 && totalHeirShare === 10000) {
            setPhase('dashboard')
            return
        }
        setPhase(getAutoPhase())
    }, [loading, activeWill, activeHeirs.length, totalHeirShare, vaultAccount?.totalUsdValue])

    return (
        <>
            <style>{`
                @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
                @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
            `}</style>

            <div style={{
                width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '28px', boxSizing: 'border-box',
            }}>
                <div style={{ width: '100%', maxWidth: 1100 }}>

                    {/* ── Header ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                    >
                        <div>
                            <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }} className='tracking-tight font-light'>
                                Welcome to Solwill!
                            </h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '3px 0 0', letterSpacing: '0.01em' }}>
                                {phase === 'dashboard'
                                    ? 'Monitoring your decentralised legacy protocol.'
                                    : 'Complete setup to activate your estate protection.'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <PulsingDot color={phase === 'dashboard' ? '#4ade80' : '#f59e0b'} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                {phase === 'dashboard' ? '1 Node Online' : 'Setup Required'}
                            </span>
                        </div>
                    </motion.div>

                    {/* ── Main Content ── */}
                    <AnimatePresence mode="wait">

                        {/* ═══ ONBOARDING WIZARD ═══ */}
                        {phase !== 'dashboard' && (
                            <motion.div
                                key="wizard"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                                style={{
                                    display: 'flex', justifyContent: 'center',
                                    minHeight: 'calc(100vh - 160px)', alignItems: 'center',
                                }}
                            >
                                <div style={{
                                    width: '100%', maxWidth: 760,
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 24, padding: '36px 40px',
                                    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
                                }}>
                                    <OnboardingProgress
                                        goBack={goBack}
                                        goNext={goNext}
                                        currentStep={phase}
                                        completedSteps={completedSteps}
                                        isNextLocked={!canGoNext()}   // ← new prop
                                    />
                                    <AnimatePresence mode="wait">
                                        {phase === 0 && (
                                            <CreateWillStep
                                                key="step-0"
                                                onComplete={handleCreateWill}
                                                isLoading={loadingStep}
                                                dir={stepDir}
                                            />
                                        )}
                                        {phase === 1 && (
                                            <AddHeirsStep
                                                heirs={simHeirs}
                                                onAdd={handleAddHeir}
                                                onUpdate={handleUpdateHeir}
                                                onRemove={handleRemoveHeir}
                                                onComplete={handleConfirmHeirs}  // ← new signature
                                                isLoading={addHeirLoading}
                                                dir={stepDir}
                                            />
                                        )}
                                        {phase === 2 && (
                                            <DepositFundsStep
                                                key="step-2"
                                                dir={stepDir}
                                                setPhase={setPhase}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ FULL DASHBOARD ═══ */}
                        {phase === 'dashboard' && activeWill && vaultAccount && (
                            <Dashboard
                                activeHeirs={activeHeirs}
                                activeWill={activeWill}
                                vaultAccount={vaultAccount}

                            />
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </>
    )
}